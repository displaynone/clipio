import { buildProjectFromTemplate } from "@/features/video-editor/adapters/templateProjectAdapter";
import { VideoProject } from "@/features/video-editor/domain/video-project";
import { useEditorStore } from "@/stores/editorStore";
import { TemplateData, TemplateInstance } from "@/types/template";
import { useMemo } from "react";

export function useEditorProject(
  template: TemplateData,
  instance: TemplateInstance,
): VideoProject {
  const trimsByUri = useEditorStore((state) => state.trimsByUri);
  const mediaByUri = useEditorStore((state) => state.mediaByUri);

  return useMemo(
    () => buildProjectFromTemplate(template, instance, trimsByUri, mediaByUri),
    [instance, template, trimsByUri, mediaByUri],
  );
}
