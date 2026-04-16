import { Image } from 'expo-image';
import {
  getVideoThumbnailCached,
  shouldSkipThumbnailErrorLog,
} from '@/components/video-thumbnail-cache';
import { useThemeColor } from 'heroui-native';
import { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { VideoCameraIcon } from 'react-native-heroicons/outline';

function scheduleWhenIdle(task: () => void) {
  const handle = requestIdleCallback(task);
  return () => cancelIdleCallback(handle);
}

type Props = {
  uri: string | null;
  style?: StyleProp<ViewStyle>;
  className?: string;
  gap?: number;
};

type ActiveVideoSlotProps = Omit<Props, 'uri'> & { uri: string };

function LazyVideoSlot({ uri, style, className, gap = 0}: ActiveVideoSlotProps) {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const flattenedStyle = StyleSheet.flatten(style as StyleProp<ViewStyle>) ?? {};
  const extra = { borderRadius: flattenedStyle.borderRadius ?? 0, margin: gap / 2 };
  const mutedColor = useThemeColor('muted');

  useEffect(() => {
    let isMounted = true;

    const generateThumbnail = async () => {
      try {
        const generatedUri = await getVideoThumbnailCached(uri);

        if (isMounted) {
          setThumbnailUri(generatedUri);
        }
      } catch (error) {
        if (!shouldSkipThumbnailErrorLog(error)) {
          console.warn('Error generating slot thumbnail:', error);
        }
      }
    };

    const cancelTask = scheduleWhenIdle(() => {
      void generateThumbnail();
    });

    return () => {
      isMounted = false;
      cancelTask();
    };
  }, [uri]);

  return (
    <View className={`absolute overflow-hidden bg-surface-secondary ${className ?? ''}`} style={[flattenedStyle, extra]}>
      {thumbnailUri ? (
        <Image source={{ uri: thumbnailUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <View className="flex-1 items-center justify-center bg-surface-tertiary">
        <VideoCameraIcon color={mutedColor} width={24} height={24} />
        </View>
      )}
    </View>
  );
}

export default function VideoSlot({ uri, style, className, gap = 0}: Props) {
  const flattenedStyle = StyleSheet.flatten(style as StyleProp<ViewStyle>) ?? {};
  const extra = { borderRadius: flattenedStyle.borderRadius ?? 0, margin: gap / 2 };

  if (!uri) {
    return (
      <View className={`absolute overflow-hidden bg-surface-secondary ${className ?? ''}`} style={[flattenedStyle, extra]}>
        <View className="flex-1 bg-surface-tertiary" />
      </View>
    );
  }

  return <LazyVideoSlot uri={uri} style={style} className={className} gap={gap} />;
}
