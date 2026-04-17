import VideoThumbnail from "@/components/VideoThumbnail";
import ReorderableClipList from "@/components/templates/ReorderableClipList";
import TemplateThumbnailLoadingIndicator from "@/components/templates/TemplateThumbnailLoadingIndicator";
import { useVideoThumbnailPrefetch } from "@/hooks/useVideoThumbnailPrefetch";
import { TemplateSequenceEffect } from "@/types/template";
import { VideoView, useVideoPlayer } from "expo-video";
import { PressableFeedback } from "heroui-native";
import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { TemplateViewProps } from "./template-view.types";

const EFFECT_PREVIEW_VIDEOS = {
	fade: require("../../assets/videos/effects/fade.mp4"),
	blur: require("../../assets/videos/effects/blur.mp4"),
	zoom: require("../../assets/videos/effects/zoom.mp4"),
	"contrast-pop": require("../../assets/videos/effects/contrast-pop.mp4"),
	pixelate: require("../../assets/videos/effects/pixelate.mp4"),
	hlslice: require("../../assets/videos/effects/hlslice.mp4"),
	hrslice: require("../../assets/videos/effects/hrslice.mp4"),
	fadeblack: require("../../assets/videos/effects/fadeblack.mp4"),
	diagtl: require("../../assets/videos/effects/diagtl.mp4"),
	"flash-shake": require("../../assets/videos/effects/flash-shake.mp4"),
	"rgb-split": require("../../assets/videos/effects/rgb-split.mp4"),
	glow: require("../../assets/videos/effects/glow.mp4"),
	"vhs-retro": require("../../assets/videos/effects/vhs-retro.mp4"),
	"light-point": require("../../assets/videos/effects/light-point.mp4"),
	"wipe-left": require("../../assets/videos/effects/wipe-left.mp4"),
	"wipe-up": require("../../assets/videos/effects/wipe-up.mp4"),
	"circle-close": require("../../assets/videos/effects/circle-close.mp4"),
} satisfies Record<TemplateSequenceEffect, number>;

const EFFECT_PREVIEW_START_SECONDS = 1.5;

const EFFECT_OPTIONS = [
	{
		id: "fade",
		label: "Fundido",
	},
	{
		id: "blur",
		label: "Blur",
	},
	{
		id: "zoom",
		label: "Zoom",
	},
	{
		id: "contrast-pop",
		label: "Color Boost",
	},
	{
		id: "pixelate",
		label: "Pixelate",
	},
	{
		id: "hlslice",
		label: "HL Slice",
	},
	{
		id: "hrslice",
		label: "HR Slice",
	},
	{
		id: "fadeblack",
		label: "Fade Black",
	},
	{
		id: "diagtl",
		label: "Diag TL",
	},
	{
		id: "flash-shake",
		label: "Flash + Shake",
	},
	{
		id: "rgb-split",
		label: "RGB Split",
	},
	{
		id: "glow",
		label: "Glow",
	},
	{
		id: "vhs-retro",
		label: "VHS Retro",
	},
	{
		id: "light-point",
		label: "Punto de luz",
	},
	{
		id: "wipe-left",
		label: "Barrido lateral",
	},
	{
		id: "wipe-up",
		label: "Barrido vertical",
	},
	{
		id: "circle-close",
		label: "Cierre circular",
	},
] as const satisfies {
	id: TemplateSequenceEffect;
	label: string;
}[];

function EffectPreviewVideo({
	isSelected,
	source,
}: {
	isSelected: boolean;
	source: number;
}) {
	const player = useVideoPlayer(source, (videoPlayer) => {
		videoPlayer.loop = true;
		videoPlayer.muted = true;
		videoPlayer.audioMixingMode = "mixWithOthers";
	});

	useEffect(() => {
		if (isSelected) {
			player.currentTime = EFFECT_PREVIEW_START_SECONDS;
			player.play();
			return;
		}

		player.pause();
		player.currentTime = EFFECT_PREVIEW_START_SECONDS;
	}, [isSelected, player]);

	return (
		<VideoView
			player={player}
			nativeControls={false}
			contentFit="contain"
			style={{ width: "100%", height: "100%" }}
		/>
	);
}

