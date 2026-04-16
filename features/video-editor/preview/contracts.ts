import { ComponentType } from "react";
import { VideoProject } from "../domain/video-project";

export type PreviewPlaybackState = {
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
  isReady: boolean;
};

export interface PreviewController {
  readonly state: PreviewPlaybackState;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  seekTo: (timeMs: number) => void;
  seekBy: (deltaMs: number) => void;
}

export type PreviewRendererProps = {
  project: VideoProject;
  controller: PreviewController;
};

export interface PreviewEngine {
  id: string;
  displayName: string;
  Renderer: ComponentType<PreviewRendererProps>;
}

