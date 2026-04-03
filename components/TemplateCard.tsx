import { TemplateData } from '@/types/template';
import { Card, PressableFeedback, useThemeColor } from 'heroui-native';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { SparklesIcon } from 'react-native-heroicons/outline';

type Props = {
  template: TemplateData;
};

export default function TemplateCard({ template }: Props) {
  const accentColor = useThemeColor('accent');

  return (
    <Link href={`/template/${template.id}`} asChild>
      <PressableFeedback className="mb-3 min-w-full">
        <Card className="min-w-full rounded-2xl border border-border-secondary bg-surface-secondary px-4 py-4">
          <Card.Header className="mb-1 flex-row items-center justify-between">
            <Card.Title className="text-[17px] font-extrabold text-foreground">{template.name}</Card.Title>
            <View className="flex-row items-center">
              <SparklesIcon color={accentColor} width={14} height={14} />
              <Text className="ml-1 text-xs font-semibold uppercase tracking-[0.05em] text-accent">{template.maxSlots} clips</Text>
            </View>
          </Card.Header>
          <Card.Body>
            <Card.Description className="text-[13px] text-muted">{template.description}</Card.Description>
          </Card.Body>
        </Card>
      </PressableFeedback>
    </Link>
  );
}
