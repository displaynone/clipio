import { PressableFeedback } from 'heroui-native';
import { Text } from 'react-native';

type Props = {
  onPress: () => void;
  isLoading?: boolean;
};

export default function HeaderLoadVideosButton({ onPress, isLoading = false }: Props) {
  return (
    <PressableFeedback onPress={onPress} className="rounded-full bg-surface-secondary px-4 py-3">
      <Text className="text-xs font-bold uppercase tracking-[0.08em] text-link">
        {isLoading ? 'Loading...' : 'Load media'}
      </Text>
    </PressableFeedback>
  );
}
