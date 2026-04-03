import { TemplateData, TemplateInstance } from "@/types/template";

export type TemplateViewProps = {
	template: TemplateData;
	instance: TemplateInstance;
	selectedUris: string[];
	audioSourceUri: string | null;
	isPickLoading: boolean;
	accentColor: string;
	foregroundColor: string;
	onPick: () => void;
	onSwap: (index: number, direction: -1 | 1) => void;
	onMove: (fromIndex: number, toIndex: number) => void;
	onRemove: (index: number) => void;
	onSetAudioSource: (uri: string) => void;
	onSetGap: (gap: number) => void;
	onSetBorderRadius: (borderRadius: number) => void;
	onSetBackgroundColor: (backgroundColor: string) => void;
};
