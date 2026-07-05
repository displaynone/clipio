import * as MediaLibrary from "expo-media-library";
import { useVideoPlayer, VideoView } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import { PressableFeedback, Slider, useThemeColor } from "heroui-native";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import ImageCropPicker from "react-native-image-crop-picker";
import {
	BackwardIcon,
	CameraIcon,
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ForwardIcon,
	PauseIcon,
	PlayIcon,
	ViewfinderCircleIcon,
} from "react-native-heroicons/solid";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";

type Props = {
	uri: string;
};

const FRAME_STEP_MS = 1000 / 30;

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

function formatSeconds(ms: number) {
	return `${(Math.max(0, ms) / 1000).toFixed(2)}s`;
}

type SeekButtonProps = {
	label: string;
	onPress: () => void;
	children: ReactNode;
	isPrimary?: boolean;
};

function SeekButton({ label, onPress, children, isPrimary = false }: SeekButtonProps) {
	return (
		<PressableFeedback
			onPress={onPress}
			className={`h-14 flex-1 items-center justify-center gap-1 rounded-xl ${
				isPrimary ? "bg-link" : "bg-surface-tertiary"
			}`}
		>
			<View className="h-5 items-center justify-center">
				{children}
			</View>
			<Text
				className={`text-[9px] font-bold uppercase tracking-[0.04em] ${
					isPrimary ? "text-warning-foreground" : "text-muted"
				}`}
			>
				{label}
			</Text>
		</PressableFeedback>
	);
}

function sliderValueToMs(value: number | number[]) {
	return Array.isArray(value) ? value[0] ?? 0 : value;
}

function ensureLocalFileUri(path: string) {
	if (path.startsWith("file://") || path.startsWith("content://")) {
		return path;
	}

	return `file://${path}`;
}

function isPickerCancel(error: unknown) {
	if (!error || typeof error !== "object") {
		return false;
	}

	const code = "code" in error ? String(error.code) : "";
	const message = "message" in error ? String(error.message) : "";
	return code === "E_PICKER_CANCELLED" || message.toLowerCase().includes("cancel");
}

