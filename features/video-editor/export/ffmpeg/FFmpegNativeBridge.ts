import { t } from "@lingui/core/macro";
import { NativeEventEmitter, NativeModules } from "react-native";
import { VideoProject } from "../../domain/video-project";
import { ExportProgressEvent } from "../contracts";
import { FFmpegCommandSpec } from "./command-spec";

type NativeFFmpegExportModule = {
  exportProject: (input: {
    project: string;
    command: string[];
  }) => Promise<{ outputUri: string }>;
};

type NativeProgressEvent = {
  progress: number;
  phase?: ExportProgressEvent["phase"];
};

export class FFmpegNativeBridge {
  private get module(): NativeFFmpegExportModule | null {
    return (
      (NativeModules.FFmpegExportModule as NativeFFmpegExportModule | undefined) ??
      null
    );
  }

  isAvailable() {
    return Boolean(this.module?.exportProject);
  }

  async exportProject(
    project: VideoProject,
    commandSpec: FFmpegCommandSpec,
    onProgress?: (event: ExportProgressEvent) => void,
  ) {
    const nativeModule = this.module;
    if (!nativeModule) {
      throw new Error(
        t`FFmpegExportModule is not installed. Export no longer uses Media3/Transformer by default. To export with FFmpeg without third-party services, native FFmpeg must be integrated directly on Android.`,
      );
    }

    const emitter = new NativeEventEmitter(NativeModules.FFmpegExportModule);
    const subscription = emitter.addListener(
      "FFmpegExportProgress",
      (event: NativeProgressEvent) => {
        onProgress?.({
          engineId: "ffmpeg-export",
          progress: event.progress,
          phase: event.phase ?? "rendering",
        });
      },
    );

    try {
      return await nativeModule.exportProject({
        project: JSON.stringify(project),
        command: commandSpec.command,
      });
    } catch (error) {
      console.error("[video-export][ffmpeg][native] Export failed", {
        error,
        projectId: project.id,
        commandPreview: commandSpec.command.join(" "),
      });
      throw error;
    } finally {
      subscription.remove();
    }
  }
}
