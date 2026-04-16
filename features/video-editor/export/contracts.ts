import { VideoProject } from "../domain/video-project";

export type ExportProgressEvent = {
  engineId: string;
  progress: number;
  phase:
    | "preparing"
    | "building-command"
    | "rendering"
    | "saving"
    | "completed";
};

export type ExportResult = {
  success: boolean;
  outputUri?: string;
  error?: string;
  engineId: string;
  commandPreview?: string;
};

export interface ExportEngine {
  id: string;
  displayName: string;
  isAvailable: () => boolean;
  exportProject: (
    project: VideoProject,
    onProgress?: (event: ExportProgressEvent) => void,
  ) => Promise<ExportResult>;
}

