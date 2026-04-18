import { VideoTrim } from "@/types/media";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import { Button, PressableFeedback, useThemeColor } from "heroui-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  type DimensionValue,
  PanResponder,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  ArrowPathIcon,
  BackwardIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
  ScissorsIcon,
} from "react-native-heroicons/solid";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";

type Props = {
	uri: string;
	initialTrim?: VideoTrim;
	onSave: (trim: VideoTrim) => void;
};

type ThumbnailFrame = {
	timeMs: number;
	uri: string;
};

const MIN_TRIM_GAP_MS = 250;
const FRAME_COUNT = 6;

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

function formatClock(ms: number) {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatSeconds(ms: number) {
	return `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
}

function pct(value: number, total: number) {
	if (!total) return 0;
	return clamp((value / total) * 100, 0, 100);
}

export default function VideoTrimEditor({ uri, initialTrim, onSave }: Props) {
	const primaryColor = useThemeColor("link");
	const accentColor = useThemeColor("accent");
	const foregroundColor = useThemeColor("foreground");
	const warningForegroundColor = useThemeColor("warning-foreground");
	const player = useVideoPlayer(uri, (instance) => {
		instance.timeUpdateEventInterval = 0.1;
	});
	const insets = useSafeAreaInsets();

	const [durationMs, setDurationMs] = useState(initialTrim?.durationMs ?? 0);
	const [currentTimeMs, setCurrentTimeMs] = useState(initialTrim?.startMs ?? 0);
	const [startMs, setStartMs] = useState(initialTrim?.startMs ?? 0);
	const [endMs, setEndMs] = useState(initialTrim?.endMs ?? null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [frames, setFrames] = useState<ThumbnailFrame[]>([]);
	const [timelineWidth, setTimelineWidth] = useState(0);
	const [isDraggingHandle, setIsDraggingHandle] = useState(false);
	const timelineRef = useRef<View>(null);
	const timelinePageXRef = useRef(0);

	const effectiveEndMs = endMs ?? durationMs;
	const trimDurationMs = useMemo(
		() => Math.max(0, effectiveEndMs - startMs),
		[effectiveEndMs, startMs],
	);

	useEffect(() => {
		const timeSubscription = player.addListener(
			"timeUpdate",
			({ currentTime }) => {
				const nextTimeMs = currentTime * 1000;
				setCurrentTimeMs(nextTimeMs);

				if (effectiveEndMs > 0 && nextTimeMs >= effectiveEndMs) {
					player.pause();
					player.currentTime = effectiveEndMs / 1000;
					setCurrentTimeMs(effectiveEndMs);
				}
			},
		);

		const loadSubscription = player.addListener(
			"sourceLoad",
			({ duration }) => {
				const nextDurationMs = Math.max(0, Math.round(duration * 1000));
				setDurationMs(nextDurationMs);
				setEndMs((previousEndMs) => previousEndMs ?? nextDurationMs);
				player.currentTime = (initialTrim?.startMs ?? 0) / 1000;
			},
		);

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
	}, [effectiveEndMs, initialTrim?.startMs, player]);

	useEffect(() => {
		let isMounted = true;

		const generateFrames = async () => {
			if (!durationMs) return;

			const times = Array.from({ length: FRAME_COUNT }, (_, index) =>
				Math.round((durationMs / Math.max(1, FRAME_COUNT - 1)) * index),
			);

			const generated = await Promise.all(
				times.map(async (timeMs) => {
					try {
						const result = await VideoThumbnails.getThumbnailAsync(uri, {
							time: timeMs,
							quality: 0.5,
						});

						return {
							timeMs,
							uri: result.uri,
						} satisfies ThumbnailFrame;
					} catch {
						return null;
					}
				}),
			);

			if (isMounted) {
				setFrames(
					generated.filter((frame): frame is ThumbnailFrame => frame !== null),
				);
			}
		};

		generateFrames();

		return () => {
			isMounted = false;
		};
	}, [durationMs, uri]);

	const seekTo = useCallback((timeMs: number) => {
		const nextTimeMs = clamp(timeMs, 0, durationMs || timeMs);
		player.currentTime = nextTimeMs / 1000;
		setCurrentTimeMs(nextTimeMs);
	}, [durationMs, player]);

	const seekBy = (deltaMs: number) => {
		seekTo(currentTimeMs + deltaMs);
	};

	const togglePlayback = () => {
		if (isPlaying) {
			player.pause();
			return;
		}

		if (currentTimeMs < startMs || currentTimeMs > effectiveEndMs) {
			seekTo(startMs);
		}

		player.play();
	};

	const handleSetStart = () => {
		const nextStartMs = clamp(
			currentTimeMs,
			0,
			Math.max(0, effectiveEndMs - MIN_TRIM_GAP_MS),
		);
		setStartMs(nextStartMs);
		if (currentTimeMs < nextStartMs) {
			seekTo(nextStartMs);
		}
	};

	const handleSetEnd = () => {
		const nextEndMs = clamp(
			currentTimeMs,
			Math.min(durationMs || currentTimeMs, startMs + MIN_TRIM_GAP_MS),
			durationMs || currentTimeMs,
		);
		setEndMs(nextEndMs);
		if (currentTimeMs > nextEndMs) {
			seekTo(nextEndMs);
		}
	};

	const adjustStart = (deltaMs: number) => {
		setStartMs((previous) =>
			clamp(
				previous + deltaMs,
				0,
				Math.max(0, effectiveEndMs - MIN_TRIM_GAP_MS),
			),
		);
	};

	const adjustEnd = (deltaMs: number) => {
		setEndMs((previous) => {
			const baseEnd = previous ?? durationMs;
			return clamp(
				baseEnd + deltaMs,
				startMs + MIN_TRIM_GAP_MS,
				durationMs || baseEnd,
			);
		});
	};

	const handleReset = () => {
		setStartMs(0);
		setEndMs(durationMs || null);
		seekTo(0);
	};

	const handleSave = () => {
		if (!durationMs) {
			Alert.alert(t`Video not ready`, t`Wait for the video to finish loading.`);
			return;
		}

		onSave({
			startMs,
			endMs: effectiveEndMs,
			durationMs,
		});
	};

	const xToMs = useCallback((x: number) => {
		if (!timelineWidth || !durationMs) return 0;
		return clamp((x / timelineWidth) * durationMs, 0, durationMs);
	}, [timelineWidth, durationMs]);

	const updateTimelinePageX = useCallback(() => {
		timelineRef.current?.measureInWindow((x) => {
			timelinePageXRef.current = x;
		});
	}, []);

	const startHandlePanResponder = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onMoveShouldSetPanResponder: () => true,
				onPanResponderTerminationRequest: () => false,
				onPanResponderGrant: () => {
					setIsDraggingHandle(true);
					updateTimelinePageX();
				},
				onPanResponderMove: (_, gestureState) => {
					if (!timelineWidth || !durationMs) return;
					const localX = gestureState.moveX - timelinePageXRef.current;
					const nextStartMs = clamp(
						xToMs(localX),
						0,
						Math.max(0, effectiveEndMs - MIN_TRIM_GAP_MS),
					);
					setStartMs(nextStartMs);
					if (currentTimeMs < nextStartMs) {
						seekTo(nextStartMs);
					}
				},
				onPanResponderRelease: () => {
					setIsDraggingHandle(false);
				},
				onPanResponderTerminate: () => {
					setIsDraggingHandle(false);
				},
			}),
		[
			currentTimeMs,
			durationMs,
			effectiveEndMs,
			seekTo,
			timelineWidth,
			updateTimelinePageX,
			xToMs,
		],
	);

	const endHandlePanResponder = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onMoveShouldSetPanResponder: () => true,
				onPanResponderTerminationRequest: () => false,
				onPanResponderGrant: () => {
					setIsDraggingHandle(true);
					updateTimelinePageX();
				},
				onPanResponderMove: (_, gestureState) => {
					if (!timelineWidth || !durationMs) return;
					const localX = gestureState.moveX - timelinePageXRef.current;
					const nextEndMs = clamp(
						xToMs(localX),
						startMs + MIN_TRIM_GAP_MS,
						durationMs,
					);
					setEndMs(nextEndMs);
					if (currentTimeMs > nextEndMs) {
						seekTo(nextEndMs);
					}
				},
				onPanResponderRelease: () => {
					setIsDraggingHandle(false);
				},
				onPanResponderTerminate: () => {
					setIsDraggingHandle(false);
				},
			}),
		[currentTimeMs, durationMs, seekTo, startMs, timelineWidth, updateTimelinePageX, xToMs],
	);

	const leftMaskWidth = `${pct(startMs, durationMs)}%` as DimensionValue;
	const selectionWidth =
		`${Math.max(0, pct(effectiveEndMs - startMs, durationMs))}%` as DimensionValue;
	const playheadLeft = `${pct(currentTimeMs, durationMs)}%` as DimensionValue;

	return (
		<ScrollView
			className="h-full bg-background"
			contentContainerStyle={{ paddingBottom: insets.bottom }}
			scrollEnabled={!isDraggingHandle}
		>
			<View className="flex-1 items-center justify-center px-4 pt-5">
				<View className="relative h-full max-h-[60vh] aspect-9/16 overflow-hidden rounded-2xl bg-black">
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

				<View className="mt-8 flex-row items-center gap-10">
					<PressableFeedback onPress={() => seekBy(-1000)} className="p-3">
						<BackwardIcon width={28} height={28} color={foregroundColor} />
					</PressableFeedback>
					<PressableFeedback
						onPress={togglePlayback}
						className="h-16 w-16 items-center justify-center rounded-full bg-link"
					>
						{isPlaying ? (
							<PauseIcon
								width={30}
								height={30}
								color={warningForegroundColor}
							/>
						) : (
							<PlayIcon width={30} height={30} color={warningForegroundColor} />
						)}
					</PressableFeedback>
					<PressableFeedback onPress={() => seekBy(1000)} className="p-3">
						<ForwardIcon width={28} height={28} color={foregroundColor} />
					</PressableFeedback>
				</View>
			</View>

			<View className="inset-x-0 bottom-0 bg-surface-secondary/95 px-4 pt-4 pb-8">
				<View className="mx-auto w-full max-w-4xl">
					<View className="mb-3 flex-row items-center justify-between">
						<Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
							<Trans>Timeline Segment</Trans>
						</Text>
						<Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
							<Trans>{formatSeconds(trimDurationMs)} selected</Trans>
						</Text>
					</View>

					<View
						ref={timelineRef}
						className="relative h-20 overflow-hidden rounded-xl bg-black/40"
						onLayout={(event) => {
							setTimelineWidth(event.nativeEvent.layout.width)
							updateTimelinePageX();
						}}
					>
						<View className="absolute inset-0 flex-row">
							{frames.map((frame, index) => (
								<PressableFeedback
									key={`${frame.uri}-${index}`}
									onPress={() => seekTo(frame.timeMs)}
									className="h-full flex-1"
								>
									<Image
										source={{ uri: frame.uri }}
										style={{ width: "100%", height: "100%" }}
										contentFit="cover"
									/>
								</PressableFeedback>
							))}
						</View>

						<View className="absolute inset-0 flex-row">
							<View
								style={{ width: leftMaskWidth }}
								className="h-full bg-black/60"
							/>
							<View
								style={{ width: selectionWidth }}
								className="relative h-full border-y-2 border-link bg-link/5"
							>
								<View
									{...startHandlePanResponder.panHandlers}
									className="absolute left-0 top-0 bottom-0 w-3 items-center justify-center rounded-l-md bg-link"
								>
									<View className="h-4 w-px bg-warning-foreground/60" />
								</View>
								<View
									{...endHandlePanResponder.panHandlers}
									className="absolute right-0 top-0 bottom-0 w-3 items-center justify-center rounded-r-md bg-link"
								>
									<View className="h-4 w-px bg-warning-foreground/60" />
								</View>
							</View>
							<View className="h-full flex-1 bg-black/60" />
						</View>

						<View
							className="absolute top-0 bottom-0 w-0.5"
							style={{ left: playheadLeft }}
						/>
					</View>

					<View className="mt-4 flex-row gap-2">
						<Button onPress={handleSetStart} variant="ghost" className="flex-1">
							<ScissorsIcon width={16} height={16} color={accentColor} />
							<Button.Label>
								<Trans>Start {formatClock(startMs)}</Trans>
							</Button.Label>
						</Button>
						<Button onPress={handleSetEnd} variant="ghost" className="flex-1">
							<ScissorsIcon width={16} height={16} color={accentColor} />
							<Button.Label>
								<Trans>End {formatClock(effectiveEndMs)}</Trans>
							</Button.Label>
						</Button>
					</View>

					<View className="mt-6 flex-row items-center justify-around">
						<PressableFeedback
							onPress={() => adjustStart(-500)}
							className="items-center gap-1"
						>
							<BackwardIcon width={20} height={20} color={foregroundColor} />
							<Text className="text-[10px] font-bold uppercase tracking-tight text-muted">
								<Trans>Start</Trans>
							</Text>
						</PressableFeedback>
						<PressableFeedback
							onPress={handleReset}
							className="items-center gap-1"
						>
							<ArrowPathIcon width={20} height={20} color={foregroundColor} />
							<Text className="text-[10px] font-bold uppercase tracking-tight text-muted">
								<Trans>Reset</Trans>
							</Text>
						</PressableFeedback>
						<PressableFeedback
							onPress={handleSave}
							className="h-12 w-12 items-center justify-center rounded-2xl bg-link"
						>
							<ScissorsIcon
								width={22}
								height={22}
								color={warningForegroundColor}
							/>
						</PressableFeedback>
						<PressableFeedback
							onPress={() => adjustEnd(500)}
							className="items-center gap-1"
						>
							<ForwardIcon width={20} height={20} color={foregroundColor} />
							<Text className="text-[10px] font-bold uppercase tracking-tight text-muted">
								<Trans>End</Trans>
							</Text>
						</PressableFeedback>
						<PressableFeedback
							onPress={handleSetEnd}
							className="items-center gap-1"
						>
							<PlayIcon width={20} height={20} color={foregroundColor} />
							<Text className="text-[10px] font-bold uppercase tracking-tight text-muted">
								<Trans>Mark</Trans>
							</Text>
						</PressableFeedback>
					</View>
				</View>
			</View>
		</ScrollView>
	);
}
