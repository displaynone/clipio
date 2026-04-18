import { Image } from 'expo-image';
import {
  getVideoThumbnailCached,
  shouldSkipThumbnailErrorLog,
} from '@/components/video-thumbnail-cache';
import { PressableFeedback, useThemeColor } from 'heroui-native';
import { useEffect, useState } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { PhotoIcon, VideoCameraIcon } from 'react-native-heroicons/outline';
import { Trans } from '@lingui/react/macro';

function scheduleThumbnailGeneration(task: () => void) {
  const handle = setTimeout(task, 80);
  return () => clearTimeout(handle);
}

type Props = {
  uri: string;
  mediaType?: "video" | "image";
  style?: StyleProp<ViewStyle>;
  className?: string;
  onPress?: () => void;
  label?: string;
};

export default function VideoThumbnail({ uri, mediaType = "video", style, className, onPress, label }: Props) {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const mutedColor = useThemeColor('muted');
  const displayUri = mediaType === "image" ? uri : thumbnailUri;

  // Extract the file name from the URI to display as a fallback.
  const fileName = uri.split('/').pop()?.split('.')[0] || 'Video';

  useEffect(() => {
    if (mediaType === "image") {
      setThumbnailUri(null);
      setIsGenerating(false);
      return;
    }

    let isMounted = true;

    const generateThumbnail = async () => {
      if (thumbnailUri) return;

      try {
        setIsGenerating(true);
        const generatedUri = await getVideoThumbnailCached(uri);

        if (isMounted) {
          setThumbnailUri(generatedUri);
        }
      } catch (error) {
        if (!shouldSkipThumbnailErrorLog(error)) {
          console.warn('Error generating thumbnail:', error);
        }
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    };

    const cancelTask = scheduleThumbnailGeneration(() => {
      void generateThumbnail();
    });

    return () => {
      isMounted = false;
      cancelTask();
    };
  }, [mediaType, thumbnailUri, uri]);

  return (
    <PressableFeedback
      onPress={onPress}
      style={style}
      className={`relative overflow-hidden rounded-lg bg-surface-secondary ${className ?? ''}`}
    >
      {displayUri ? (
        <Image source={{ uri: displayUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <View className="flex-1 items-center justify-center p-2">
          {mediaType === "image" ? (
            <PhotoIcon color={mutedColor} width={32} height={32} />
          ) : (
            <VideoCameraIcon color={mutedColor} width={32} height={32} />
          )}
          <Text className="mt-2 text-center text-xs leading-4 text-muted" numberOfLines={2}>
            {fileName}
          </Text>
          {isGenerating && (
            <Text className="mt-1 text-[10px] text-accent">
              <Trans>Generating...</Trans>
            </Text>
          )}
        </View>
      )}
      <View className="absolute inset-0 bg-black/10" />
      {label && (
        <View className="absolute right-1 bottom-1 left-1 rounded-sm bg-black/70 px-1.5 py-0.5">
          <Text className="text-center text-[10px] text-foreground">{label}</Text>
        </View>
      )}
    </PressableFeedback>
  );
}
