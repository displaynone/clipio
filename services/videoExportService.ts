import { getDefaultExportEngine } from "@/features/video-editor/export/defaultExportEngine";
import { ExportProgressEvent, ExportResult } from "@/features/video-editor/export/contracts";
import { VideoProject } from "@/features/video-editor/domain/video-project";

export class VideoExportService {
  private readonly engine = getDefaultExportEngine();

  getEngineId() {
    return this.engine.id;
  }

  isFFmpegAvailable() {
    return this.engine.id === "ffmpeg-export" && this.engine.isAvailable();
  }

  async exportToFile(
    project: VideoProject,
    onProgress?: (event: ExportProgressEvent) => void,
  ): Promise<ExportResult> {
    return this.engine.exportProject(project, onProgress);
  }
}

export const videoExportService = new VideoExportService();
