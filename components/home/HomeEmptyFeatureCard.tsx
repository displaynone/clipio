import { Text, View } from 'react-native';
import type { ComponentType } from 'react';

type IconProps = {
  color?: string;
  width?: number;
  height?: number;
};

type Props = {
  title: string;
  description: string;
  icon: ComponentType<IconProps>;
  iconColor: string;
};

export default function HomeEmptyFeatureCard({
  title,
  description,
  icon: Icon,
  iconColor,
}: Props) {
  return (
    <View className="flex-1 rounded-xl bg-surface/40 px-5 py-5">
      <View className="mb-3">
        <Icon width={20} height={20} color={iconColor} />
      </View>
      <Text className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-foreground">
        {title}
      </Text>
      <Text className="text-xs leading-5 text-muted">{description}</Text>
    </View>
  );
}
