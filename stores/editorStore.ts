import { TemplateData, TemplateInstance, TemplateStylePreset } from '@/types/template';
import { VideoTrim } from '@/types/media';
import { create } from 'zustand';

type TemplateEditorSlice = {
  instance: TemplateInstance | null;
  initializeEditor: (template: TemplateData, seedUris?: string[]) => void;
  resetEditor: () => void;
  addEditorUri: (uri: string | string[], maxSlots?: number) => void;
  swapEditorUris: (index: number, direction: -1 | 1) => void;
  moveEditorUri: (fromIndex: number, toIndex: number) => void;
  removeEditorUri: (index: number) => void;
  setEditorAudioSource: (uri: string) => void;
  updateEditorStyle: (patch: Partial<TemplateStylePreset>) => void;
};

type MediaSelectionSlice = {
  libraryUris: string[];
  selectedUris: string[];
  trimsByUri: Record<string, VideoTrim>;
  setLibraryUris: (uris: string[]) => void;
  setSelectedUris: (uris: string[]) => void;
  addUri: (uri: string | string[]) => void;
  removeUri: (index: number) => void;
  clearUris: () => void;
  swapUris: (index: number, direction: -1 | 1) => void;
  selectUri: (uri: string) => void;
  deselectUri: (uri: string) => void;
  toggleUriSelection: (uri: string) => void;
  insertTrimmedUriAfter: (sourceUri: string, trimmedUri: string) => void;
  setTrimForUri: (uri: string, trim: VideoTrim) => void;
  clearTrimForUri: (uri: string) => void;
};

type EditorStore = MediaSelectionSlice & TemplateEditorSlice;

function normalizeAppend(previous: string[], incoming: string | string[], maxSlots?: number) {
  const nextUris = Array.isArray(incoming) ? incoming : [incoming];
  if (typeof maxSlots !== 'number') {
    return [...previous, ...nextUris];
  }

  const available = Math.max(0, maxSlots - previous.length);
  return [...previous, ...nextUris.slice(0, available)];
}

function swapAtIndex(items: string[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const copy = [...items];
  [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
  return copy;
}

function moveAtIndex(items: string[], fromIndex: number, toIndex: number) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const copy = [...items];
  const [movedItem] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, movedItem);
  return copy;
}

function resolveAudioSource(
  selectedUris: string[],
  currentAudioSourceUri?: string | null,
) {
  if (currentAudioSourceUri && selectedUris.includes(currentAudioSourceUri)) {
    return currentAudioSourceUri;
  }

  return selectedUris[0] ?? null;
}

