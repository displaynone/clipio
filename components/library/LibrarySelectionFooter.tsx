import VideoThumbnail from "@/components/VideoThumbnail";
import { LinearGradient } from "expo-linear-gradient";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { ArrowRightIcon } from "react-native-heroicons/outline";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
	selectedUris: string[];
	onContinue: () => void;
};

export default function LibrarySelectionFooter({
	selectedUris,
	onContinue,
}: Props) {
	const primaryColor = useThemeColor("link");
	const primaryDimColor = useThemeColor("accent");
	const warningForegroundColor = useThemeColor("warning-foreground");
	const insets = useSafeAreaInsets();

	return (
		<View
			className="inset-x-0 bottom-0 px-4 pb-4"
			style={{ paddingBottom: insets.bottom + 16 }}
		>
			<View className="rounded-[2rem] bg-default/90 px-5 py-5 gap-2">
				<View className="">
					<Text className="text-base font-bold text-foreground">
						{selectedUris.length} clip{selectedUris.length !== 1 ? "s" : ""}{" "}
						selected
					</Text>
					<Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
						Ready to choose a template
					</Text>
				</View>
				<View className="flex-row items-center justify-between gap-4">
					<View className="flex-1 flex-row items-center gap-4">
						<View className="flex-row">
							{selectedUris.slice(0, 3).map((uri, index) => (
								<View
									key={`${uri}-${index}`}
									className={`${index === 0 ? "" : "-ml-3"} h-10 w-10 overflow-hidden rounded-full border-2 border-surface-secondary`}
								>
									<VideoThumbnail
										uri={uri}
										className="h-full w-full rounded-full"
									/>
								</View>
							))}
							{selectedUris.length > 3 && (
								<View className="-ml-3 h-10 w-10 items-center justify-center rounded-full border-2 border-surface-secondary bg-link">
									<Text className="text-xs font-bold text-warning-foreground">
										+{selectedUris.length - 3}
									</Text>
								</View>
							)}
						</View>
					</View>

					<PressableFeedback
						onPress={onContinue}
						className="overflow-hidden rounded-full"
					>
						<LinearGradient
							colors={[primaryColor, primaryDimColor]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							className="flex-row items-center gap-2 px-5 py-4"
						>
							<Text className="font-bold text-warning-foreground">
								Continue
							</Text>
							<ArrowRightIcon
								width={18}
								height={18}
								color={warningForegroundColor}
							/>
						</LinearGradient>
					</PressableFeedback>
				</View>
			</View>
		</View>
	);
}
