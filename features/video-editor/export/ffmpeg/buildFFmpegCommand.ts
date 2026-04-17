import { TemplateSequenceEffect } from "@/types/template";
import {
  AudioTrackItem,
  ProjectTrack,
  VideoProject,
  VideoTrackItem,
} from "../../domain/video-project";
import {
  FFmpegCommandSpec,
  FFmpegFilterNode,
  FFmpegInputSpec,
} from "./command-spec";

function formatSeconds(ms: number) {
	return (ms / 1000).toFixed(3);
}

function escapeFilterText(value: string) {
	return value.replace(/:/g, "\\:").replace(/'/g, "\\'");
}

function buildMediaInputArgs(item: VideoTrackItem) {
	if (item.sourceType === "image") {
		return [
			"-loop",
			"1",
			"-t",
			formatSeconds(item.durationMs),
			"-i",
			item.sourceUri,
		];
	}

	return ["-i", item.sourceUri];
}

function buildCoverCropFilter(width: number, height: number) {
	const targetWidth = Math.max(1, Math.round(width));
	const targetHeight = Math.max(1, Math.round(height));

	return [
		"setsar=1",
		`scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase`,
		`crop=${targetWidth}:${targetHeight}`,
	];
}

function isPortraitTarget(width: number, height: number) {
	return height > width;
}

function buildBlurBackgroundVideoNodes(
	inputLabel: string,
	outputLabel: string,
	baseFilters: string[],
	width: number,
	height: number,
	fps?: number,
	opacity?: number,
): FFmpegFilterNode[] {
	const targetWidth = Math.max(1, Math.round(width));
	const targetHeight = Math.max(1, Math.round(height));
	const backgroundLabel = `${outputLabel}_bg`;
	const foregroundLabel = `${outputLabel}_fg`;
	const composedLabel = opacity != null && opacity < 1 ? `${outputLabel}_composed` : outputLabel;
	const leadFilters = [...baseFilters];

	if (typeof fps === "number") {
		leadFilters.push(`fps=${fps}`);
	}

	leadFilters.push("setsar=1");

	const nodes: FFmpegFilterNode[] = [
		{
			inputLabels: [inputLabel],
			filter: `${leadFilters.join(",")},split=2[${backgroundLabel}][${foregroundLabel}]`,
		},
		{
			inputLabels: [backgroundLabel],
			filter: [
				`scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase`,
				`crop=${targetWidth}:${targetHeight}`,
				"gblur=sigma=22",
			].join(","),
			outputLabel: `${outputLabel}_bg_blur`,
		},
		{
			inputLabels: [foregroundLabel],
			filter: `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease`,
			outputLabel: `${outputLabel}_fg_fit`,
		},
		{
			inputLabels: [`${outputLabel}_bg_blur`, `${outputLabel}_fg_fit`],
			filter: "overlay=(W-w)/2:(H-h)/2:shortest=1",
			outputLabel: composedLabel,
		},
	];

	if (opacity != null && opacity < 1) {
		nodes.push({
			inputLabels: [composedLabel],
			filter: `format=rgba,colorchannelmixer=aa=${opacity.toFixed(3)}`,
			outputLabel,
		});
	}

	return nodes;
}

function getTrackItems<T extends VideoTrackItem | AudioTrackItem>(
	tracks: ProjectTrack[],
	type: "video" | "audio",
) {
	return tracks
		.filter((track) => track.type === type)
		.flatMap((track) => track.items)
		.filter((item): item is T => item.kind === type && item.visible);
}

function resolveSequenceTransitionEffect(
	project: VideoProject,
): TemplateSequenceEffect {
	const effect = project.metadata?.template?.sequenceEffect as string | undefined;

	switch (effect) {
		case "blur":
		case "zoom":
		case "contrast-pop":
		case "pixelate":
		case "hlslice":
		case "hrslice":
		case "fadeblack":
		case "diagtl":
		case "flash-shake":
		case "rgb-split":
		case "glow":
		case "vhs-retro":
		case "light-point":
		case "wipe-left":
		case "wipe-up":
		case "circle-close":
			return effect;
		case "fade":
		default:
			return "fade";
	}
}

function buildSequenceVideoTransitionFilter(
	effect: TemplateSequenceEffect,
	transitionDurationMs: number,
	offsetMs: number,
	canvasWidth: number,
	canvasHeight: number,
) {
	const duration = formatSeconds(transitionDurationMs);
	const offset = formatSeconds(offsetMs);
	const transitionByEffect: Record<
		Exclude<
			TemplateSequenceEffect,
			"contrast-pop" | "pixelate" | "flash-shake" | "rgb-split" | "glow" | "vhs-retro"
		>,
		string
	> = {
		fade: "fade",
		fadeblack: "fadeblack",
		blur: "hblur",
		diagtl: "diagtl",
		hlslice: "hlslice",
		hrslice: "hrslice",
		zoom: "zoomin",
		"light-point": "circleopen",
		"wipe-left": "wipeleft",
		"wipe-up": "wipeup",
		"circle-close": "circleclose",
	};

	if (effect === "contrast-pop") {
		const end = formatSeconds(offsetMs + transitionDurationMs);
		const mid = formatSeconds(offsetMs + transitionDurationMs / 2);
		const halfDuration = Math.max(0.001, transitionDurationMs / 2000);
		const peakExpr = `if(lt(t,${offset}),0,if(lt(t,${mid}),(t-${offset})/${halfDuration},if(lt(t,${end}),(${end}-t)/${halfDuration},0)))`;

		return [
			`xfade=transition=fade:duration=${duration}:offset=${offset}`,
			`eq=saturation='1+1.1*(${peakExpr})':contrast='1+0.65*(${peakExpr})':brightness='0.05*(${peakExpr})':gamma='1-0.12*(${peakExpr})':eval=frame`,
			`scale=w='${canvasWidth}*(1+0.12*(${peakExpr}))':h='${canvasHeight}*(1+0.12*(${peakExpr}))':eval=frame`,
			`crop=${canvasWidth}:${canvasHeight}`,
		].join(",");
	}

	if (effect === "pixelate") {
		const maxBlockSize = Math.max(
			8,
			Math.round(Math.min(canvasWidth, canvasHeight) * 0.08),
		);
		const peakExpr = "if(lt(P,0.5),2*P,2*(1-P))";
		const blockExpr = `max(1,1+${maxBlockSize}*${peakExpr})`;
		const sampleX = `X-mod(X,${blockExpr})`;
		const sampleY = `Y-mod(Y,${blockExpr})`;
		const sourceSample = (prefix: "a" | "b") =>
			`if(eq(PLANE,0),${prefix}0(${sampleX},${sampleY}),if(eq(PLANE,1),${prefix}1(${sampleX},${sampleY}),if(eq(PLANE,2),${prefix}2(${sampleX},${sampleY}),${prefix}3(${sampleX},${sampleY}))))`;
		const pixelateExpr = `if(gt(P,0.5),${sourceSample("a")},${sourceSample("b")})`;

		return [
			`xfade=transition=custom:expr='${pixelateExpr}':duration=${duration}:offset=${offset}`,
		].join(",");
	}

	if (effect === "flash-shake") {
		const end = formatSeconds(offsetMs + transitionDurationMs);
		const flashEnd = formatSeconds(
			offsetMs + Math.max(80, Math.min(transitionDurationMs * 0.32, 220)),
		);
		const shakeMargin = 10;
		const cropWidth = Math.max(1, canvasWidth - shakeMargin * 2);
		const cropHeight = Math.max(1, canvasHeight - shakeMargin * 2);

		return [
			`xfade=transition=fade:duration=${duration}:offset=${offset}`,
			`crop=${cropWidth}:${cropHeight}:x='${shakeMargin}+if(between(t,${offset},${end}),random(1)*12-6,0)':y='${shakeMargin}+if(between(t,${offset},${end}),random(1)*12-6,0)'`,
			`scale=${canvasWidth}:${canvasHeight}`,
			`eq=brightness='if(between(t,${offset},${flashEnd}),0.18,0)':eval=frame`,
			`unsharp=5:5:1.2:5:5:0.0:enable='between(t,${offset},${end})'`,
		].join(",");
	}

	if (effect === "rgb-split") {
		const end = formatSeconds(offsetMs + transitionDurationMs);

		return [
			`xfade=transition=fade:duration=${duration}:offset=${offset}`,
			`rgbashift=rh=-8:rv=0:gh=0:gv=0:bh=8:bv=0:enable='between(t,${offset},${end})'`,
			`eq=contrast=1.18:saturation=1.12:enable='between(t,${offset},${end})'`,
		].join(",");
	}

	if (effect === "glow") {
		const end = formatSeconds(offsetMs + transitionDurationMs);

		return [
			`xfade=transition=fade:duration=${duration}:offset=${offset}`,
			`gblur=sigma=18:steps=2:enable='between(t,${offset},${end})'`,
			`eq=brightness=0.03:saturation=1.2:contrast=1.12:gamma=0.95:enable='between(t,${offset},${end})'`,
		].join(",");
	}

	if (effect === "vhs-retro") {
		const end = formatSeconds(offsetMs + transitionDurationMs);

		return [
			`xfade=transition=fade:duration=${duration}:offset=${offset}`,
			`eq=contrast=1.1:saturation=0.75:brightness=0.02:enable='between(t,${offset},${end})'`,
			`noise=alls=12:allf=t:enable='between(t,${offset},${end})'`,
			`curves=vintage:enable='between(t,${offset},${end})'`,
			`tblend=all_mode=lighten:enable='between(t,${offset},${end})'`,
		].join(",");
	}

	return `xfade=transition=${transitionByEffect[effect]}:duration=${duration}:offset=${offset}`;
}

function buildSequenceFFmpegCommand(project: VideoProject): FFmpegCommandSpec {
	const sequenceEffect = resolveSequenceTransitionEffect(project);
	const visualItems = getTrackItems<VideoTrackItem>(
		project.tracks,
		"video",
	).sort((left, right) => left.startMs - right.startMs);

	if (visualItems.length === 0) {
		throw new Error("El proyecto no contiene capas de video exportables.");
	}

	const inputs: FFmpegInputSpec[] = visualItems.map((item, index) => ({
		id: `sequence_${index}`,
		uri: item.sourceUri,
		args: buildMediaInputArgs(item),
	}));
	const filters: FFmpegFilterNode[] = [];

	visualItems.forEach((item, index) => {
		const isImage = item.sourceType === "image";
		const trimStartMs = isImage ? 0 : item.trimStartMs ?? 0;
		const trimDurationMs = isImage
			? Math.max(1, item.durationMs)
			: Math.max(
					1,
					(item.trimEndMs ?? trimStartMs + item.durationMs) - trimStartMs,
			  );
		const baseOutputLabel = `v_seq_base_${index}`;
		const outputLabel = `v_seq_${index}`;
		const baseFilters = [
			`trim=start=${formatSeconds(trimStartMs)}:duration=${formatSeconds(trimDurationMs)}`,
			"setpts=PTS-STARTPTS",
		];

		filters.push({
			inputLabels: [`${index}:v`],
			filter: [
				...baseFilters,
				`fps=${project.canvas.fps}`,
				...buildCoverCropFilter(project.canvas.width, project.canvas.height),
			].join(","),
			outputLabel: baseOutputLabel,
		});

		filters.push(
			{
				inputLabels: [baseOutputLabel],
				filter: "null",
				outputLabel,
			},
		);

		const audioBaseLabel = `a_seq_base_${index}`;
		if (isImage) {
			filters.push({
				inputLabels: [],
				filter: `anullsrc=channel_layout=stereo:sample_rate=44100:d=${formatSeconds(trimDurationMs)}`,
				outputLabel: audioBaseLabel,
			});
		} else {
			filters.push({
				inputLabels: [`${index}:a`],
				filter: [
					`atrim=start=${formatSeconds(trimStartMs)}:duration=${formatSeconds(trimDurationMs)}`,
					"asetpts=PTS-STARTPTS",
					"aresample=async=1:first_pts=0",
				].join(","),
				outputLabel: audioBaseLabel,
			});
		}

		filters.push(
			{
				inputLabels: [audioBaseLabel],
				filter: "anull",
				outputLabel: `a_seq_${index}`,
			},
		);
	});

	let currentVideoLabel = "v_seq_0";
	let currentVideoDurationMs = visualItems[0]?.durationMs ?? 0;
	for (let index = 1; index < visualItems.length; index += 1) {
		const currentItem = visualItems[index];
		const transitionDurationMs =
			currentItem?.transition?.type === "fade"
				? currentItem.transition.durationMs
				: 0;
		const outputLabel = `v_xfade_${index}`;
		const nextDurationMs = visualItems[index]?.durationMs ?? 0;

		filters.push({
			inputLabels: [currentVideoLabel, `v_seq_${index}`],
			filter:
				transitionDurationMs > 0
					? buildSequenceVideoTransitionFilter(
							sequenceEffect,
							transitionDurationMs,
							Math.max(0, currentVideoDurationMs - transitionDurationMs),
							project.canvas.width,
							project.canvas.height,
						)
					: `concat=n=2:v=1:a=0`,
			outputLabel,
		});

		currentVideoLabel = outputLabel;
		currentVideoDurationMs += Math.max(0, nextDurationMs - transitionDurationMs);
	}

	let finalAudioLabel = "a_seq_0";
	for (let index = 1; index < visualItems.length; index += 1) {
		const currentItem = visualItems[index];
		const transitionDurationMs =
			currentItem?.transition?.type === "fade"
				? currentItem.transition.durationMs
				: 0;
		const outputLabel = `a_xfade_${index}`;

		filters.push({
			inputLabels: [finalAudioLabel, `a_seq_${index}`],
			filter:
				transitionDurationMs > 0
					? `acrossfade=d=${formatSeconds(transitionDurationMs)}`
					: "concat=n=2:v=0:a=1",
			outputLabel,
		});

		finalAudioLabel = outputLabel;
	}

	const filterComplex = filters
		.map((node) => {
			const inputsPart = node.inputLabels.map((label) => `[${label}]`).join("");
			return node.outputLabel
				? `${inputsPart}${node.filter}[${node.outputLabel}]`
				: `${inputsPart}${node.filter}`;
		})
		.join(";");

	const outputArgs = [
		"-filter_complex",
		filterComplex,
		"-map",
		`[${currentVideoLabel}]`,
		"-map",
		`[${finalAudioLabel}]`,
		"-t",
		formatSeconds(project.canvas.durationMs),
		"-r",
		String(project.canvas.fps),
		"-c:v",
		"h264_mediacodec",
		"-b:v",
		"8M",
		"-maxrate",
		"12M",
		"-bufsize",
		"16M",
		"-pix_fmt",
		"yuv420p",
		"-c:a",
		"aac",
		"-movflags",
		"+faststart",
	];

	return {
		inputs,
		filterGraph: filters,
		outputArgs,
		command: [
			"-y",
			...inputs.flatMap((input) => input.args),
			...outputArgs,
			"<output-path>",
		],
	};
}

export function buildFFmpegCommand(project: VideoProject): FFmpegCommandSpec {
	if (
		project.templateId === "vertical-sequence" ||
		project.templateId === "landscape-sequence"
	) {
		return buildSequenceFFmpegCommand(project);
	}

	const visualItems = getTrackItems<VideoTrackItem>(
		project.tracks,
		"video",
	).sort((left, right) => left.zIndex - right.zIndex);
	const audioItems = getTrackItems<AudioTrackItem>(project.tracks, "audio");

	if (visualItems.length === 0) {
		throw new Error("El proyecto no contiene capas de video exportables.");
	}

	const inputs: FFmpegInputSpec[] = [];
	const filters: FFmpegFilterNode[] = [];
	const canvas = project.canvas;

	const backgroundLabel = "bg0";
	filters.push({
		inputLabels: [],
		filter: `color=c=${escapeFilterText(canvas.backgroundColor)}:s=${canvas.width}x${canvas.height}:r=${canvas.fps}:d=${formatSeconds(canvas.durationMs)}`,
		outputLabel: backgroundLabel,
	});

	let currentVisualLabel = backgroundLabel;

	visualItems.forEach((item, index) => {
		const inputId = `video_${index}`;
		inputs.push({
			id: inputId,
			uri: item.sourceUri,
			args: buildMediaInputArgs(item),
		});

		const preparedLabel = `${inputId}_prepared`;

		const isImage = item.sourceType === "image";
		const trimStartMs = isImage ? 0 : item.trimStartMs ?? 0;
		const trimDurationMs = isImage
			? Math.max(1, item.durationMs)
			: Math.max(
					1,
					(item.trimEndMs ?? trimStartMs + item.durationMs) - trimStartMs,
			  );

		const baseFilters = [
			`trim=start=${formatSeconds(trimStartMs)}:duration=${formatSeconds(trimDurationMs)}`,
			"setpts=PTS-STARTPTS",
		];

		if (item.rotation !== 0) {
			baseFilters.push(
				`rotate=${item.rotation}*PI/180:ow=rotw(iw):oh=roth(ih)`,
			);
		}

		if (
			!isImage &&
			isPortraitTarget(canvas.width, canvas.height) &&
			isPortraitTarget(item.layout.width, item.layout.height)
		) {
			filters.push(
				...buildBlurBackgroundVideoNodes(
					`${index}:v`,
					preparedLabel,
					baseFilters,
					item.layout.width,
					item.layout.height,
					undefined,
					item.opacity,
				),
			);
		} else {
			baseFilters.push(
				...buildCoverCropFilter(item.layout.width, item.layout.height),
			);

			if (item.opacity < 1) {
				baseFilters.push(
					`format=rgba,colorchannelmixer=aa=${item.opacity.toFixed(3)}`,
				);
			}

			filters.push({
				inputLabels: [`${index}:v`],
				filter: baseFilters.join(","),
				outputLabel: preparedLabel,
			});
		}

		const outputLabel = `v_comp_${index}`;
		filters.push({
			inputLabels: [currentVisualLabel, preparedLabel],
			filter: `overlay=${Math.round(item.layout.x + item.transform.translateX)}:${Math.round(item.layout.y + item.transform.translateY)}:shortest=1`,
			outputLabel,
		});
		currentVisualLabel = outputLabel;
	});

	const audioOutputLabels: string[] = [];

	audioItems.forEach((item, index) => {
		const inputId = `audio_${index}`;
		inputs.push({
			id: inputId,
			uri: item.sourceUri,
			args: ["-i", item.sourceUri],
		});

		const trimStartMs = item.trimStartMs ?? 0;
		const trimDurationMs = Math.max(
			1,
			(item.trimEndMs ?? trimStartMs + item.durationMs) - trimStartMs,
		);
		const delayMs = Math.max(0, item.startMs);
		const outputLabel = `${inputId}_mix`;

		filters.push({
			inputLabels: [`${visualItems.length + index}:a`],
			filter: [
				`atrim=start=${formatSeconds(trimStartMs)}:duration=${formatSeconds(trimDurationMs)}`,
				"asetpts=PTS-STARTPTS",
				`volume=${item.volume.toFixed(3)}`,
				`adelay=${delayMs}|${delayMs}`,
			].join(","),
			outputLabel,
		});

		audioOutputLabels.push(outputLabel);
	});

	let finalAudioLabel = "";
	if (audioOutputLabels.length > 0) {
		finalAudioLabel = "a_mix";
		filters.push({
			inputLabels: audioOutputLabels,
			filter: `amix=inputs=${audioOutputLabels.length}:duration=shortest:dropout_transition=0`,
			outputLabel: finalAudioLabel,
		});
	}

	const filterComplex = filters
		.map((node) => {
			const inputsPart = node.inputLabels.map((label) => `[${label}]`).join("");
			return node.outputLabel
				? `${inputsPart}${node.filter}[${node.outputLabel}]`
				: `${inputsPart}${node.filter}`;
		})
		.join(";");

	const outputArgs = [
		"-filter_complex",
		filterComplex,
		"-map",
		`[${currentVisualLabel}]`,
	];

	if (finalAudioLabel) {
		outputArgs.push("-map", `[${finalAudioLabel}]`);
	}

	outputArgs.push(
		"-t",
		formatSeconds(project.canvas.durationMs),
		"-r",
		String(project.canvas.fps),
		"-c:v",
		"h264_mediacodec",
		"-b:v",
		"8M",
		"-maxrate",
		"12M",
		"-bufsize",
		"16M",
		"-pix_fmt",
		"yuv420p",
		"-c:a",
		"aac",
		"-movflags",
		"+faststart",
	);

	const command = [
		"-y",
		...inputs.flatMap((input) => input.args),
		...outputArgs,
		"<output-path>",
	];

	return {
		inputs,
		filterGraph: filters,
		outputArgs,
		command,
	};
}
