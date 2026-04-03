import HomeEmptyState from '@/components/home/HomeEmptyState';
import SelectedLibraryScreen from '@/components/library/SelectedLibraryScreen';
import HeaderLoadVideosButton from '@/components/navigation/HeaderLoadVideosButton';
import { pickVideoFromLibrary } from '@/features/media/mediaPicker';
import { useVideoSelection } from '@/hooks/useVideoSelection';
import { Tabs, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

export default function HomeScreen() {
  const { libraryUris, selectedUris, addUri, removeUri, toggleUriSelection } = useVideoSelection();
  const [isPickLoading, setIsPickLoading] = useState(false);
  const router = useRouter();

  const handlePickVideo = async () => {
    try {
      setIsPickLoading(true);
      const uris = await pickVideoFromLibrary();
      if (uris.length > 0) {
        addUri(uris);
      }
    } catch (error) {
      Alert.alert('Error al seleccionar video', `${error}`);
    } finally {
      setIsPickLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedUris.length === 0) {
      Alert.alert('Selecciona videos', 'Debes seleccionar al menos un video para continuar.');
      return;
    }
    router.push('/select-template');
  };

  return (
    <View>
      <Tabs.Screen
        options={{
          headerRight: () =>
            libraryUris.length > 0 ? (
              <HeaderLoadVideosButton onPress={handlePickVideo} isLoading={isPickLoading} />
            ) : null,
        }}
      />

      {libraryUris.length === 0 ? (
        <HomeEmptyState onLoadVideos={handlePickVideo} isLoading={isPickLoading} />
      ) : (
        <SelectedLibraryScreen
          libraryUris={libraryUris}
          selectedUris={selectedUris}
          onRemove={removeUri}
          onToggleSelect={toggleUriSelection}
          onContinue={handleContinue}
        />
      )}
    </View>
  );
}
