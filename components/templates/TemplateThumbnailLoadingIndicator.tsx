import { ActivityIndicator, Text, View } from "react-native";
import { Trans } from "@lingui/react/macro";

type Props = {
	loadedCount: number;
	totalCount: number;
};

export default function TemplateThumbnailLoadingIndicator({
	loadedCount,
	totalCount,
}: Props) {
	if (totalCount === 0 || loadedCount >= totalCount) {
		return null;
	}

	return (
		<View className="absolute inset-x-4 top-4 z-10 rounded-xl bg-background/75 px-4 py-3">
			<View className="flex-row items-center gap-3">
				<ActivityIndicator size="small" color="#ffffff" />
				<View>
					<Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
						<Trans>Loading thumbnails</Trans>
					</Text>
					<Text className="mt-1 text-xs text-foreground">
						<Trans>{loadedCount}/{totalCount} ready</Trans>
					</Text>
				</View>
			</View>
		</View>
	);
}
