import { useEditorStore } from '@/stores/editorStore';

export function useVideoSelection() {
	const libraryUris = useEditorStore((state) => state.libraryUris);
	const selectedUris = useEditorStore((state) => state.selectedUris);
	const trimsByUri = useEditorStore((state) => state.trimsByUri);
	const mediaByUri = useEditorStore((state) => state.mediaByUri);
	const addUri = useEditorStore((state) => state.addUri);
	const addMediaAssets = useEditorStore((state) => state.addMediaAssets);
	const registerMediaAssets = useEditorStore((state) => state.registerMediaAssets);
	const removeUri = useEditorStore((state) => state.removeUri);
	const clearUris = useEditorStore((state) => state.clearUris);
	const swapUris = useEditorStore((state) => state.swapUris);
	const selectUri = useEditorStore((state) => state.selectUri);
	const deselectUri = useEditorStore((state) => state.deselectUri);
	const toggleUriSelection = useEditorStore((state) => state.toggleUriSelection);
	const insertTrimmedUriAfter = useEditorStore((state) => state.insertTrimmedUriAfter);
	const setTrimForUri = useEditorStore((state) => state.setTrimForUri);
	const clearTrimForUri = useEditorStore((state) => state.clearTrimForUri);

	return {
		libraryUris,
		selectedUris,
		trimsByUri,
		mediaByUri,
		addUri,
		addMediaAssets,
		registerMediaAssets,
		removeUri,
		clearUris,
		swapUris,
		selectUri,
		deselectUri,
		toggleUriSelection,
		insertTrimmedUriAfter,
		setTrimForUri,
		clearTrimForUri,
	};
}
