import { t } from "@lingui/core/macro";
import { NativeEventEmitter, NativeModules } from "react-native";
import { VideoProject, VideoTrackItem } from "../../domain/video-project";
import { ExportEngine, ExportResult } from "../contracts";

type LegacyExportSlot = {
  uri: string;
  slotId: string;
  slotIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type LegacyExportPlan = {
  templateId: string;
  output: {
    width: number;
    height: number;
  };
  slots: LegacyExportSlot[];
  audioSourceUri: string | null;
  style: {
    backgroundColor: string;
    gap: number;
    borderRadius: number;
  };
  generatedAt: string;
};

type NativeVideoExportModule = {
  exportTemplateVideo: (input: LegacyExportPlan) => Promise<{ outputUri: string }>;
};

type NativeProgressEvent = {
  templateId: string;
  progress: number;
};

function getTemplateVideoItems(project: VideoProject) {
  return project.tracks
    .filter((track) => track.type === "video")
    .flatMap((track) => track.items)
    .filter((item): item is VideoTrackItem => item.kind === "video" && item.visible)
    .sort((left, right) => left.zIndex - right.zIndex);
}

function getAudioSourceUri(project: VideoProject) {
  const audioItem = project.tracks
    .filter((track) => track.type === "audio")
    .flatMap((track) => track.items)
    .find((item) => item.kind === "audio" && item.visible && item.volume > 0);

  return audioItem?.sourceUri ?? null;
}

export class LegacyMedia3ExportEngine implements ExportEngine {
  readonly id = "legacy-media3-export";
  readonly displayName = "Legacy Media3 Export Engine";

  private get nativeModule(): NativeVideoExportModule | null {
    return (
      (NativeModules.VideoExportModule as NativeVideoExportModule | undefined) ?? null
    );
  }

  isAvailable() {
    return Boolean(this.nativeModule?.exportTemplateVideo);
  }

  private buildLegacyPlan(project: VideoProject): LegacyExportPlan {
    const videoItems = getTemplateVideoItems(project);
    if (videoItems.length === 0) {
      throw new Error(t`There are no visible clips to export.`);
    }

    const style = {
      backgroundColor: project.canvas.backgroundColor,
      gap: 0,
      borderRadius: 0,
    };

    return {
      templateId: project.templateId ?? project.id,
      output: {
        width: project.canvas.width,
        height: project.canvas.height,
      },
      slots: videoItems.map((item, index) => ({
        uri: item.sourceUri,
        slotId: item.slotId ?? item.id,
        slotIndex: index,
        x: (item.layout.x / project.canvas.width) * 100,
        y: (item.layout.y / project.canvas.height) * 100,
        width: (item.layout.width / project.canvas.width) * 100,
        height: (item.layout.height / project.canvas.height) * 100,
      })),
      audioSourceUri: getAudioSourceUri(project),
      style,
      generatedAt: new Date().toISOString(),
    };
  }

  async exportProject(
    project: VideoProject,
    onProgress?: Parameters<ExportEngine["exportProject"]>[1],
  ): Promise<ExportResult> {
    const nativeModule = this.nativeModule;
    if (!nativeModule?.exportTemplateVideo) {
      return {
        success: false,
        error: t`VideoExportModule is not installed on Android.`,
        engineId: this.id,
      };
    }

    const plan = this.buildLegacyPlan(project);
    const emitter = new NativeEventEmitter(NativeModules.VideoExportModule);
    const subscription = emitter.addListener(
      "VideoExportProgress",
      (event: NativeProgressEvent) => {
        if (event.templateId !== plan.templateId) {
          return;
        }

        onProgress?.({
          engineId: this.id,
          progress: event.progress,
          phase: event.progress >= 1 ? "completed" : "rendering",
        });
      },
    );

    try {
      onProgress?.({
        engineId: this.id,
        progress: 0,
        phase: "preparing",
      });
      const result = await nativeModule.exportTemplateVideo(plan);
      onProgress?.({
        engineId: this.id,
        progress: 1,
        phase: "completed",
      });
      return {
        success: true,
        outputUri: result.outputUri,
        engineId: this.id,
      };
    } catch (error) {
      console.error("[video-export][legacy-media3] Export failed", {
        error,
        templateId: plan.templateId,
        projectId: project.id,
      });
      return {
        success: false,
        error: `${error}`,
        engineId: this.id,
      };
    } finally {
      subscription.remove();
    }
  }
}
