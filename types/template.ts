export type TemplateSlot = {
	id: string;
	x: number; // porcentaje 0-100
	y: number; // porcentaje 0-100
	width: number; // porcentaje 0-100
	height: number; // porcentaje 0-100
};

export type TemplateSequenceEffect =
	| "fade"
	| "blur"
	| "zoom"
	| "contrast-pop"
	| "pixelate"
	| "hlslice"
	| "hrslice"
	| "fadeblack"
	| "diagtl"
	| "flash-shake"
	| "rgb-split"
	| "glow"
	| "vhs-retro"
	| "light-point"
	| "wipe-left"
	| "wipe-up"
	| "circle-close";

export type TemplateStylePreset = {
	backgroundColor: string;
	gap: number;
	borderRadius: number;
	sequenceEffect?: TemplateSequenceEffect;
	sequenceTransitionSeconds?: number;
};

export type TemplateOutput = {
	width: number;
	height: number;
};

export type TemplateOrientation = "vertical" | "landscape";
export type TemplateKind = "grid" | "sequence";

export type TemplateData = {
	id: string;
	name: string;
	description: string;
	kind?: TemplateKind;
	orientation: TemplateOrientation;
	slots: TemplateSlot[];
	maxSlots: number | null;
	defaultStyle: TemplateStylePreset;
	output: TemplateOutput;
	template?: React.ReactNode;
};

export type TemplateInstance = {
	templateId: string;
	selectedUris: string[];
	audioSourceUri: string | null;
	style: TemplateStylePreset;
};

export function isUnlimitedTemplate(template: TemplateData) {
	return template.maxSlots == null;
}

export function getTemplateCapacity(template: TemplateData) {
	return template.maxSlots ?? Number.POSITIVE_INFINITY;
}