export default function VideoSequenceTemplateView({
	instance,
	project,
	selectedUris,
	foregroundColor,
	onMove,
	onSetSequenceEffect,
	onSetSequenceTransitionSeconds,
}: TemplateViewProps) {
	const orderedUris = selectedUris;
	const previewUris = orderedUris.slice(0, 2);
	const [primaryPreviewUri, secondaryPreviewUri] = previewUris;
	const mediaTypesByUri = new Map(
		project.tracks
			.filter((track) => track.type === "video")
			.flatMap((track) => track.items)
			.filter((item) => item.kind === "video")
			.map((item) => [item.sourceUri, item.sourceType ?? "video"]),
	);
	const selectedEffect = instance.style.sequenceEffect ?? "fade";
	const transitionSeconds = Math.max(0, instance.style.sequenceTransitionSeconds ?? 1);
	const [transitionInput, setTransitionInput] = useState(String(transitionSeconds));
	const selectedEffectLabel =
		EFFECT_OPTIONS.find((effect) => effect.id === selectedEffect)?.label ?? "Fundido";
	const thumbnailLoading = useVideoThumbnailPrefetch(previewUris);

	useEffect(() => {
		setTransitionInput(String(transitionSeconds));
	}, [transitionSeconds]);

	function commitTransitionSeconds(rawValue: string) {
		const parsed = Number(rawValue.replace(",", "."));
		const nextValue = Number.isFinite(parsed)
			? Math.min(10, Math.max(0, Math.round(parsed * 10) / 10))
			: transitionSeconds;

		setTransitionInput(String(nextValue));
		onSetSequenceTransitionSeconds(nextValue);
	}

	return (
		<ScrollView
			className="flex-1"
			contentContainerClassName="flex-grow px-6 pb-10 pt-6"
			showsVerticalScrollIndicator={false}
		>
			<View className="mb-8 items-center">
				<View
					className="w-full max-w-[320px] overflow-hidden rounded-2xl bg-surface-secondary p-3"
					style={{
						aspectRatio: project.canvas.width / project.canvas.height,
						backgroundColor: project.canvas.backgroundColor,
					}}
				>
					<TemplateThumbnailLoadingIndicator
						loadedCount={thumbnailLoading.loadedCount}
						totalCount={thumbnailLoading.totalCount}
					/>
					{secondaryPreviewUri ? (
						<View
							className="absolute overflow-hidden rounded-2xl border border-background/70 bg-surface-tertiary"
							style={{
								top: 28,
								right: 12,
								bottom: 92,
								left: 86,
								opacity: 0.72,
								zIndex: 1,
							}}
						>
							<VideoThumbnail
								uri={secondaryPreviewUri}
								mediaType={mediaTypesByUri.get(secondaryPreviewUri) ?? "video"}
								className="h-full w-full rounded-none"
							/>
						</View>
					) : null}
					{primaryPreviewUri ? (
						<View
							className="absolute overflow-hidden rounded-2xl border border-background bg-surface-secondary"
							style={{
								top: 12,
								right: secondaryPreviewUri ? 48 : 12,
								bottom: 76,
								left: 12,
								zIndex: 2,
							}}
						>
							<VideoThumbnail
								uri={primaryPreviewUri}
								mediaType={mediaTypesByUri.get(primaryPreviewUri) ?? "video"}
								className="h-full w-full rounded-none"
							/>
						</View>
					) : null}
					<View className="absolute bottom-4 left-4 right-4 rounded-xl bg-background/70 px-4 py-3">
						<Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
							Video Sequence
						</Text>
						<Text className="mt-1 text-sm leading-5 text-foreground">
							{`${orderedUris.length} clips enlazados con ${selectedEffectLabel.toLowerCase()}.`}
						</Text>
					</View>
				</View>
			</View>

			<View className="mb-6 rounded-2xl bg-surface-secondary p-4">
				<View className="mb-4 flex-row items-center justify-between gap-4">
					<Text className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
						Efecto
					</Text>
					<Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
						{selectedEffectLabel}
					</Text>
				</View>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="gap-3 pr-2"
				>
					{EFFECT_OPTIONS.map((effect) => {
						const isSelected = selectedEffect === effect.id;

						return (
							<PressableFeedback
								key={effect.id}
								onPress={() => onSetSequenceEffect(effect.id)}
								className={`w-24 overflow-hidden rounded-xl border active:scale-[0.99] ${
									isSelected
										? "border-accent bg-accent/10"
										: "border-border bg-background"
								}`}
							>
								<View className="items-start">
									<View
										className="relative w-full overflow-hidden bg-black"
										pointerEvents="none"
										style={{ aspectRatio: 1 }}
									>
										<EffectPreviewVideo
											isSelected={isSelected}
											source={EFFECT_PREVIEW_VIDEOS[effect.id]}
										/>
									</View>
									<View className="px-2 py-1">
										<Text className="text-[10px] text-foreground text-center">
											{effect.label}
										</Text>
									</View>
								</View>
							</PressableFeedback>
						);
					})}
				</ScrollView>

					<View className="mt-5 rounded-xl bg-background px-4 py-4">
						<View className="mb-2 flex-row items-center justify-between gap-4">
							<Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
								Duración
							</Text>
							<Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
								{`${transitionSeconds}s`}
							</Text>
						</View>
						<Text className="mb-3 text-sm leading-6 text-muted">
							Indica cuántos segundos dura la transición entre clips. Usa `0` para cortar sin efecto.
						</Text>
						<View className="flex-row items-center justify-between rounded-xl border border-border bg-surface-secondary px-4 py-3">
							<Text className="text-sm font-bold text-foreground">Segundos</Text>
							<View className="min-w-20 flex-row items-center justify-end gap-2">
								<TextInput
									value={transitionInput}
									onChangeText={setTransitionInput}
									onBlur={() => commitTransitionSeconds(transitionInput)}
									onEndEditing={(event) => commitTransitionSeconds(event.nativeEvent.text)}
									keyboardType="decimal-pad"
									returnKeyType="done"
									maxLength={4}
									selectTextOnFocus
									className="min-w-16 rounded-lg bg-background px-3 py-2 text-right text-sm font-bold text-foreground"
								/>
								<Text className="text-sm font-bold text-muted">s</Text>
							</View>
						</View>
					</View>
				</View>

			<ReorderableClipList
				project={project}
				selectedUris={selectedUris}
				foregroundColor={foregroundColor}
				onMove={onMove}
				accordionValue="sequence-clips"
				accordionTitle="Sequence Order"
				countLabel={(count) => `${count} Clips`}
				infoBox={
					<View className="mb-5 rounded-xl bg-surface-secondary px-4 py-4">
						<Text className="text-sm font-bold text-foreground">
							Los clips se exportan uno tras otro
						</Text>
						<Text className="mt-1 text-sm leading-6 text-muted">
							{`La unión visual usa ${selectedEffectLabel.toLowerCase()}. Reordena la lista para cambiar el montaje final.`}
						</Text>
					</View>
				}
				renderItemTitle={({ index }) => `Clip ${index + 1}`}
				renderItemSubtitle={({ durationLabel }) =>
					`${durationLabel} · ${selectedEffectLabel.toLowerCase()} ${transitionSeconds}s con el siguiente`
				}
			/>
		</ScrollView>
	);
}
