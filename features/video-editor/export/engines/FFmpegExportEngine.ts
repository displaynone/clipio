import { VideoProject } from "../../domain/video-project";
import { ExportEngine, ExportResult } from "../contracts";
import { buildFFmpegCommand } from "../ffmpeg/buildFFmpegCommand";
import { FFmpegNativeBridge } from "../ffmpeg/FFmpegNativeBridge";
import { FFmpegCommandSpec } from "../ffmpeg/command-spec";

function replaceArgValue(args: string[], name: string, value: string) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return args;
  }

  return [
    ...args.slice(0, index + 1),
    value,
    ...args.slice(index + 2),
  ];
}

function removeArgWithValue(args: string[], name: string) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return args;
  }

  return [
    ...args.slice(0, index),
    ...args.slice(index + 2),
  ];
}

function buildSoftwareEncoderFallback(commandSpec: FFmpegCommandSpec): FFmpegCommandSpec {
  let outputArgs = replaceArgValue(commandSpec.outputArgs, "-c:v", "mpeg4");
  outputArgs = removeArgWithValue(outputArgs, "-maxrate");
  outputArgs = removeArgWithValue(outputArgs, "-bufsize");

  const outputPathPlaceholder = commandSpec.command.at(-1);

  return {
    ...commandSpec,
    outputArgs,
    command: [
      "-y",
      ...commandSpec.inputs.flatMap((input) => input.args),
      ...outputArgs,
      outputPathPlaceholder ?? "<output-path>",
    ],
  };
}

function isNativeCrash(error: unknown) {
  const message = error instanceof Error ? error.message : `${error}`;
  return /\bc[oó]digo 139\b/.test(message) || /\bcode 139\b/.test(message);
}

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

      let result: Awaited<ReturnType<FFmpegNativeBridge["exportProject"]>>;
      try {
        result = await this.bridge.exportProject(project, commandSpec, onProgress);
      } catch (error) {
        if (!isNativeCrash(error)) {
          throw error;
        }

        const fallbackCommandSpec = buildSoftwareEncoderFallback(commandSpec);
        console.log("[video-export][ffmpeg] Hardware encoder crashed, retrying with software encoder");
        result = await this.bridge.exportProject(project, fallbackCommandSpec, onProgress);
        commandSpec = fallbackCommandSpec;
      }

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
