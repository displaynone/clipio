import { Image, Text, View } from 'react-native';

export default function ClipioHeaderTitle() {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-default">
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 38, height: 38, borderRadius: 9 }}
          resizeMode="contain"
        />
      </View>
      <View>
        <Text className="text-3xl font-extrabold tracking-[-0.03em] text-foreground">
          Clipio
        </Text>
      </View>
    </View>
  );
}
