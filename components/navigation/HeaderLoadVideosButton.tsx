import { PressableFeedback } from 'heroui-native';
import { Text } from 'react-native';
import { t } from '@lingui/core/macro';

type Props = {
  onPress: () => void;
  isLoading?: boolean;
};

export default function HeaderLoadVideosButton({ onPress, isLoading = false }: Props) {
  return (
    <PressableFeedback onPress={onPress} className="rounded-full bg-surface-secondary px-4 py-3">
      <Text className="text-xs font-bold uppercase tracking-[0.08em] text-link">
        {isLoading ? t`Loading...` : t`Load media`}
      </Text>
    </PressableFeedback>
  );
}
