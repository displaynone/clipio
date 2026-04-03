import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import ClipioHeaderTitle from "@/components/navigation/ClipioHeaderTitle";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
	const insets = useSafeAreaInsets();
	const backgroundColor = useThemeColor("background");
	const surfaceBackgroundColor = useThemeColor("surface-secondary");
	const accentColor = useThemeColor("accent");
	const mutedColor = useThemeColor("muted");

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: accentColor,
				tabBarInactiveTintColor: mutedColor,
				sceneStyle: {
					backgroundColor,
				},
				headerShown: true,
				headerTitle: () => <ClipioHeaderTitle />,
				headerStyle: {
					backgroundColor,
				},
				headerShadowVisible: false,
				headerTitleAlign: "left",
				tabBarButton: HapticTab,
				tabBarItemStyle: {
					paddingVertical: 6,
				},
				tabBarIconStyle: {
					marginBottom: 2,
				},
				tabBarLabelStyle: {
					fontSize: 11,
					fontFamily: "Manrope-Bold",
					textTransform: "uppercase",
				},
				tabBarStyle: {
					backgroundColor: surfaceBackgroundColor,
					margin: 0,
					borderTopWidth: 0,
					borderTopStartRadius: 20,
					borderTopEndRadius: 20,
					paddingTop: 8,
					paddingBottom: Math.max(insets.bottom, 10),
					paddingHorizontal: 12,
					height: 82 + Math.max(insets.bottom, 10),
					position: "absolute",
					display: "none",
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Library",
					tabBarIcon: ({ color }) => (
						<IconSymbol size={30} name="video-library" color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
