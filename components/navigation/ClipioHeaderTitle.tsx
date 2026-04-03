import { useThemeColor } from 'heroui-native';
import { Text, View } from 'react-native';
import { FilmIcon } from 'react-native-heroicons/outline';

export default function ClipioHeaderTitle() {
  const primary = useThemeColor('link');

  return (
    <View className="flex-row items-center gap-3">
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-default">
        <FilmIcon width={22} height={22} color={primary} />
      </View>
      <View>
        <Text className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
          Director Mode
        </Text>
        <Text className="text-2xl font-extrabold tracking-[-0.03em] text-foreground">
          Clipio
        </Text>
      </View>
    </View>
  );
}
