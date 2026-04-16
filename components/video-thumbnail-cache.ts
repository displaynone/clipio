import * as VideoThumbnails from "expo-video-thumbnails";

const thumbnailUriCache = new Map<string, string>();
const thumbnailPromiseCache = new Map<string, Promise<string>>();
const thumbnailFailureCache = new Map<string, Error>();
const pendingThumbnailTasks: (() => void)[] = [];
const MAX_CONCURRENT_THUMBNAILS = 1;
let activeThumbnailTasks = 0;

function normalizeThumbnailError(error: unknown): Error {
	if (error instanceof Error) {
		return error;
	}

	return new Error(String(error));
}

function isOutOfMemoryThumbnailError(error: unknown): boolean {
	const message = normalizeThumbnailError(error).message.toLowerCase();
	return message.includes("outofmemoryerror") || message.includes("oom");
}

function scheduleThumbnailTask<T>(task: () => Promise<T>): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const runTask = () => {
			activeThumbnailTasks += 1;
			task()
				.then(resolve)
				.catch(reject)
				.finally(() => {
					activeThumbnailTasks -= 1;
					const nextTask = pendingThumbnailTasks.shift();
					nextTask?.();
				});
		};

		if (activeThumbnailTasks < MAX_CONCURRENT_THUMBNAILS) {
			runTask();
			return;
		}

		pendingThumbnailTasks.push(runTask);
	});
}

export async function getVideoThumbnailCached(uri: string): Promise<string> {
	const cachedThumbnailUri = thumbnailUriCache.get(uri);
	if (cachedThumbnailUri) {
		return cachedThumbnailUri;
	}

	const cachedFailure = thumbnailFailureCache.get(uri);
	if (cachedFailure) {
		throw cachedFailure;
	}

	const inflightPromise = thumbnailPromiseCache.get(uri);
	if (inflightPromise) {
		return inflightPromise;
	}

	const thumbnailPromise = scheduleThumbnailTask(() =>
		VideoThumbnails.getThumbnailAsync(uri, {
			time: 1000,
			quality: 0.4,
		}),
	)
		.then(({ uri: generatedUri }) => {
			thumbnailUriCache.set(uri, generatedUri);
			thumbnailPromiseCache.delete(uri);
			thumbnailFailureCache.delete(uri);
			return generatedUri;
		})
		.catch((error) => {
			const normalizedError = normalizeThumbnailError(error);
			thumbnailPromiseCache.delete(uri);
			thumbnailFailureCache.set(uri, normalizedError);
			throw normalizedError;
		});

	thumbnailPromiseCache.set(uri, thumbnailPromise);
	return thumbnailPromise;
}

export function hasVideoThumbnailCached(uri: string): boolean {
	return thumbnailUriCache.has(uri);
}

export function shouldSkipThumbnailErrorLog(error: unknown): boolean {
	return isOutOfMemoryThumbnailError(error);
}
