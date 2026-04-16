import { TemplateData, TemplateInstance } from "@/types/template";
import { VideoTrim } from "@/types/media";
import {
  AudioTrackItem,
  DEFAULT_ITEM_TRANSFORM,
  ProjectTrack,
  VideoProject,
  VideoTrackItem,
} from "../domain/video-project";

const DEFAULT_TIMELINE_DURATION_MS = 15_000;
const DEFAULT_FPS = 30;
const DEFAULT_SEQUENCE_TRANSITION_MS = 1_000;
const SPEED_RAMP_START_MS = 1_000;
const SPEED_RAMP_SEGMENT_MS = 1_000;
const SPEED_RAMP_FACTOR = 2;

function resolveTrim(trim: VideoTrim | undefined) {
  const startMs = trim?.startMs ?? 0;
  const endMs = trim?.endMs;
  const durationMs = trim?.durationMs ?? (endMs != null ? Math.max(1, endMs - startMs) : null);

  return {
    startMs,
    endMs,
    durationMs,
  };
}

function resolveProjectDurationMs(
  instance: TemplateInstance,
  trimsByUri: Record<string, VideoTrim>,
) {
  const durations = instance.selectedUris
    .map((uri) => resolveTrim(trimsByUri[uri]).durationMs)
    .filter((value): value is number => typeof value === "number" && value > 0);

  return durations.length > 0
    ? Math.min(...durations)
    : DEFAULT_TIMELINE_DURATION_MS;
}

function resolveSpeedRampAdjustedDurationMs(durationMs: number) {
  if (durationMs < SPEED_RAMP_START_MS + SPEED_RAMP_SEGMENT_MS) {
    return durationMs;
  }

  const rampOutputDurationMs = Math.round(SPEED_RAMP_SEGMENT_MS / SPEED_RAMP_FACTOR);
  return Math.max(
    1,
    durationMs - SPEED_RAMP_SEGMENT_MS + rampOutputDurationMs,
  );
}

function buildGridProject(
  template: TemplateData,
  instance: TemplateInstance,
  trimsByUri: Record<string, VideoTrim>,
  durationMs: number,
) {
  const videoItems = template.slots
    .flatMap((slot, index): VideoTrackItem[] => {
      const sourceUri = instance.selectedUris[index];
      if (!sourceUri) {
        return [];
      }

      const trim = resolveTrim(trimsByUri[sourceUri]);
      const itemDurationMs = trim.durationMs ?? durationMs;

      return [{
        id: `video-${slot.id}`,
        kind: "video" as const,
        trackId: "video-track",
        sourceUri,
        slotId: slot.id,
        startMs: 0,
        durationMs: itemDurationMs,
        zIndex: index,
        visible: true,
        opacity: 1,
        rotation: 0,
        layout: {
          x: (slot.x / 100) * template.output.width,
          y: (slot.y / 100) * template.output.height,
          width: (slot.width / 100) * template.output.width,
          height: (slot.height / 100) * template.output.height,
        },
        transform: DEFAULT_ITEM_TRANSFORM,
        volume: instance.audioSourceUri === sourceUri ? 1 : 0,
        playbackRate: 1,
        trimStartMs: trim.startMs,
        trimEndMs: trim.endMs ?? null,
      }];
    });

  const audioItems: AudioTrackItem[] = instance.selectedUris.map((sourceUri, index) => {
    const trim = resolveTrim(trimsByUri[sourceUri]);
    const itemDurationMs = trim.durationMs ?? durationMs;

    return {
      id: `audio-${index}`,
      kind: "audio" as const,
      trackId: "audio-track",
      sourceUri,
      startMs: 0,
      durationMs: itemDurationMs,
      zIndex: 0,
      visible: true,
      opacity: 1,
      rotation: 0,
      layout: {
        x: 0,
        y: 0,
        width: template.output.width,
        height: template.output.height,
      },
      transform: DEFAULT_ITEM_TRANSFORM,
      volume: instance.audioSourceUri === sourceUri ? 1 : 0,
      playbackRate: 1,
      trimStartMs: trim.startMs,
      trimEndMs: trim.endMs ?? null,
      linkedItemId: videoItems[index]?.id,
    };
  });

  return { videoItems, audioItems, durationMs };
}

