import VideoThumbnail from "@/components/VideoThumbnail";
import { VideoProject } from "@/features/video-editor/domain/video-project";
import { Accordion, PressableFeedback } from "heroui-native";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
	Bars2Icon,
	SpeakerWaveIcon,
	SpeakerXMarkIcon,
} from "react-native-heroicons/outline";
import Animated, {
	LinearTransition,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const ITEM_HEIGHT = 96;

function formatClipDuration(durationMs: number) {
	const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function moveItem(items: string[], fromIndex: number, toIndex: number) {
	if (
		fromIndex === toIndex ||
		fromIndex < 0 ||
		toIndex < 0 ||
		fromIndex >= items.length ||
		toIndex >= items.length
	) {
		return items;
	}

	const nextItems = [...items];
	const [movedItem] = nextItems.splice(fromIndex, 1);
	nextItems.splice(toIndex, 0, movedItem);
	return nextItems;
}

type RenderItemContentParams = {
	uri: string;
	index: number;
	durationLabel: string;
	isAudioSelected: boolean;
};

type DraggableClipItemProps = {
	uri: string;
	index: number;
	durationLabel: string;
	foregroundColor: string;
	isActive: boolean;
	isAudioSelected: boolean;
	activeOffset: SharedValue<number>;
	onDragStart: (uri: string) => void;
	onDragUpdate: (translationY: number) => void;
	onDragEnd: () => void;
	onSelectAudio?: (uri: string) => void;
	renderItemTitle?: (params: RenderItemContentParams) => string;
	renderItemSubtitle?: (params: RenderItemContentParams) => string;
};

function DraggableClipItem({
	uri,
	index,
	durationLabel,
	foregroundColor,
	isActive,
	isAudioSelected,
	activeOffset,
	onDragStart,
	onDragUpdate,
	onDragEnd,
	onSelectAudio,
	renderItemTitle,
	renderItemSubtitle,
}: DraggableClipItemProps) {
	const gesture = Gesture.Pan()
		.activateAfterLongPress(180)
		.onStart(() => {
			scheduleOnRN(onDragStart, uri);
		})
		.onUpdate((event) => {
			scheduleOnRN(onDragUpdate, event.translationY);
		})
		.onEnd(() => {
			scheduleOnRN(onDragEnd);
		})
		.onFinalize(() => {
			scheduleOnRN(onDragEnd);
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: isActive ? activeOffset.value : 0 }],
		zIndex: isActive ? 20 : 0,
		opacity: isActive ? 0.96 : 1,
	}));

	const content = {
		uri,
		index,
		durationLabel,
		isAudioSelected,
	};

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				layout={LinearTransition.springify().damping(24).stiffness(120).mass(0.9)}
				style={animatedStyle}
				className="mb-4 flex-row items-center gap-4 rounded-xl bg-surface-secondary p-4"
			>
				<View className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-outline-variant/20">
					<VideoThumbnail uri={uri} className="h-full w-full object-cover" />
				</View>
				<View className="grow">
					<Text className="font-bold tracking-tight text-surface-secondary-foreground">
						{renderItemTitle?.(content) ?? durationLabel}
					</Text>
					<Text className="text-xs text-surface-secondary-foreground/70">
						{renderItemSubtitle?.(content) ??
							(isAudioSelected ? "Audio final activo" : "Audio silenciado")}
					</Text>
				</View>
				<View className="flex-row items-center gap-2">
					{onSelectAudio ? (
						<PressableFeedback
							onPress={() => onSelectAudio(uri)}
							className={`rounded-full border p-2 active:scale-95 ${
								isAudioSelected
									? "border-accent bg-accent/15"
									: "border-border bg-overlay"
							}`}
						>
							{isAudioSelected ? (
								<SpeakerWaveIcon width={18} height={18} color={foregroundColor} />
							) : (
								<SpeakerXMarkIcon width={18} height={18} color={foregroundColor} />
							)}
						</PressableFeedback>
					) : null}
					<Bars2Icon width={18} height={18} color={foregroundColor} />
				</View>
			</Animated.View>
		</GestureDetector>
	);
}

type ReorderableClipListProps = {
	project: VideoProject;
	selectedUris: string[];
	foregroundColor: string;
	onMove: (fromIndex: number, toIndex: number) => void;
	audioSourceUri?: string | null;
	onSelectAudio?: (uri: string) => void;
	accordionValue: string;
	accordionTitle: string;
	countLabel: (count: number) => string;
	infoBox?: ReactNode;
	renderItemTitle?: (params: RenderItemContentParams) => string;
	renderItemSubtitle?: (params: RenderItemContentParams) => string;
};

