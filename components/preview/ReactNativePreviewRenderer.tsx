import { PreviewRendererProps } from "@/features/video-editor/preview/contracts";
import { isProjectVisualItem } from "@/features/video-editor/domain/video-project";
import { useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import ProjectLayerRenderer from "./ProjectLayerRenderer";

export default function ReactNativePreviewRenderer({
  project,
  controller,
}: PreviewRendererProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const visualItems = project.tracks
    .flatMap((track) => track.items)
    .filter(isProjectVisualItem)
    .sort((left, right) => left.zIndex - right.zIndex);
  const previewScale =
    containerWidth > 0 ? containerWidth / project.canvas.width : 1;

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      className="overflow-hidden rounded-2xl"
      onLayout={handleLayout}
      style={{
        width: "100%",
        aspectRatio: project.canvas.width / project.canvas.height,
        backgroundColor: project.canvas.backgroundColor,
      }}
    >
      {visualItems.map((item) => (
        <ProjectLayerRenderer
          key={item.id}
          item={item}
          currentTimeMs={controller.state.currentTimeMs}
          isPlaying={controller.state.isPlaying}
          previewScale={previewScale}
        />
      ))}
    </View>
  );
}
