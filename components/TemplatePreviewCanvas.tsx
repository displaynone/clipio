import { TemplateData, TemplateInstance } from '@/types/template';
import { Text, View, ViewStyle } from 'react-native';
import VideoSlot from './VideoSlot';

type Props = {
  template: TemplateData;
  instance: TemplateInstance;
};

export default function TemplatePreviewCanvas({ template, instance }: Props) {
  const videoUris = instance.selectedUris;
  const previewAspectRatio = template.output.width / template.output.height;

  return (
    <View
      className="mb-2.5 min-h-65 overflow-hidden rounded-2xl border border-border-secondary"
      style={{ backgroundColor: instance.style.backgroundColor }}
    >
      <View className="relative w-full self-center" style={{ aspectRatio: previewAspectRatio, maxWidth: 320 }}>
        {template.slots.map((slot, index) => {
          const uri = videoUris[index] ?? null;
          const style = {
            left: `${slot.x}%`,
            top: `${slot.y}%`,
            width: `${slot.width}%`,
            height: `${slot.height}%`,
            borderRadius: instance.style.borderRadius,
          } as ViewStyle;

          return <VideoSlot key={slot.id} uri={uri} style={style} gap={instance.style.gap} />;
        })}
      </View>
      {videoUris.length < template.maxSlots && (
        <Text className="mx-3 mt-2 text-xs text-muted">
          Puedes agregar {template.maxSlots - videoUris.length} vídeo{videoUris.length < template.maxSlots - 1 ? 's' : ''} más para completar la plantilla.
        </Text>
      )}
    </View>
  );
}
