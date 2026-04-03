import VideoSlot from "@/components/VideoSlot";
import VideoThumbnail from "@/components/VideoThumbnail";
import { Accordion, PressableFeedback } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
	Bars2Icon,
	PlayIcon,
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
import { TemplateViewProps } from "./template-view.types";

const ITEM_HEIGHT = 96;

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

type DraggableClipItemProps = {
	uri: string;
	index: number;
	foregroundColor: string;
	isActive: boolean;
	isAudioSelected: boolean;
	activeOffset: SharedValue<number>;
	onDragStart: (uri: string) => void;
	onDragUpdate: (translationY: number) => void;
	onDragEnd: () => void;
	onSelectAudio: (uri: string) => void;
};

function DraggableClipItem({
	uri,
	index,
	foregroundColor,
	isActive,
	isAudioSelected,
	activeOffset,
	onDragStart,
	onDragUpdate,
	onDragEnd,
	onSelectAudio,
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
						Clip {String(index + 1).padStart(2, "0")}
					</Text>
					<Text className="text-xs text-surface-secondary-foreground/70">
						{isAudioSelected ? "Audio final activo" : "Audio silenciado"}
					</Text>
				</View>
				<View className="flex-row items-center gap-2">
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
					<Bars2Icon width={18} height={18} color={foregroundColor} />
				</View>
			</Animated.View>
		</GestureDetector>
	);
}

export default function Grid2x2TemplateView({
	template,
	selectedUris,
	audioSourceUri,
	foregroundColor,
	onMove,
	onSetAudioSource,
}: TemplateViewProps) {
	const [orderedUris, setOrderedUris] = useState(selectedUris);
	const [activeUri, setActiveUri] = useState<string | null>(null);
	const activeUriRef = useRef<string | null>(null);
	const startIndexRef = useRef(-1);
	const currentIndexRef = useRef(-1);
	const activeOffset = useSharedValue(0);

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
		<ScrollView
			className="flex-1"
			contentContainerClassName="flex-grow px-6 pb-10 pt-6"
			showsVerticalScrollIndicator={false}
		>
			<View className="mb-8 items-center">
				<View className="relative aspect-9/16 w-full max-w-[320px] overflow-hidden rounded-xl ring-1 ring-outline-variant/30 shadow-2xl shadow-primary/10 bg-surface-container-low">
					<View className="flex h-full flex-row flex-wrap bg-black">
						{template.slots.map((slot, index) => {
							const uri = orderedUris[index] ?? null;

							return (
								<View key={slot.id} className="h-1/2 w-1/2">
									<VideoSlot uri={uri} gap={0} className="h-full w-full" />
								</View>
							);
						})}
					</View>

					<View className="absolute bottom-4 left-1/2 flex-row items-center gap-3 rounded-full border border-border bg-overlay px-4 py-2 -translate-x-1/2">
						<PlayIcon width={16} height={16} color="#00e3fd" />
						<Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">
							00:15 / 00:30
						</Text>
					</View>
				</View>
			</View>

			<View className="mt-1">
				<Accordion
					selectionMode="single"
					defaultValue="reorder-clips"
					hideSeparator
					className="bg-transparent"
				>
					<Accordion.Item value="reorder-clips" className="bg-transparent">
						<Accordion.Trigger className="mb-6 flex-row items-center justify-between rounded-xl bg-surface-secondary px-4 py-4">
							<View>
								<Text className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
									Reorder Clips
								</Text>
							</View>
							<View className="flex-row items-center gap-3">
								<Text className="text-[10px] uppercase tracking-[0.12em] text-accent">
									{orderedUris.length} Clips Selected
								</Text>
								<Accordion.Indicator />
							</View>
						</Accordion.Trigger>

						<Accordion.Content className="bg-transparent px-0 pb-0 pt-0">
							<View>
								{orderedUris.map((uri, index) => (
									<DraggableClipItem
										key={uri}
										uri={uri}
										index={index}
										foregroundColor={foregroundColor}
										isActive={activeUri === uri}
										isAudioSelected={audioSourceUri === uri}
										activeOffset={activeOffset}
										onDragStart={handleDragStart}
										onDragUpdate={handleDragUpdate}
										onDragEnd={handleDragEnd}
										onSelectAudio={onSetAudioSource}
									/>
								))}
							</View>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion>
			</View>
		</ScrollView>
	);
}
