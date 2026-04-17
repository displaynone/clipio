export type MediaAsset = {
	id: string;
	uri: string;
	type: "video" | "image";
	duration?: number;
	width?: number;
	height?: number;
};

export type MediaItemMetadata = {
	type: MediaAsset["type"];
	durationMs: number | null;
	width?: number;
	height?: number;
};

export type VideoTrim = {
	startMs: number;
	endMs: number | null;
	durationMs: number | null;
};
