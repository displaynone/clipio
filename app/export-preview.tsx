import { Stack, useLocalSearchParams } from "expo-router";
import { Alert as HeroAlert } from "heroui-native";
import { LayoutChangeEvent, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";

type VideoSize = {
	width: number;
	height: number;
};

export default function ExportPreviewScreen() {
	const params = useLocalSearchParams<{ uri?: string }>();
	const uri = params.uri ? decodeURIComponent(String(params.uri)) : "";
	const [videoSize, setVideoSize] = useState<VideoSize | null>(null);
	const [viewportSize, setViewportSize] = useState<VideoSize | null>(null);
	const player = useVideoPlayer(uri || null, (videoPlayer) => {
		videoPlayer.loop = false;
		videoPlayer.play();
	});
	const aspectRatio =
		videoSize && videoSize.width > 0 && videoSize.height > 0
			? videoSize.width / videoSize.height
			: 16 / 9;
	const maxPreviewWidth = viewportSize ? viewportSize.width * 0.88 : 0;
	const maxPreviewHeight = viewportSize?.height ?? 0;
	const previewWidth =
		maxPreviewWidth > 0 && maxPreviewHeight > 0
			? Math.min(maxPreviewWidth, maxPreviewHeight * aspectRatio)
			: undefined;
	const previewHeight =
		previewWidth != null ? previewWidth / aspectRatio : undefined;

	function handleViewportLayout(event: LayoutChangeEvent) {
		const { width, height } = event.nativeEvent.layout;
		setViewportSize({ width, height });
	}

	useEffect(() => {
		const subscription = player.addListener("sourceLoad", ({ availableVideoTracks }) => {
			const size = availableVideoTracks[0]?.size;
			if (size && size.width > 0 && size.height > 0) {
				setVideoSize({ width: size.width, height: size.height });
			}
		});

		return () => {
			subscription.remove();
		};
	}, [player]);

	return (
		<View
			className="flex-1 items-center justify-start bg-background px-8 pb-6 pt-4"
			onLayout={handleViewportLayout}
		>
			<Stack.Screen
				options={{
					title: "Preview",
					headerTintColor: "#f1dfff",
					headerStyle: { backgroundColor: "#16052a" },
					headerShadowVisible: false,
				}}
			/>

			{uri ? (
				<View
					className="overflow-hidden rounded-2xl bg-black"
					style={{
						width: previewWidth,
						height: previewHeight,
					}}
				>
					<VideoView
						player={player}
						nativeControls
						contentFit="contain"
						style={{ width: "100%", height: "100%" }}
					/>
				</View>
			) : (
				<HeroAlert status="danger">
					<HeroAlert.Indicator />
					<HeroAlert.Content>
						<HeroAlert.Title>No se pudo abrir el video</HeroAlert.Title>
						<HeroAlert.Description>
							La ruta del archivo exportado no está disponible.
						</HeroAlert.Description>
					</HeroAlert.Content>
				</HeroAlert>
			)}
		</View>
	);
}
