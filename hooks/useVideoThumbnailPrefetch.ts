import {
	getVideoThumbnailCached,
	hasVideoThumbnailCached,
} from "@/components/video-thumbnail-cache";
import { useEffect, useMemo, useState } from "react";

function scheduleWhenIdle(task: () => void) {
	const handle = requestIdleCallback(task);
	return () => cancelIdleCallback(handle);
}

export function useVideoThumbnailPrefetch(uris: string[]) {
	const uniqueUris = useMemo(() => [...new Set(uris.filter(Boolean))], [uris]);
	const [loadedUris, setLoadedUris] = useState<Record<string, true>>({});

	useEffect(() => {
		let isMounted = true;
		const cancelScheduledTasks: Array<() => void> = [];

		const initialLoadedUris = uniqueUris.reduce<Record<string, true>>((acc, uri) => {
			if (hasVideoThumbnailCached(uri)) {
				acc[uri] = true;
			}
			return acc;
		}, {});

		setLoadedUris(initialLoadedUris);

		uniqueUris.forEach((uri) => {
			if (initialLoadedUris[uri]) {
				return;
			}

			const cancelTask = scheduleWhenIdle(() => {
				getVideoThumbnailCached(uri)
					.then(() => {
						if (!isMounted) {
							return;
						}

						setLoadedUris((current) => {
							if (current[uri]) {
								return current;
							}

							return {
								...current,
								[uri]: true,
							};
						});
					})
					.catch(() => {
						if (!isMounted) {
							return;
						}

						setLoadedUris((current) => ({
							...current,
							[uri]: true,
						}));
					});
			});

			cancelScheduledTasks.push(cancelTask);
		});

		return () => {
			isMounted = false;
			cancelScheduledTasks.forEach((cancelTask) => cancelTask());
		};
	}, [uniqueUris]);

	const loadedCount = uniqueUris.filter((uri) => loadedUris[uri]).length;

	return {
		totalCount: uniqueUris.length,
		loadedCount,
		isLoading: loadedCount < uniqueUris.length,
	};
}
