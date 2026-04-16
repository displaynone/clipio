import { useEditorStore } from '@/stores/editorStore';
import {
	isUnlimitedTemplate,
	TemplateData,
	TemplateInstance,
	TemplateSequenceEffect,
} from '@/types/template';
import { useEffect, useMemo } from 'react';

export function useTemplateInstance(template: TemplateData) {
	const selectedGlobalUris = useEditorStore((state) => state.selectedUris);
	const storedInstance = useEditorStore((state) => state.instance);
	const initializeEditor = useEditorStore((state) => state.initializeEditor);
	const addEditorUri = useEditorStore((state) => state.addEditorUri);
	const swapEditorUris = useEditorStore((state) => state.swapEditorUris);
	const moveEditorUri = useEditorStore((state) => state.moveEditorUri);
	const removeEditorUri = useEditorStore((state) => state.removeEditorUri);
	const setEditorAudioSource = useEditorStore((state) => state.setEditorAudioSource);
	const updateEditorStyle = useEditorStore((state) => state.updateEditorStyle);

	useEffect(() => {
		initializeEditor(template, selectedGlobalUris);
	}, [initializeEditor, selectedGlobalUris, template]);

	const instance = useMemo<TemplateInstance>(
		() =>
			storedInstance?.templateId === template.id
				? storedInstance
				: {
						templateId: template.id,
						selectedUris: isUnlimitedTemplate(template)
							? [...selectedGlobalUris]
							: selectedGlobalUris.slice(0, template.maxSlots ?? undefined),
						audioSourceUri: selectedGlobalUris[0] ?? null,
						style: template.defaultStyle,
				  },
		[storedInstance, template, selectedGlobalUris],
	);

	const addUri = (uri: string | string[]) =>
		addEditorUri(
			uri,
			isUnlimitedTemplate(template) ? undefined : (template.maxSlots ?? undefined),
		);
	const swap = (index: number, direction: -1 | 1) => swapEditorUris(index, direction);
	const move = (fromIndex: number, toIndex: number) => moveEditorUri(fromIndex, toIndex);
	const remove = (index: number) => removeEditorUri(index);
	const setAudioSource = (uri: string) => setEditorAudioSource(uri);
	const setGap = (gap: number) => updateEditorStyle({ gap });
	const setBorderRadius = (borderRadius: number) => updateEditorStyle({ borderRadius });
	const setBackgroundColor = (backgroundColor: string) => updateEditorStyle({ backgroundColor });
	const setSequenceEffect = (sequenceEffect: TemplateSequenceEffect) =>
		updateEditorStyle({ sequenceEffect });
	const setSequenceTransitionSeconds = (sequenceTransitionSeconds: number) =>
		updateEditorStyle({ sequenceTransitionSeconds });

	return {
		instance,
		selectedUris: instance.selectedUris,
		audioSourceUri: instance.audioSourceUri,
		addUri,
		swap,
		move,
		remove,
		setAudioSource,
		setGap,
		setBorderRadius,
		setBackgroundColor,
		setSequenceEffect,
		setSequenceTransitionSeconds,
	};
}
