import VideoThumbnail from "@/components/VideoThumbnail";
import { useEditorStore } from "@/stores/editorStore";
import { useRouter } from "expo-router";
import { useVideoPlayer } from "expo-video";
import type { MenuTriggerRef } from "heroui-native";
import { Menu, PressableFeedback, useThemeColor } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import {
	CheckIcon,
	EllipsisVerticalIcon,
	ScissorsIcon,
	XMarkIcon,
} from "react-native-heroicons/solid";

type Props = {
	uri: string;
	index: number;
	isSelected: boolean;
	onRemove: () => void;
	onToggleSelect: () => void;
};

function formatDuration(durationMs: number | null) {
	if (!durationMs || durationMs <= 0) {
		return "--:--";
	}

	const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function LibraryClipCard({
	uri,
	index: _index,
	isSelected,
	onRemove,
	onToggleSelect,
}: Props) {
	const router = useRouter();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuTriggerRef = useRef<MenuTriggerRef>(null);
	const accentColor = useThemeColor("accent");
	const accentForegroundColor = useThemeColor("accent-foreground");
	const dangerColor = useThemeColor("danger");
	const trim = useEditorStore((state) => state.trimsByUri[uri]);
	const [videoDurationMs, setVideoDurationMs] = useState<number | null>(
		trim?.durationMs ?? null,
	);
	const player = useVideoPlayer(uri, (videoPlayer) => {
		videoPlayer.loop = false;
		videoPlayer.pause();
	});

	useEffect(() => {
		if (trim?.durationMs != null) {
			setVideoDurationMs(trim.durationMs);
			return;
		}

		const loadSubscription = player.addListener("sourceLoad", ({ duration }) => {
			setVideoDurationMs(Math.max(0, Math.round(duration * 1000)));
		});

		return () => {
			loadSubscription.remove();
		};
	}, [player, trim?.durationMs]);

	const handleOpenMenu = () => {
		menuTriggerRef.current?.open();
	};

	const handleTrim = () => {
		setIsMenuOpen(false);
		router.push({
			pathname: "/trim",
			params: { uri: encodeURIComponent(uri) },
		});
	};

	const handleRemove = () => {
		setIsMenuOpen(false);
		onRemove();
	};

	return (
		<View
			className="relative mb-5 w-[48%] overflow-hidden rounded-lg bg-surface-secondary"
			style={{
				borderWidth: 2,
				borderColor: isSelected ? accentColor : "transparent",
			}}
		>
			<VideoThumbnail uri={uri} className="aspect-9/16 w-full rounded-none" />

			<Menu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} className="absolute top-0 left-0">
				<View className="absolute top-3 left-3 z-10 h-8 w-8">
					<PressableFeedback
						onPress={handleOpenMenu}
						className="h-8 w-8 items-center justify-center rounded-full bg-surface-tertiary"
					>
						<EllipsisVerticalIcon
							width={16}
							height={16}
							color={accentColor}
						/>
					</PressableFeedback>
					<Menu.Trigger
						ref={menuTriggerRef}
						pointerEvents="none"
						className="absolute inset-0 opacity-0"
					/>
				</View>
				<Menu.Portal>
					<Menu.Overlay className="bg-transparent" />
					<Menu.Content
						presentation="popover"
						placement="bottom"
						align="start"
						width={164}
						className="border border-border bg-background p-1"
					>
						<Menu.Item onPress={handleTrim}>
							<ScissorsIcon width={14} height={14} color={accentColor} />
							<Menu.ItemTitle>Cortar</Menu.ItemTitle>
						</Menu.Item>
						<Menu.Item variant="danger" onPress={handleRemove}>
							<XMarkIcon width={14} height={14} color={dangerColor} />
							<Menu.ItemTitle>Eliminar</Menu.ItemTitle>
						</Menu.Item>
					</Menu.Content>
				</Menu.Portal>
			</Menu>

			<PressableFeedback
				onPress={onToggleSelect}
				className="absolute top-3 right-3 h-7 w-7 items-center justify-center rounded-full"
				style={{
					backgroundColor: isSelected
						? accentColor
						: "rgba(241, 223, 255, 0.08)",
					borderWidth: isSelected ? 0 : 2,
					borderColor: "rgba(241, 223, 255, 0.3)",
				}}
			>
				{isSelected ? (
					<CheckIcon width={14} height={14} color={accentForegroundColor} />
				) : null}
			</PressableFeedback>

			{/* <PressableFeedback
				onPress={handleOpenMenu}
				className="absolute top-3 left-3 h-7 w-7 items-center justify-center rounded-full bg-surface-tertiary"
			>
				<EllipsisVerticalIcon
					width={14}
					height={14}
					color={accentColor}
				/>
			</PressableFeedback> */}

			<View className="absolute inset-x-0 bottom-0 bg-black/40 px-3 py-3">
				<Text className="text-[10px] font-bold uppercase tracking-[0.08em] text-foreground">
					{formatDuration(videoDurationMs)}
				</Text>
			</View>
		</View>
	);
}