function buildSequenceProject(
  template: TemplateData,
  instance: TemplateInstance,
  trimsByUri: Record<string, VideoTrim>,
) {
  let currentStartMs = 0;
  const isSpeedRamp = instance.style.sequenceEffect === "speed-ramp";
  const isPixelate = instance.style.sequenceEffect === "pixelate";
  const configuredTransitionMs = Math.max(
    0,
    Math.round(
      (instance.style.sequenceTransitionSeconds ?? DEFAULT_SEQUENCE_TRANSITION_MS / 1000) * 1000,
    ),
  );

  const videoItems: VideoTrackItem[] = instance.selectedUris.map((sourceUri, index) => {
    const trim = resolveTrim(trimsByUri[sourceUri]);
    const sourceDurationMs = trim.durationMs ?? DEFAULT_TIMELINE_DURATION_MS;
    const itemDurationMs = isSpeedRamp
      ? resolveSpeedRampAdjustedDurationMs(sourceDurationMs)
      : sourceDurationMs;
    const transitionDurationMs =
      isSpeedRamp || isPixelate
        ? 0
        : index === 0
        ? 0
        : Math.min(configuredTransitionMs, Math.max(0, itemDurationMs - 1));
    const startMs = index === 0 ? 0 : Math.max(0, currentStartMs - transitionDurationMs);

    currentStartMs = startMs + itemDurationMs;

    return {
      id: `video-sequence-${index}`,
      kind: "video" as const,
      trackId: "video-track",
      sourceUri,
      slotId: `sequence-${index}`,
      startMs,
      durationMs: itemDurationMs,
      zIndex: index,
      visible: true,
      opacity: 1,
      rotation: 0,
      layout: {
        x: 0,
        y: 0,
        width: template.output.width,
        height: template.output.height,
      },
      transform: DEFAULT_ITEM_TRANSFORM,
      transition:
        transitionDurationMs > 0
          ? {
              type: "fade" as const,
              durationMs: transitionDurationMs,
            }
          : undefined,
      volume: 1,
      playbackRate: 1,
      trimStartMs: trim.startMs,
      trimEndMs: trim.endMs ?? null,
    };
  });

  const audioItems: AudioTrackItem[] = instance.selectedUris.map((sourceUri, index) => {
    const videoItem = videoItems[index];
    const trim = resolveTrim(trimsByUri[sourceUri]);

    return {
      id: `audio-sequence-${index}`,
      kind: "audio" as const,
      trackId: "audio-track",
      sourceUri,
      startMs: videoItem.startMs,
      durationMs: videoItem.durationMs,
      zIndex: 0,
      visible: true,
      opacity: 1,
      rotation: 0,
      layout: {
        x: 0,
        y: 0,
        width: template.output.width,
        height: template.output.height,
      },
      transform: DEFAULT_ITEM_TRANSFORM,
      transition: videoItem.transition,
      volume: 1,
      playbackRate: 1,
      trimStartMs: trim.startMs,
      trimEndMs: trim.endMs ?? null,
      linkedItemId: videoItem.id,
    };
  });

  const totalDurationMs =
    videoItems.length > 0
      ? Math.max(...videoItems.map((item) => item.startMs + item.durationMs))
      : DEFAULT_TIMELINE_DURATION_MS;

  return { videoItems, audioItems, durationMs: totalDurationMs };
}

export function buildProjectFromTemplate(
  template: TemplateData,
  instance: TemplateInstance,
  trimsByUri: Record<string, VideoTrim>,
): VideoProject {
  const createdAt = new Date().toISOString();
  const resolvedProject =
    template.kind === "sequence"
      ? buildSequenceProject(template, instance, trimsByUri)
      : buildGridProject(
          template,
          instance,
          trimsByUri,
          resolveProjectDurationMs(instance, trimsByUri),
        );

  const { videoItems, audioItems, durationMs } = resolvedProject;

  const tracks: ProjectTrack[] = [
    {
      id: "video-track",
      type: "video",
      name: "Video",
      items: videoItems,
    },
    {
      id: "audio-track",
      type: "audio",
      name: "Audio",
      items: audioItems,
    },
  ];

  return {
    id: `project-${template.id}`,
    templateId: template.id,
    canvas: {
      width: template.output.width,
      height: template.output.height,
      backgroundColor: instance.style.backgroundColor,
      fps: DEFAULT_FPS,
      durationMs,
    },
    tracks,
    createdAt,
    updatedAt: createdAt,
    metadata: {
      version: 1,
      source: "template-adapter",
      template: {
        sequenceEffect: instance.style.sequenceEffect,
        sequenceTransitionSeconds: instance.style.sequenceTransitionSeconds,
      },
    },
  };
}
