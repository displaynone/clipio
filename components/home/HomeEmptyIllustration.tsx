import { useThemeColor } from "heroui-native";
import { View } from "react-native";
import { FilmIcon, PlusIcon } from "react-native-heroicons/solid";

export default function HomeEmptyIllustration() {
	const secondary = useThemeColor("accent");
	const foreground = useThemeColor("segment-foreground");

	return (
		<View className="relative h-48 w-48 items-center justify-center mb-10">
			<View className="absolute bottom-0 right-0 w-32 h-32 bg-surface-tertiary/40 rounded-xl rotate-12 -z-10 xopacity-40" />
			<View className="absolute -bottom-6 -right-2 w-40 h-40 bg-surface-container-highest rounded-2xl -rotate-6 -z-10 opacity-60" />
			<View className="w-40 h-40 rounded-[2.5rem] bg-surface-tertiary/40 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-outline-variant/10 backdrop-blur-sm">
				<View className="relative items-center justify-center">
					<FilmIcon width={84} height={84} color={secondary} />
					<View className="absolute -top-1 -right-2 h-6 w-6 items-center justify-center rounded-full bg-danger">
						<PlusIcon width={12} height={12} color={foreground} />
					</View>
				</View>
			</View>
		</View>
	);
}
