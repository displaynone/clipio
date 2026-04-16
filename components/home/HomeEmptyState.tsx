import GradientMaskedText from "@/components/ui/GradientMaskedText";
import { LinearGradient } from "expo-linear-gradient";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
	PaintBrushIcon,
	SparklesIcon,
	VideoCameraIcon,
} from "react-native-heroicons/outline";

import HomeEmptyFeatureCard from "@/components/home/HomeEmptyFeatureCard";
import HomeEmptyIllustration from "@/components/home/HomeEmptyIllustration";

type Props = {
	onLoadVideos: () => void;
	isLoading?: boolean;
};

export default function HomeEmptyState({
	onLoadVideos,
	isLoading = false,
}: Props) {
	const primary = "#b6a0ff";
	const primaryDim = "#7e51ff";

	const onPrimaryFixed = useThemeColor("warning-foreground");
	const accent = useThemeColor("accent");

	return (
		<ScrollView
			className="h-full bg-background"
			contentContainerClassName="flex-grow px-5 pt-6 pb-8"
			showsVerticalScrollIndicator={false}
		>
			<View className="flex-1 items-center justify-center">
				<HomeEmptyIllustration />

				<View className="mb-8 items-center w-full">
					<View className="w-full items-center justify-center">
						<Text className="text-center text-3xl font-extrabold text-foreground">
							Your story
						</Text>
					</View>
						<GradientMaskedText
							text="starts here"
							colors={[primary, primaryDim]}
						/>
					<Text className="mt-5 max-w-[320px] text-center text-base leading-7 text-muted">
						No videos loaded yet. Start your cinematic journey by adding some
						clips.
					</Text>
				</View>

				<PressableFeedback
					onPress={onLoadVideos}
					className="xw-full max-w-[320px] overflow-hidden rounded-xl"
				>
					<LinearGradient
						colors={[primary, primaryDim]}
						start={{ x: 0.1, y: 0 }}
						end={{ x: 1, y: 1 }}
						className="flex-row items-center justify-center gap-3 px-6 py-5"
					>
						<VideoCameraIcon width={20} height={20} color={onPrimaryFixed} />
						<Text className="text-base font-bold uppercase tracking-[0.08em] text-warning-foreground">
							{isLoading ? "Loading..." : "Load Videos"}
						</Text>
					</LinearGradient>
				</PressableFeedback>

				<View className="mt-14 w-full gap-4">
					<HomeEmptyFeatureCard
						icon={SparklesIcon}
						iconColor={accent}
						title="Smart Trim"
						description="Let Clipio pick stronger highlights from your footage before you build the cut."
					/>
					<HomeEmptyFeatureCard
						icon={PaintBrushIcon}
						iconColor={primary}
						title="Color Grades"
						description="Start from cinematic palettes and keep the visual tone consistent across clips."
					/>
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({});
