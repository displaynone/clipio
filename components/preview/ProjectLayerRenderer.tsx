import {
  ShapeTrackItem,
  StickerTrackItem,
  TextTrackItem,
  TrackItem,
  VideoTrackItem,
  isItemActiveAtTime,
} from "@/features/video-editor/domain/video-project";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect } from "react";
import { Text, View } from "react-native";

type Props = {
  item: TrackItem;
  currentTimeMs: number;
  isPlaying: boolean;
  previewScale: number;
};

function formatVideoTime(item: VideoTrackItem, currentTimeMs: number) {
  const relativeTimeMs = Math.max(0, currentTimeMs - item.startMs + item.trimStartMs);
  return relativeTimeMs / 1000;
}

function VideoLayerRenderer({
	item,
	currentTimeMs,
	isPlaying,
	previewScale,
}: { item: VideoTrackItem } & Omit<Props, "item">) {
  const isActive = isItemActiveAtTime(item, currentTimeMs);
  const player = useVideoPlayer(item.sourceUri, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.timeUpdateEventInterval = 0;
    videoPlayer.audioMixingMode = "auto";
  });

  useEffect(() => {
    player.muted = item.volume <= 0;
    player.volume = item.volume;
    player.playbackRate = item.playbackRate;
  }, [item.playbackRate, item.volume, player]);

  useEffect(() => {
    const targetTime = formatVideoTime(item, currentTimeMs);
    const playerTimeMs = player.currentTime * 1000;
    const desyncMs = Math.abs(playerTimeMs - targetTime * 1000);

    if (!isActive) {
      if (player.playing) {
        player.pause();
      }
      if (desyncMs > 80) {
        player.currentTime = Math.max(item.trimStartMs / 1000, targetTime);
      }
      return;
    }

    if (!isPlaying || desyncMs > 400) {
      player.currentTime = targetTime;
    }

    if (isPlaying && !player.playing) {
      player.play();
    }

    if (!isPlaying && player.playing) {
      player.pause();
    }
  }, [currentTimeMs, isActive, isPlaying, item, player]);

  return (
    <View
      className="absolute overflow-hidden"
      style={{
        left: item.layout.x * previewScale,
        top: item.layout.y * previewScale,
        width: item.layout.width * previewScale,
        height: item.layout.height * previewScale,
        opacity: isActive ? item.opacity : 0,
        transform: [
          { translateX: item.transform.translateX * previewScale },
          { translateY: item.transform.translateY * previewScale },
          { scaleX: item.transform.scaleX },
          { scaleY: item.transform.scaleY },
          { rotate: `${item.rotation}deg` },
        ],
        zIndex: item.zIndex,
      }}
    >
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}

function ImageLayerRenderer({
  item,
  currentTimeMs,
  previewScale,
}: {
  item: VideoTrackItem;
  currentTimeMs: number;
  previewScale: number;
}) {
  const isActive = isItemActiveAtTime(item, currentTimeMs);

  return (
    <View
      className="absolute overflow-hidden"
      style={{
        left: item.layout.x * previewScale,
        top: item.layout.y * previewScale,
        width: item.layout.width * previewScale,
        height: item.layout.height * previewScale,
        opacity: isActive ? item.opacity : 0,
        transform: [
          { translateX: item.transform.translateX * previewScale },
          { translateY: item.transform.translateY * previewScale },
          { scaleX: item.transform.scaleX },
          { scaleY: item.transform.scaleY },
          { rotate: `${item.rotation}deg` },
        ],
        zIndex: item.zIndex,
      }}
    >
      <Image
        source={{ uri: item.sourceUri }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
    </View>
  );
}

function TextLayerRenderer({
  item,
  currentTimeMs,
  previewScale,
}: {
  item: TextTrackItem;
  currentTimeMs: number;
  previewScale: number;
}) {
  if (!isItemActiveAtTime(item, currentTimeMs)) {
    return null;
  }

  return (
    <View
      className="absolute justify-center"
      style={{
        left: item.layout.x * previewScale,
        top: item.layout.y * previewScale,
        width: item.layout.width * previewScale,
        height: item.layout.height * previewScale,
        opacity: item.opacity,
        zIndex: item.zIndex,
        transform: [
          { translateX: item.transform.translateX * previewScale },
          { translateY: item.transform.translateY * previewScale },
          { scaleX: item.transform.scaleX },
          { scaleY: item.transform.scaleY },
          { rotate: `${item.rotation}deg` },
        ],
      }}
    >
      <Text
        style={{
          color: item.color,
          fontSize: item.fontSize * previewScale,
          fontFamily: item.fontFamily,
          fontWeight: item.fontWeight as never,
          textAlign: item.textAlign,
        }}
      >
        {item.text}
      </Text>
    </View>
  );
}

function ShapeLayerRenderer({
  item,
  currentTimeMs,
  previewScale,
}: {
  item: ShapeTrackItem;
  currentTimeMs: number;
  previewScale: number;
}) {
  if (!isItemActiveAtTime(item, currentTimeMs)) {
    return null;
  }

  return (
    <View
      className="absolute"
      style={{
        left: item.layout.x * previewScale,
        top: item.layout.y * previewScale,
        width: item.layout.width * previewScale,
        height: item.layout.height * previewScale,
        opacity: item.opacity,
        zIndex: item.zIndex,
        backgroundColor: item.fill,
        borderColor: item.strokeColor,
        borderWidth: (item.strokeWidth ?? 0) * previewScale,
        borderRadius:
          item.shape === "circle" ? (item.layout.width * previewScale) / 2 : 0,
        transform: [
          { translateX: item.transform.translateX * previewScale },
          { translateY: item.transform.translateY * previewScale },
          { scaleX: item.transform.scaleX },
          { scaleY: item.transform.scaleY },
          { rotate: `${item.rotation}deg` },
        ],
      }}
    />
  );
}

function StickerLayerRenderer({
  item,
  currentTimeMs,
  previewScale,
}: {
  item: StickerTrackItem;
  currentTimeMs: number;
  previewScale: number;
}) {
  if (!isItemActiveAtTime(item, currentTimeMs)) {
    return null;
  }

  return (
    <View
      className="absolute bg-surface-tertiary"
      style={{
        left: item.layout.x * previewScale,
        top: item.layout.y * previewScale,
        width: item.layout.width * previewScale,
        height: item.layout.height * previewScale,
        opacity: item.opacity,
        zIndex: item.zIndex,
      }}
    />
  );
}

export default function ProjectLayerRenderer({
  item,
  currentTimeMs,
  isPlaying,
  previewScale,
}: Props) {
  switch (item.kind) {
    case "video":
      if (item.sourceType === "image") {
        return (
          <ImageLayerRenderer
            item={item}
            currentTimeMs={currentTimeMs}
            previewScale={previewScale}
          />
        );
      }

      return (
        <VideoLayerRenderer
          item={item}
          currentTimeMs={currentTimeMs}
          isPlaying={isPlaying}
          previewScale={previewScale}
        />
      );
    case "text":
      return (
        <TextLayerRenderer
          item={item}
          currentTimeMs={currentTimeMs}
          previewScale={previewScale}
        />
      );
    case "shape":
      return (
        <ShapeLayerRenderer
          item={item}
          currentTimeMs={currentTimeMs}
          previewScale={previewScale}
        />
      );
    case "sticker":
      return (
        <StickerLayerRenderer
          item={item}
          currentTimeMs={currentTimeMs}
          previewScale={previewScale}
        />
      );
    case "audio":
    default:
      return null;
  }
}
