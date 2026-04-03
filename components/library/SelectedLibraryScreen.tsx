import LibraryClipCard from '@/components/library/LibraryClipCard';
import LibrarySelectionFooter from '@/components/library/LibrarySelectionFooter';
import { ScrollView, Text, View } from 'react-native';

type Props = {
  libraryUris: string[];
  selectedUris: string[];
  onRemove: (index: number) => void;
  onToggleSelect: (uri: string) => void;
  onContinue: () => void;
};

export default function SelectedLibraryScreen({
  libraryUris,
  selectedUris,
  onRemove,
  onToggleSelect,
  onContinue,
}: Props) {
  return (
    <View className="h-full bg-background">
      <ScrollView
        className="h-full"
        contentContainerClassName="px-6 pt-8 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-10 flex-row items-end justify-between gap-4">
          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-accent">
              Library
            </Text>
            <Text className="text-4xl font-extrabold tracking-[-0.03em] text-foreground">
              Select Clips
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between">
          {libraryUris.map((uri, index) => (
            <LibraryClipCard
              key={`${uri}-${index}`}
              uri={uri}
              index={index}
              onRemove={() => onRemove(index)}
              onToggleSelect={() => onToggleSelect(uri)}
              isSelected={selectedUris.includes(uri)}
            />
          ))}
        </View>
      </ScrollView>

      <LibrarySelectionFooter selectedUris={selectedUris} onContinue={onContinue} />
    </View>
  );
}
