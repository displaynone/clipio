import LibraryClipCard from '@/components/library/LibraryClipCard';
import LibrarySelectionFooter from '@/components/library/LibrarySelectionFooter';
import { FlatList, Text, View } from 'react-native';

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
      <FlatList
        data={libraryUris}
        keyExtractor={(uri, index) => `${uri}-${index}`}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 24, paddingTop: 32, paddingBottom: 40 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
        ListHeaderComponent={
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
        }
        renderItem={({ item: uri, index }) => (
          <LibraryClipCard
            uri={uri}
            index={index}
            onRemove={() => onRemove(index)}
            onToggleSelect={() => onToggleSelect(uri)}
            isSelected={selectedUris.includes(uri)}
          />
        )}
      />

      <LibrarySelectionFooter selectedUris={selectedUris} onContinue={onContinue} />
    </View>
  );
}
