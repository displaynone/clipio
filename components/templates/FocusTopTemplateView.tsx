import VideoThumbnail from "@/components/VideoThumbnail";
import ReorderableClipList from "@/components/templates/ReorderableClipList";
import TemplateThumbnailLoadingIndicator from "@/components/templates/TemplateThumbnailLoadingIndicator";
import { useVideoThumbnailPrefetch } from "@/hooks/useVideoThumbnailPrefetch";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { TemplateViewProps } from "./template-view.types";
import { t } from "@lingui/core/macro";

export default function FocusTopTemplateView({
	template,
	project,
	selectedUris,
	audioSourceUri,
	foregroundColor,
	onMove,
	onSetAudioSource,
}: TemplateViewProps) {
	const orderedUris = useMemo(() => selectedUris, [selectedUris]);
	const mediaTypesByUri = useMemo(
		() =>
			new Map(
				project.tracks
					.filter((track) => track.type === "video")
					.flatMap((track) => track.items)
					.filter((item) => item.kind === "video")
					.map((item) => [item.sourceUri, item.sourceType ?? "video"]),
			),
		[project],
	);
	const thumbnailLoading = useVideoThumbnailPrefetch(orderedUris);
	const visualItems = useMemo(
		() =>
			project.tracks
				.filter((track) => track.type === "video")
				.flatMap((track) => track.items)
				.filter((item) => item.kind === "video")
				.sort((left, right) => left.zIndex - right.zIndex),
		[project],
	);

	return (
		<ScrollView
			className="flex-1"
			contentContainerClassName="flex-grow px-6 pb-10 pt-6"
			showsVerticalScrollIndicator={false}
		>
			<View className="mb-8 items-center">
				<View
					className="w-full max-w-[320px] overflow-hidden rounded-2xl"
					style={{
						aspectRatio: project.canvas.width / project.canvas.height,
						backgroundColor: project.canvas.backgroundColor,
					}}
				>
					<TemplateThumbnailLoadingIndicator
						loadedCount={thumbnailLoading.loadedCount}
						totalCount={thumbnailLoading.totalCount}
					/>
					{template.slots.map((slot) => {
						const item = visualItems.find((visualItem) => visualItem.slotId === slot.id);

						return (
							<View
								key={`preview-slot-${slot.id}`}
								className="absolute border border-background bg-surface-secondary"
								style={{
									left: `${slot.x}%`,
									top: `${slot.y}%`,
									width: `${slot.width}%`,
									height: `${slot.height}%`,
								}}
							>
								{item ? (
									<VideoThumbnail
										uri={item.sourceUri}
										mediaType={item.sourceType ?? mediaTypesByUri.get(item.sourceUri) ?? "video"}
										className="h-full w-full rounded-none"
									/>
								) : (
									<View className="h-full w-full bg-surface-secondary" />
								)}
							</View>
						);
					})}
				</View>
			</View>

			<View className="mt-1">
				<ReorderableClipList
					project={project}
					selectedUris={selectedUris}
					foregroundColor={foregroundColor}
					onMove={onMove}
					audioSourceUri={audioSourceUri}
					onSelectAudio={onSetAudioSource}
					accordionValue="reorder-clips"
					accordionTitle={t`Reorder Clips`}
					countLabel={(count) =>
						count === 1 ? t`1 Clip Selected` : t`${count} Clips Selected`
					}
				/>
			</View>
		</ScrollView>
	);
}
