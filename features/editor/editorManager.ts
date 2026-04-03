import { TemplateEditorState } from "@/types/editor";
import { TemplateData, TemplateInstance } from "@/types/template";

export function createEditorState(template: TemplateData): TemplateEditorState {
	const instance: TemplateInstance = {
		templateId: template.id,
		selectedUris: [],
		style: template.defaultStyle,
	};

	return {
		templateInstance: instance,
		clips: [],
		error: undefined,
		isLoading: false,
		isExporting: false,
	};
}

export function validateTemplateReady(
	instance: TemplateInstance,
	maxSlots: number,
): boolean {
	return instance.selectedUris.length === maxSlots;
}
