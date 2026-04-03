export type MediaAsset = {
	id: string;
	uri: string;
	type: "video";
	duration?: number;
	width?: number;
	height?: number;
};

export type VideoTrim = {
	startMs: number;
	endMs: number | null;
	durationMs: number | null;
};
