import TemplateCard from '@/components/TemplateCard';
import { templateRegistry } from '@/features/templates/templates';
import { useVideoSelection } from '@/hooks/useVideoSelection';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Button, ScrollShadow, useThemeColor } from 'heroui-native';
import { ScrollView, Text, View } from 'react-native';
import { ArrowLeftIcon } from 'react-native-heroicons/outline';

export default function SelectTemplateScreen() {
  const { selectedUris } = useVideoSelection();
  const router = useRouter();
  const foregroundColor = useThemeColor('foreground');

  // Filtrar plantillas que puedan acomodar la cantidad de videos seleccionados
  const availableTemplates = templateRegistry.filter(
    (template) => template.maxSlots >= selectedUris.length
  );

  return (
    <View className="h-full bg-background">
      <View className="flex-row items-center border-b border-border-secondary px-4 pt-5 pb-4">
        <Button onPress={() => router.back()} isIconOnly variant="ghost" className="mr-3">
          <ArrowLeftIcon color={foregroundColor} width={20} height={20} />
        </Button>
        <View className="">
          <Text className="text-2xl font-extrabold tracking-[-0.02em] text-foreground">Seleccionar plantilla</Text>
          <Text className="mt-0.5 text-sm text-muted">
            {selectedUris.length} video{selectedUris.length !== 1 ? 's' : ''} seleccionado{selectedUris.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <ScrollShadow className="flex-1" LinearGradientComponent={LinearGradient}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-4 pb-6 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {availableTemplates.length > 0 ? (
            availableTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))
          ) : (
            <View className="flex-1 items-center justify-center px-5 py-16">
              <Text className="mb-3 text-xl font-bold text-foreground">No hay plantillas disponibles</Text>
              <Text className="mb-6 text-center text-base leading-6 text-muted">
                No tienes plantillas que puedan acomodar {selectedUris.length} video{selectedUris.length !== 1 ? 's' : ''}.
                {'\n\n'}
                Regresa y selecciona menos videos o contacta al desarrollador para agregar más plantillas.
              </Text>
              <Button onPress={() => router.back()}>
                <Button.Label>Volver a seleccionar videos</Button.Label>
              </Button>
            </View>
          )}
        </ScrollView>
      </ScrollShadow>
    </View>
  );
}