export default function VideoFrameCapture({ uri }: Props) {
	const primaryColor = useThemeColor("link");
	const foregroundColor = useThemeColor("foreground");
	const warningForegroundColor = useThemeColor("warning-foreground");
	const insets = useSafeAreaInsets();
	const player = useVideoPlayer(uri, (instance) => {
		instance.loop = false;
		instance.timeUpdateEventInterval = 0.05;
	});

	const [durationMs, setDurationMs] = useState(0);
	const [currentTimeMs, setCurrentTimeMs] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isCapturing, setIsCapturing] = useState(false);
	const [isCropping, setIsCropping] = useState(false);
	const [croppedFrameUri, setCroppedFrameUri] = useState<string | null>(null);

	useEffect(() => {
		const timeSubscription = player.addListener("timeUpdate", ({ currentTime }) => {
			setCurrentTimeMs(currentTime * 1000);
		});

		const loadSubscription = player.addListener("sourceLoad", ({ duration }) => {
			const nextDurationMs = Math.max(0, Math.round(duration * 1000));
			setDurationMs(nextDurationMs);
			setCurrentTimeMs(0);
			player.currentTime = 0;
		});

		const playingSubscription = player.addListener(
			"playingChange",
			({ isPlaying: nextIsPlaying }) => {
				setIsPlaying(nextIsPlaying);
			},
		);

		return () => {
			timeSubscription.remove();
			loadSubscription.remove();
			playingSubscription.remove();
		};
	}, [player]);

	const clearCrop = () => {
		setCroppedFrameUri(null);
	};

	const seekTo = useCallback((timeMs: number) => {
		clearCrop();
		const maxTimeMs = durationMs || timeMs;
		const nextTimeMs = clamp(timeMs, 0, maxTimeMs);
		player.pause();
		player.currentTime = nextTimeMs / 1000;
		setCurrentTimeMs(nextTimeMs);
	}, [durationMs, player]);

	const seekBy = (deltaMs: number) => {
		seekTo(currentTimeMs + deltaMs);
	};

	const handleSliderChange = (value: number | number[]) => {
		clearCrop();
		player.pause();
		setCurrentTimeMs(clamp(sliderValueToMs(value), 0, durationMs || 0));
	};

	const handleSliderChangeEnd = (value: number | number[]) => {
		seekTo(sliderValueToMs(value));
	};

	const togglePlayback = () => {
		if (isPlaying) {
			player.pause();
			return;
		}

		if (durationMs > 0 && currentTimeMs >= durationMs - FRAME_STEP_MS) {
			seekTo(0);
		}

		clearCrop();
		player.play();
	};

	const getCurrentFrameThumbnail = async () => {
		if (!durationMs) {
			Alert.alert(t`Video not ready`, t`Wait for the video to finish loading.`);
			return null;
		}

		return await VideoThumbnails.getThumbnailAsync(uri, {
			time: Math.round(clamp(currentTimeMs, 0, durationMs)),
			quality: 1,
		});
	};

	const handleCrop = async () => {
		if (isCropping) {
			return;
		}

		try {
			setIsCropping(true);
			player.pause();

			const frame = await getCurrentFrameThumbnail();
			if (!frame) {
				return;
			}

			const croppedImage = await ImageCropPicker.openCropper({
				path: ensureLocalFileUri(frame.uri),
				mediaType: "photo",
				width: frame.width,
				height: frame.height,
				freeStyleCropEnabled: true,
				showCropFrame: true,
				showCropGuidelines: true,
				compressImageQuality: 1,
				cropperToolbarTitle: t`Crop frame`,
				cropperChooseText: t`Use`,
				cropperCancelText: t`Cancel`,
			});

			setCroppedFrameUri(ensureLocalFileUri(croppedImage.path));
		} catch (error) {
			if (!isPickerCancel(error)) {
				Alert.alert(t`Crop unavailable`, `${error}`);
			}
		} finally {
			setIsCropping(false);
		}
	};

	const handleCapture = async () => {
		if (isCapturing) {
			return;
		}

		try {
			setIsCapturing(true);
			player.pause();

			const permission = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);

			if (!permission.granted) {
				Alert.alert(
					t`Permission required`,
					t`Allow photo library access to save captured frames.`,
				);
				return;
			}

			const frame = croppedFrameUri
				? { uri: croppedFrameUri }
				: await getCurrentFrameThumbnail();

			if (!frame) {
				return;
			}

			await MediaLibrary.saveToLibraryAsync(frame.uri);
			Alert.alert(t`Frame saved`, t`The captured frame was saved to your device.`);
		} catch (error) {
			Alert.alert(t`Capture unavailable`, `${error}`);
		} finally {
			setIsCapturing(false);
		}
	};

	return (
		<ScrollView
			className="h-full bg-background"
			contentContainerStyle={{
				paddingBottom: insets.bottom + 24,
			}}
		>
			<View className="flex-1 items-center justify-center px-4 pt-5">
				<View className="relative h-full max-h-[58vh] aspect-9/16 overflow-hidden rounded-2xl bg-black">
					<VideoView
						player={player}
						nativeControls={false}
						contentFit="cover"
						style={{ width: "100%", height: "100%" }}
					/>

					<PressableFeedback
						onPress={togglePlayback}
						className="absolute inset-0 items-center justify-center"
					>
						<View className="h-16 w-16 items-center justify-center rounded-full bg-link/20">
							{isPlaying ? (
								<PauseIcon width={28} height={28} color={primaryColor} />
							) : (
								<PlayIcon width={28} height={28} color={primaryColor} />
							)}
						</View>
					</PressableFeedback>

					<View className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-default/80 px-4 py-2">
						<Text className="font-bold text-accent">
							{formatSeconds(currentTimeMs)}
						</Text>
					</View>
				</View>
			</View>

			<View className="px-4 pt-8">
				<View className="mx-auto w-full max-w-4xl gap-3">
					<View className="flex-row gap-1">
						<SeekButton label="-5s" onPress={() => seekBy(-5000)}>
							<ChevronDoubleLeftIcon width={18} height={18} color={foregroundColor} />
						</SeekButton>
						<SeekButton label="-1s" onPress={() => seekBy(-1000)}>
							<BackwardIcon width={18} height={18} color={foregroundColor} />
						</SeekButton>
						<SeekButton label="-frame" onPress={() => seekBy(-FRAME_STEP_MS)}>
							<ChevronLeftIcon width={18} height={18} color={foregroundColor} />
						</SeekButton>
						<SeekButton
							label={isPlaying ? t`Pause` : t`Play`}
							onPress={togglePlayback}
							isPrimary
						>
							{isPlaying ? (
								<PauseIcon
									width={20}
									height={20}
									color={warningForegroundColor}
								/>
							) : (
								<PlayIcon width={20} height={20} color={warningForegroundColor} />
							)}
						</SeekButton>
						<SeekButton label="+frame" onPress={() => seekBy(FRAME_STEP_MS)}>
							<ChevronRightIcon width={18} height={18} color={foregroundColor} />
						</SeekButton>
						<SeekButton label="+1s" onPress={() => seekBy(1000)}>
							<ForwardIcon width={18} height={18} color={foregroundColor} />
						</SeekButton>
						<SeekButton label="+5s" onPress={() => seekBy(5000)}>
							<ChevronDoubleRightIcon width={18} height={18} color={foregroundColor} />
						</SeekButton>
					</View>

					<Slider
						value={currentTimeMs}
						minValue={0}
						maxValue={durationMs || 1}
						step={FRAME_STEP_MS}
						isDisabled={!durationMs}
						onChange={handleSliderChange}
						onChangeEnd={handleSliderChangeEnd}
						className="py-3"
					>
						<Slider.Track className="h-3 rounded-full bg-surface-tertiary">
							<Slider.Fill className="rounded-full bg-link" />
							<Slider.Thumb
								classNames={{
									thumbContainer: "size-6 rounded-full bg-link",
									thumbKnob: "rounded-full bg-warning-foreground",
								}}
							/>
						</Slider.Track>
					</Slider>

					<Text className="pt-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
						<Trans>{formatSeconds(currentTimeMs)} / {formatSeconds(durationMs)}</Trans>
					</Text>

					<PressableFeedback
						onPress={handleCrop}
						className={`h-12 flex-row items-center justify-center gap-2 rounded-2xl px-5 ${
							croppedFrameUri ? "bg-link" : "bg-surface-tertiary"
						}`}
					>
						{isCropping ? (
							<ActivityIndicator color={warningForegroundColor} />
						) : (
							<ViewfinderCircleIcon
								width={20}
								height={20}
								color={croppedFrameUri ? warningForegroundColor : foregroundColor}
							/>
						)}
						<Text
							className={`text-xs font-extrabold uppercase tracking-[0.08em] ${
								croppedFrameUri ? "text-warning-foreground" : "text-foreground"
							}`}
						>
							{croppedFrameUri ? <Trans>Crop ready</Trans> : <Trans>Crop frame</Trans>}
						</Text>
					</PressableFeedback>

					<PressableFeedback
						onPress={handleCapture}
						className="mt-1 h-16 flex-row items-center justify-center gap-2 rounded-2xl bg-accent px-5"
					>
						{isCapturing ? (
							<ActivityIndicator color={warningForegroundColor} />
						) : (
							<CameraIcon
								width={22}
								height={22}
								color={warningForegroundColor}
							/>
						)}
						<Text className="text-sm font-extrabold uppercase tracking-[0.08em] text-warning-foreground">
							<Trans>Capture Frame</Trans>
						</Text>
					</PressableFeedback>
				</View>
			</View>
		</ScrollView>
	);
}