export default function ReorderableClipList({
	project,
	selectedUris,
	foregroundColor,
	onMove,
	audioSourceUri,
	onSelectAudio,
	accordionValue,
	accordionTitle,
	countLabel,
	infoBox,
	renderItemTitle,
	renderItemSubtitle,
}: ReorderableClipListProps) {
	const [orderedUris, setOrderedUris] = useState(selectedUris);
	const [activeUri, setActiveUri] = useState<string | null>(null);
	const activeUriRef = useRef<string | null>(null);
	const startIndexRef = useRef(-1);
	const currentIndexRef = useRef(-1);
	const activeOffset = useSharedValue(0);

	const clipDurationsByUri = useMemo(
		() =>
			new Map(
				project.tracks
					.filter((track) => track.type === "video")
					.flatMap((track) => track.items)
					.filter((item) => item.kind === "video")
					.map((item) => [item.sourceUri, formatClipDuration(item.durationMs)]),
			),
		[project],
	);

	useEffect(() => {
		setOrderedUris(selectedUris);
	}, [selectedUris]);

	const handleDragStart = (uri: string) => {
		const startIndex = orderedUris.indexOf(uri);
		if (startIndex === -1) {
			return;
		}

		activeUriRef.current = uri;
		setActiveUri(uri);
		startIndexRef.current = startIndex;
		currentIndexRef.current = startIndex;
		activeOffset.value = 0;
	};

	const handleDragUpdate = (translationY: number) => {
		if (activeUriRef.current == null || currentIndexRef.current < 0) {
			return;
		}

		activeOffset.value = translationY;
		const relativeIndexOffset = Math.round(translationY / ITEM_HEIGHT);
		const nextIndex = Math.max(
			0,
			Math.min(orderedUris.length - 1, startIndexRef.current + relativeIndexOffset),
		);

		if (nextIndex === currentIndexRef.current) {
			return;
		}

		setOrderedUris((previous) => moveItem(previous, currentIndexRef.current, nextIndex));
		currentIndexRef.current = nextIndex;
	};

	const handleDragEnd = () => {
		if (activeUriRef.current == null) {
			return;
		}

		activeOffset.value = withSpring(0, {
			damping: 28,
			stiffness: 140,
			mass: 0.95,
		});

		if (
			startIndexRef.current >= 0 &&
			currentIndexRef.current >= 0 &&
			startIndexRef.current !== currentIndexRef.current
		) {
			onMove(startIndexRef.current, currentIndexRef.current);
		}

		activeUriRef.current = null;
		setActiveUri(null);
		startIndexRef.current = -1;
		currentIndexRef.current = -1;
	};

	return (
		<Accordion
			selectionMode="single"
			defaultValue={accordionValue}
			hideSeparator
			className="bg-transparent"
		>
			<Accordion.Item value={accordionValue} className="bg-transparent">
				<Accordion.Trigger className="mb-6 flex-row items-center justify-between rounded-xl bg-surface-secondary px-4 py-4">
					<View>
						<Text className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
							{accordionTitle}
						</Text>
					</View>
					<View className="flex-row items-center gap-3">
						<Text className="text-[10px] uppercase tracking-[0.12em] text-accent">
							{countLabel(orderedUris.length)}
						</Text>
						<Accordion.Indicator />
					</View>
				</Accordion.Trigger>

				<Accordion.Content className="bg-transparent px-0 pb-0 pt-0">
					{infoBox}
					<View>
						{orderedUris.map((uri, index) => (
							<DraggableClipItem
								key={uri}
								uri={uri}
								index={index}
								durationLabel={clipDurationsByUri.get(uri) ?? "00:00"}
								foregroundColor={foregroundColor}
								isActive={activeUri === uri}
								isAudioSelected={audioSourceUri === uri}
								activeOffset={activeOffset}
								onDragStart={handleDragStart}
								onDragUpdate={handleDragUpdate}
								onDragEnd={handleDragEnd}
								onSelectAudio={onSelectAudio}
								renderItemTitle={renderItemTitle}
								renderItemSubtitle={renderItemSubtitle}
							/>
						))}
					</View>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion>
	);
}
