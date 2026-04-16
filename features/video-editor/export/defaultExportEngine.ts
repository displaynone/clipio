import { ExportEngine } from "./contracts";
import { FFmpegExportEngine } from "./engines/FFmpegExportEngine";
import { LegacyMedia3ExportEngine } from "./engines/LegacyMedia3ExportEngine";

const ffmpegExportEngine = new FFmpegExportEngine();
const legacyMedia3ExportEngine = new LegacyMedia3ExportEngine();

export function getDefaultExportEngine(): ExportEngine {
  return ffmpegExportEngine;
}

export const exportEngineRegistry = {
  ffmpeg: ffmpegExportEngine,
  legacyMedia3: legacyMedia3ExportEngine,
};
