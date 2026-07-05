import VideoFrameCapture from "@/components/capture/VideoFrameCapture";
import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

export default function CaptureScreen() {
	const params = useLocalSearchParams<{ uri?: string }>();
	const uri = typeof params.uri === "string" ? decodeURIComponent(params.uri) : "";

	if (!uri) {
		return null;
	}

	return (
		<View className="flex-1">
			<Stack.Screen
				options={{
					title: "Capture Frame",
					headerShown: true,
				}}
			/>

			<VideoFrameCapture uri={uri} />
		</View>
	);
}
