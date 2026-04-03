import { TemplateData, TemplateInstance } from "@/types/template";
import { NativeEventEmitter, NativeModules } from "react-native";

export type VideoExportSlot = {
	uri: string;
	slotId: string;
	slotIndex: number;
	x: number;
	y: number;
	width: number;
	height: number;
};

export type VideoExportPlan = {
	templateId: string;
	output: TemplateData["output"];
	slots: VideoExportSlot[];
	audioSourceUri: string | null;
	style: TemplateInstance["style"];
	generatedAt: string;
};

export type VideoExportResult = {
	success: boolean;
	outputUri?: string;
	error?: string;
};

type ExportProgressEvent = {
	templateId: string;
	progress: number;
};

type NativeVideoExportModule = {
	exportTemplateVideo: (input: VideoExportPlan) => Promise<{ outputUri: string }>;
};

export class VideoExportService {
	private get nativeModule(): NativeVideoExportModule | null {
		return (
			(NativeModules.VideoExportModule as NativeVideoExportModule | undefined) ??
			null
		);
	}

	buildPlan(template: TemplateData, instance: TemplateInstance): VideoExportPlan {
		if (instance.selectedUris.length === 0) {
			throw new Error("No hay clips seleccionados para exportar.");
		}

		return {
			templateId: instance.templateId,
			output: template.output,
			slots: template.slots.map((slot, index) => ({
				uri: instance.selectedUris[index] ?? "",
				slotId: slot.id,
				slotIndex: index,
				x: slot.x,
				y: slot.y,
				width: slot.width,
				height: slot.height,
			})).filter((slot) => Boolean(slot.uri)),
			audioSourceUri: instance.audioSourceUri,
			style: instance.style,
			generatedAt: new Date().toISOString(),
		};
	}

	async exportToFile(
		template: TemplateData,
		instance: TemplateInstance,
		onProgress?: (progress: number) => void,
	): Promise<VideoExportResult> {
		const nativeModule = this.nativeModule;
		if (!nativeModule?.exportTemplateVideo) {
			throw new Error("VideoExportModule no está instalado en Android.");
		}

		const plan = this.buildPlan(template, instance);
		const emitter = new NativeEventEmitter(NativeModules.VideoExportModule);
		const subscription = emitter.addListener(
			"VideoExportProgress",
			(event: ExportProgressEvent) => {
				if (event.templateId === plan.templateId) {
					onProgress?.(event.progress);
				}
			},
		);

		try {
			onProgress?.(0);
			const result = await nativeModule.exportTemplateVideo(plan);
			onProgress?.(1);
			return {
				success: true,
				outputUri: result.outputUri,
			};
		} catch (error) {
			return {
				success: false,
				error: `${error}`,
			};
		} finally {
			subscription.remove();
		}
	}
}

export const videoExportService = new VideoExportService();
