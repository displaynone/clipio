import VideoTrimEditor from '@/components/trim/VideoTrimEditor';
import { useVideoSelection } from '@/hooks/useVideoSelection';
import { videoTrimService } from '@/services/videoTrimService';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

export default function TrimScreen() {
  const params = useLocalSearchParams<{ uri?: string }>();
  const router = useRouter();
  const { trimsByUri, setTrimForUri, insertTrimmedUriAfter } = useVideoSelection();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const uri = typeof params.uri === 'string' ? decodeURIComponent(params.uri) : '';

  if (!uri) {
    return null;
  }

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          title: 'Trim Clip',
          headerShown: true,
        }}
      />

      <VideoTrimEditor
        uri={uri}
        initialTrim={trimsByUri[uri]}
        onSave={async (trim) => {
          console.log('Starting trim process for', uri, 'with trim:', trim);
          if (isProcessing) {
            return;
          }

          try {
            setIsProcessing(true);
            setProgress(0);

            const result = await videoTrimService.trimToFile({
              inputUri: uri,
              startMs: trim.startMs,
              endMs: trim.endMs ?? trim.durationMs ?? 0,
              onProgress: setProgress,
            });

            setTrimForUri(uri, trim);
            insertTrimmedUriAfter(uri, result.outputUri);
            console.log('Trim completed successfully, new URI:', result.outputUri);
            router.back();
          } catch (error) {
            Alert.alert('Trim no disponible', `${error}`);
          } finally {
            setIsProcessing(false);
          }
        }}
      />

      {isProcessing ? (
        <View className="absolute inset-0 items-center justify-center bg-background/80 px-6">
          <View className="w-full max-w-xs rounded-2xl bg-surface-secondary px-5 py-5">
            <Text className="mb-2 text-lg font-bold text-foreground">Procesando trim</Text>
            <Text className="mb-4 text-sm text-muted">
              FFmpeg está generando un nuevo clip.
            </Text>
            <View className="h-2 overflow-hidden rounded-full bg-background">
              <View
                className="h-full bg-accent"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </View>
            <Text className="mt-3 text-right text-xs font-bold uppercase tracking-[0.08em] text-accent">
              {Math.round(progress * 100)}%
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
