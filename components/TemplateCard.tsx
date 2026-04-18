import { TemplateData, TranslatableText } from "@/types/template";
import { Link } from "expo-router";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { CheckIcon } from "react-native-heroicons/outline";
import { useLingui } from "@lingui/react";

type Props = {
	template: TemplateData;
};

function TemplateMiniPreview({ template }: { template: TemplateData }) {
	const Template = template.template;

	return (
		<View className="relative w-full overflow-hidden rounded-lg bg-surface-secondary p-2 h-fit">
			<View className="h-32">{Template}</View>
		</View>
	);
}

function translateTemplateText(
	i18n: ReturnType<typeof useLingui>["i18n"],
	value: TranslatableText,
) {
	return typeof value === "string" ? i18n._(value) : i18n._(value);
}

export default function TemplateCard({ template }: Props) {
	const { i18n } = useLingui();
	const borderColor = useThemeColor("border");
	const accentColor = useThemeColor("accent");

	return (
		<Link href={`/template/${template.id}`} asChild>
			<PressableFeedback className="mb-4 w-full rounded-xl bg-surface-container px-4 py-4 active:scale-[0.98]">
				<View
					style={{
						borderWidth: 1,
						borderColor: `${borderColor}26`,
					}}
					className="rounded-xl bg-surface-container px-1 py-1"
				>
					<View className="gap-4 rounded-[10px] bg-surface-container px-1 py-1">
						<TemplateMiniPreview template={template} />

						<View className="flex-row items-start justify-between gap-3 px-1 pb-1">
							<View className="flex-1">
								<Text className="font-headline text-lg font-bold tracking-tight text-foreground">
									{translateTemplateText(i18n, template.name)}
								</Text>
								<Text className="mt-1 text-sm leading-5 text-muted">
									{translateTemplateText(i18n, template.description)}
								</Text>
							</View>

							<View
								className="mt-0.5 h-6 w-6 items-center justify-center rounded-full border"
								style={{ borderColor: `${borderColor}80` }}
							>
								<CheckIcon width={14} height={14} color={accentColor} />
							</View>
						</View>
					</View>
				</View>
			</PressableFeedback>
		</Link>
	);
}
