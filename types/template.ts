export type TemplateSlot = {
	id: string;
	x: number; // porcentaje 0-100
	y: number; // porcentaje 0-100
	width: number; // porcentaje 0-100
	height: number; // porcentaje 0-100
};

export type TemplateStylePreset = {
	backgroundColor: string;
	gap: number;
	borderRadius: number;
};

export type TemplateOutput = {
	width: number;
	height: number;
};

export type TemplateData = {
	id: string;
	name: string;
	description: string;
	slots: TemplateSlot[];
	maxSlots: number;
	defaultStyle: TemplateStylePreset;
	output: TemplateOutput;
};

export type TemplateInstance = {
	templateId: string;
	selectedUris: string[];
	audioSourceUri: string | null;
	style: TemplateStylePreset;
};
