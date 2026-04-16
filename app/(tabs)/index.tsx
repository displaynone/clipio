import HomeEmptyState from '@/components/home/HomeEmptyState';
import SelectedLibraryScreen from '@/components/library/SelectedLibraryScreen';
import HeaderLoadVideosButton from '@/components/navigation/HeaderLoadVideosButton';
import { pickVideoFromLibrary } from '@/features/media/mediaPicker';
import { useVideoSelection } from '@/hooks/useVideoSelection';
import { Tabs, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { MediaAsset } from '@/types/media';

const VIDEO_IMPORT_CHUNK_SIZE = 6;

function chunkAssets(assets: MediaAsset[], chunkSize: number) {
  const chunks: MediaAsset[][] = [];

  for (let index = 0; index < assets.length; index += chunkSize) {
    chunks.push(assets.slice(index, index + chunkSize));
  }

  return chunks;
}

function yieldToUI() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export default function HomeScreen() {
  const {
    libraryUris,
    selectedUris,
    addUri,
    removeUri,
    toggleUriSelection,
    setTrimForUri,
  } = useVideoSelection();
  const [isPickLoading, setIsPickLoading] = useState(false);
  const router = useRouter();

  const appendAssetChunk = (assets: MediaAsset[]) => {
    if (assets.length === 0) {
      return;
    }

    addUri(assets.map((asset) => asset.uri));

    assets.forEach((asset) => {
      if (asset.duration == null || asset.duration <= 0) {
        return;
      }

      setTrimForUri(asset.uri, {
        startMs: 0,
        endMs: asset.duration,
        durationMs: asset.duration,
      });
    });
  };

  const handlePickVideo = async () => {
    try {
      setIsPickLoading(true);
      const assets = await pickVideoFromLibrary();
      if (assets.length > 0) {
        const assetChunks = chunkAssets(assets, VIDEO_IMPORT_CHUNK_SIZE);
        const [firstChunk, ...remainingChunks] = assetChunks;

        appendAssetChunk(firstChunk ?? []);
        await yieldToUI();

        for (const chunk of remainingChunks) {
          appendAssetChunk(chunk);
          await yieldToUI();
        }
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
