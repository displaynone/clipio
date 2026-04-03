import {
    TemplateInstance,
    TemplateSlot,
    TemplateStylePreset,
} from "./template";

export type VideoClip = {
	id: string;
	uri: string;
	loaded?: boolean;
};

export type TemplateEditorConfig = {
	templateId: string;
	style: TemplateStylePreset;
	selectedUris: string[];
};

export type TemplateEditorState = {
	templateInstance: TemplateInstance;
	clips: VideoClip[];
	error?: string;
	isLoading: boolean;
	isExporting: boolean;
};

export type LayoutSlot = TemplateSlot;
