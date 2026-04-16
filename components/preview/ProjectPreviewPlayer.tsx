import { reactNativePreviewEngine } from "@/features/video-editor/preview/reactNativePreviewEngine";
import { VideoProject } from "@/features/video-editor/domain/video-project";
import { usePreviewController } from "@/hooks/usePreviewController";
import { PressableFeedback } from "heroui-native";
import { LayoutChangeEvent, Text, View } from "react-native";
import {
  BackwardIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
} from "react-native-heroicons/outline";
import { useRef, useState } from "react";

type Props = {
  project: VideoProject;
  className?: string;
};

function formatTimestamp(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ProjectPreviewPlayer({ project, className }: Props) {
  const controller = usePreviewController(project);
  const timelineWidthRef = useRef(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const Renderer = reactNativePreviewEngine.Renderer;

  const progress =
    project.canvas.durationMs > 0
      ? controller.state.currentTimeMs / project.canvas.durationMs
      : 0;

  const handleTimelineLayout = (event: LayoutChangeEvent) => {
    timelineWidthRef.current = event.nativeEvent.layout.width;
  };

  const handleTimelinePress = (locationX: number) => {
    if (timelineWidthRef.current <= 0) {
      return;
    }

    const ratio = Math.max(0, Math.min(1, locationX / timelineWidthRef.current));
    controller.seekTo(project.canvas.durationMs * ratio);
  };

  return (
    <View className={className}>
      <Renderer project={project} controller={controller} />

      <View className="mt-4 gap-3 rounded-2xl border border-border bg-surface-secondary px-4 py-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            Preview Engine
          </Text>
          <Text className="text-xs font-semibold text-accent">
            {formatTimestamp(controller.state.currentTimeMs)} / {formatTimestamp(project.canvas.durationMs)}
          </Text>
        </View>

        <View
          className="h-2 overflow-hidden rounded-full bg-surface-tertiary"
          onLayout={handleTimelineLayout}
          onTouchStart={() => setIsScrubbing(true)}
          onTouchEnd={() => setIsScrubbing(false)}
          onTouchCancel={() => setIsScrubbing(false)}
          onTouchMove={(event) => {
            if (!isScrubbing) {
              return;
            }
            handleTimelinePress(event.nativeEvent.locationX);
          }}
          onTouchStartCapture={(event) => {
            handleTimelinePress(event.nativeEvent.locationX);
          }}
        >
          <View
            className="h-full bg-accent"
            style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
          />
        </View>

        <View className="flex-row items-center justify-center gap-3">
          <PressableFeedback
            onPress={() => controller.seekBy(-1000)}
            className="rounded-full border border-border bg-overlay p-2 active:scale-95"
          >
            <BackwardIcon width={18} height={18} color="#b6a0ff" />
          </PressableFeedback>

          <PressableFeedback
            onPress={controller.togglePlayback}
            className="rounded-full border border-accent bg-accent/15 p-3 active:scale-95"
          >
            {controller.state.isPlaying ? (
              <PauseIcon width={20} height={20} color="#00e3fd" />
            ) : (
              <PlayIcon width={20} height={20} color="#00e3fd" />
            )}
          </PressableFeedback>

          <PressableFeedback
            onPress={() => controller.seekBy(1000)}
            className="rounded-full border border-border bg-overlay p-2 active:scale-95"
          >
            <ForwardIcon width={18} height={18} color="#b6a0ff" />
          </PressableFeedback>
        </View>
      </View>
    </View>
  );
}
