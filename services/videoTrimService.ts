import { t } from "@lingui/core/macro";
import { NativeEventEmitter, NativeModules } from "react-native";

type TrimToFileInput = {
	inputUri: string;
	startMs: number;
	endMs: number;
	onProgress?: (progress: number) => void;
};

type TrimToFileResult = {
	outputUri: string;
};

type NativeVideoTrimModule = {
	trimToFile: (input: {
		inputUri: string;
		startMs: number;
		endMs: number;
	}) => Promise<TrimToFileResult>;
};

type ProgressEvent = {
	inputUri: string;
	progress: number;
};

class VideoTrimService {
	private get nativeModule(): NativeVideoTrimModule | null {
		return (
			(NativeModules.VideoTrimModule as NativeVideoTrimModule | undefined) ??
			null
		);
	}

	async trimToFile({
		inputUri,
		startMs,
		endMs,
		onProgress,
	}: TrimToFileInput): Promise<TrimToFileResult> {
		console.log("VideoTrimService.trimToFile called with", {
			inputUri,
			startMs,
			endMs,
		});
		const nativeModule = this.nativeModule;

		if (!nativeModule?.trimToFile) {
			throw new Error(t`VideoTrimModule is not installed on Android.`);
		}

		const emitter = new NativeEventEmitter(NativeModules.VideoTrimModule);
		const subscription = emitter.addListener(
			"VideoTrimProgress",
			(event: ProgressEvent) => {
				console.log("Received progress event from native module:", event);
				if (event.inputUri === inputUri) {
					onProgress?.(event.progress);
				}
			},
		);

		try {
			onProgress?.(0);
			const result = await nativeModule.trimToFile({
				inputUri,
				startMs,
				endMs,
			});
			onProgress?.(1);
			return result;
		} finally {
			subscription.remove();
		}
	}
}

export const videoTrimService = new VideoTrimService();
