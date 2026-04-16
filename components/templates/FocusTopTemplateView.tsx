import VideoThumbnail from "@/components/VideoThumbnail";
import ReorderableClipList from "@/components/templates/ReorderableClipList";
import TemplateThumbnailLoadingIndicator from "@/components/templates/TemplateThumbnailLoadingIndicator";
import { useVideoThumbnailPrefetch } from "@/hooks/useVideoThumbnailPrefetch";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { TemplateViewProps } from "./template-view.types";

export default function FocusTopTemplateView({
	project,
	selectedUris,
	audioSourceUri,
	foregroundColor,
	onMove,
	onSetAudioSource,
}: TemplateViewProps) {
	const orderedUris = useMemo(() => selectedUris, [selectedUris]);
	const thumbnailLoading = useVideoThumbnailPrefetch(orderedUris);

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
					<View className="h-1/2 w-full border border-background">
						{orderedUris[0] ? (
							<VideoThumbnail
								uri={orderedUris[0]}
								className="h-full w-full rounded-none"
							/>
						) : (
							<View className="h-full w-full bg-surface-secondary" />
						)}
					</View>
					<View className="h-1/2 w-full flex-row">
						<View className="h-full w-1/2 border border-background">
							{orderedUris[1] ? (
								<VideoThumbnail
									uri={orderedUris[1]}
									className="h-full w-full rounded-none"
								/>
							) : (
								<View className="h-full w-full bg-surface-secondary" />
							)}
						</View>
						<View className="w-1/2 h-full flex-col">
							{Array.from({ length: 2 }).map((_, index) => {
								const uri = orderedUris[index + 2];

								return (
									<View
										key={`preview-slot-${index + 2}`}
										className="h-full flex-1 border border-background"
									>
										{uri ? (
											<VideoThumbnail
												uri={uri}
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
					accordionTitle="Reorder Clips"
					countLabel={(count) => `${count} Clips Selected`}
				/>
			</View>
		</ScrollView>
	);
}
