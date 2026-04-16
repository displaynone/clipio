export type ProjectCanvas = {
  width: number;
  height: number;
  backgroundColor: string;
  fps: number;
  durationMs: number;
};

export type ItemFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ItemTransform = {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
  anchorX: number;
  anchorY: number;
};

export type ItemTransition = {
  type: "none" | "fade";
  durationMs: number;
};

export type ItemAnimation = {
  keyframes?: {
    atMs: number;
    opacity?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    translateX?: number;
    translateY?: number;
  }[];
};

export type BaseTrackItem = {
  id: string;
  kind: "video" | "audio" | "text" | "sticker" | "shape";
  trackId: string;
  startMs: number;
  durationMs: number;
  zIndex: number;
  visible: boolean;
  opacity: number;
  rotation: number;
  layout: ItemFrame;
  transform: ItemTransform;
  transition?: ItemTransition;
  animation?: ItemAnimation;
  sourceUri?: string;
};

export type VideoTrackItem = BaseTrackItem & {
  kind: "video";
  sourceUri: string;
  trimStartMs: number;
  trimEndMs: number | null;
  volume: number;
  playbackRate: number;
  slotId?: string;
};

export type AudioTrackItem = BaseTrackItem & {
  kind: "audio";
  sourceUri: string;
  trimStartMs: number;
  trimEndMs: number | null;
  volume: number;
  playbackRate: number;
  linkedItemId?: string;
};

export type TextTrackItem = BaseTrackItem & {
  kind: "text";
  text: string;
  color: string;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
};

export type ShapeTrackItem = BaseTrackItem & {
  kind: "shape";
  shape: "rect" | "circle";
  fill: string;
  strokeColor?: string;
  strokeWidth?: number;
};

export type StickerTrackItem = BaseTrackItem & {
  kind: "sticker";
  sourceUri: string;
};

export type TrackItem =
  | VideoTrackItem
  | AudioTrackItem
  | TextTrackItem
  | ShapeTrackItem
  | StickerTrackItem;

export type TrackType = "video" | "audio" | "text" | "sticker" | "shape";

export type ProjectTrack = {
  id: string;
  type: TrackType;
  name: string;
  items: TrackItem[];
  muted?: boolean;
  locked?: boolean;
};

export type VideoProject = {
  id: string;
  templateId?: string;
  canvas: ProjectCanvas;
  tracks: ProjectTrack[];
  createdAt: string;
  updatedAt: string;
  metadata?: {
    version: number;
    source: "template-adapter" | "manual";
    template?: {
      sequenceEffect?: import("@/types/template").TemplateSequenceEffect;
      sequenceTransitionSeconds?: number;
    };
  };
};

export const DEFAULT_ITEM_TRANSFORM: ItemTransform = {
  scaleX: 1,
  scaleY: 1,
  translateX: 0,
  translateY: 0,
  anchorX: 0.5,
  anchorY: 0.5,
};

export function isProjectVisualItem(
  item: TrackItem,
): item is VideoTrackItem | TextTrackItem | ShapeTrackItem | StickerTrackItem {
  return (
    item.kind === "video" ||
    item.kind === "text" ||
    item.kind === "shape" ||
    item.kind === "sticker"
  );
}

export function isItemActiveAtTime(item: TrackItem, timeMs: number) {
  return (
    item.visible &&
    timeMs >= item.startMs &&
    timeMs <= item.startMs + item.durationMs
  );
}
