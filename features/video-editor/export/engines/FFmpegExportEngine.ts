import { VideoProject } from "../../domain/video-project";
import { ExportEngine, ExportResult } from "../contracts";
import { buildFFmpegCommand } from "../ffmpeg/buildFFmpegCommand";
import { FFmpegNativeBridge } from "../ffmpeg/FFmpegNativeBridge";

export class FFmpegExportEngine implements ExportEngine {
  readonly id = "ffmpeg-export";
  readonly displayName = "FFmpeg Export Engine";

  constructor(private readonly bridge = new FFmpegNativeBridge()) {}

  isAvailable() {
    return this.bridge.isAvailable();
  }

  async exportProject(
    project: VideoProject,
    onProgress?: Parameters<ExportEngine["exportProject"]>[1],
  ): Promise<ExportResult> {
    let commandSpec: ReturnType<typeof buildFFmpegCommand> | null = null;

    onProgress?.({
      engineId: this.id,
      phase: "building-command",
      progress: 0,
    });

    try {
      commandSpec = buildFFmpegCommand(project);

      onProgress?.({
        engineId: this.id,
        phase: "preparing",
        progress: 0.05,
      });

      const result = await this.bridge.exportProject(project, commandSpec, onProgress);
      return {
        success: true,
        outputUri: result.outputUri,
        engineId: this.id,
        commandPreview: commandSpec.command.join(" "),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : `${error}`;
      console.log("[video-export][ffmpeg] Export failed", error);
      console.log("[video-export][ffmpeg] Error message", errorMessage);
      console.error("[video-export][ffmpeg] Export failed", {
        error,
        errorMessage,
        commandPreview: commandSpec?.command.join(" "),
        projectId: project.id,
      });
      return {
        success: false,
        error: errorMessage,
        engineId: this.id,
        commandPreview: commandSpec?.command.join(" "),
      };
    }
  }
}