export const useEditorStore = create<EditorStore>((set) => ({
  libraryUris: [],
  selectedUris: [],
  trimsByUri: {},
  instance: null,

  setLibraryUris: (uris) => set({ libraryUris: uris, selectedUris: uris, instance: null }),

  setSelectedUris: (uris) => set({ selectedUris: uris, instance: null }),

  addUri: (uri) =>
    set((state) => {
      const nextUris = Array.isArray(uri) ? uri : [uri];

      return {
        libraryUris: normalizeAppend(state.libraryUris, nextUris),
        selectedUris: normalizeAppend(state.selectedUris, nextUris),
        instance: null,
      };
    }),

  removeUri: (index) =>
    set((state) => {
      const removedUri = state.libraryUris[index];
      const nextTrimsByUri = { ...state.trimsByUri };
      delete nextTrimsByUri[removedUri];

      return {
        libraryUris: state.libraryUris.filter((_, i) => i !== index),
        selectedUris: state.selectedUris.filter((uri) => uri !== removedUri),
        trimsByUri: nextTrimsByUri,
        instance: null,
      };
    }),

  clearUris: () => set({ libraryUris: [], selectedUris: [], trimsByUri: {}, instance: null }),

  swapUris: (index, direction) =>
    set((state) => ({
      libraryUris: swapAtIndex(state.libraryUris, index, direction),
      instance: null,
    })),

  selectUri: (uri) =>
    set((state) => {
      if (state.selectedUris.includes(uri)) {
        return state;
      }

      return {
        selectedUris: [...state.selectedUris, uri],
        instance: null,
      };
    }),

  deselectUri: (uri) =>
    set((state) => ({
      selectedUris: state.selectedUris.filter((selectedUri) => selectedUri !== uri),
      instance: null,
    })),

  toggleUriSelection: (uri) =>
    set((state) => ({
      selectedUris: state.selectedUris.includes(uri)
        ? state.selectedUris.filter((selectedUri) => selectedUri !== uri)
        : [...state.selectedUris, uri],
      instance: null,
    })),

  insertTrimmedUriAfter: (sourceUri, trimmedUri) =>
    set((state) => {
      const sourceIndex = state.libraryUris.indexOf(sourceUri);
      if (sourceIndex === -1 || state.libraryUris.includes(trimmedUri)) {
        return state;
      }

      const nextLibraryUris = [...state.libraryUris];
      nextLibraryUris.splice(sourceIndex + 1, 0, trimmedUri);

      const nextSelectedUris = state.selectedUris.includes(sourceUri)
        ? [...state.selectedUris, trimmedUri]
        : state.selectedUris;

      return {
        libraryUris: nextLibraryUris,
        selectedUris: nextSelectedUris,
        instance: null,
      };
    }),

  setTrimForUri: (uri, trim) =>
    set((state) => ({
      trimsByUri: {
        ...state.trimsByUri,
        [uri]: trim,
      },
    })),

  clearTrimForUri: (uri) =>
    set((state) => {
      const nextTrimsByUri = { ...state.trimsByUri };
      delete nextTrimsByUri[uri];

      return {
        trimsByUri: nextTrimsByUri,
      };
    }),

  initializeEditor: (template, seedUris) =>
    set((state) => {
      if (state.instance?.templateId === template.id) {
        return state;
      }

      const initialUris =
        template.maxSlots == null
          ? [...(seedUris ?? state.selectedUris)]
          : (seedUris ?? state.selectedUris).slice(0, template.maxSlots);

      return {
        instance: {
          templateId: template.id,
          selectedUris: initialUris,
          audioSourceUri: initialUris[0] ?? null,
          style: { ...template.defaultStyle },
        },
      };
    }),

  resetEditor: () => set({ instance: null }),

  addEditorUri: (uri, maxSlots) =>
    set((state) => {
      if (!state.instance) {
        return state;
      }

      return {
        instance: {
          ...state.instance,
          selectedUris: normalizeAppend(state.instance.selectedUris, uri, maxSlots),
          audioSourceUri: resolveAudioSource(
            normalizeAppend(state.instance.selectedUris, uri, maxSlots),
            state.instance.audioSourceUri,
          ),
        },
      };
    }),

  swapEditorUris: (index, direction) =>
    set((state) => {
      if (!state.instance) {
        return state;
      }

      return {
        instance: {
          ...state.instance,
          selectedUris: swapAtIndex(state.instance.selectedUris, index, direction),
        },
      };
    }),

  moveEditorUri: (fromIndex, toIndex) =>
    set((state) => {
      if (!state.instance) {
        return state;
      }

      return {
        instance: {
          ...state.instance,
          selectedUris: moveAtIndex(state.instance.selectedUris, fromIndex, toIndex),
        },
      };
    }),

  removeEditorUri: (index) =>
    set((state) => {
      if (!state.instance) {
        return state;
      }

      const nextSelectedUris = state.instance.selectedUris.filter((_, i) => i !== index);

      return {
        instance: {
          ...state.instance,
          selectedUris: nextSelectedUris,
          audioSourceUri: resolveAudioSource(
            nextSelectedUris,
            state.instance.audioSourceUri,
          ),
        },
      };
    }),

  setEditorAudioSource: (uri) =>
    set((state) => {
      if (!state.instance || !state.instance.selectedUris.includes(uri)) {
        return state;
      }

      return {
        instance: {
          ...state.instance,
          audioSourceUri: uri,
        },
      };
    }),

  updateEditorStyle: (patch) =>
    set((state) => {
      if (!state.instance) {
        return state;
      }

      return {
        instance: {
          ...state.instance,
          style: {
            ...state.instance.style,
            ...patch,
          },
        },
      };
    }),
}));
