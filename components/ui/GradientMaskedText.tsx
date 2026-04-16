import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient, type LinearGradientPoint } from "expo-linear-gradient";
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

type Props = {
	text: string;
	colors: readonly [string, string, ...string[]];
	start?: LinearGradientPoint;
	end?: LinearGradientPoint;
	containerStyle?: StyleProp<ViewStyle>;
	contentStyle?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
};

export default function GradientMaskedText({
	text,
	colors,
	start = { x: 0, y: 0 },
	end = { x: 1, y: 1 },
	containerStyle,
	contentStyle,
	textStyle,
}: Props) {
	return (
		<MaskedView
			style={[styles.container, containerStyle]}
			maskElement={
				<View style={styles.centered}>
					<Text style={[styles.text, textStyle]}>{text}</Text>
				</View>
			}
		>
			<LinearGradient
				colors={colors}
				start={start}
				end={end}
				style={[styles.content, contentStyle]}
			>
				<Text style={[styles.text, textStyle, styles.filler]}>{text}</Text>
			</LinearGradient>
		</MaskedView>
	);
}

const styles = StyleSheet.create({
	container: {
		marginTop: 4,
	},
	centered: {
		alignItems: "center",
	},
	content: {
		marginTop: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	text: {
		fontFamily: "Manrope-ExtraBold",
		fontSize: 36,
		lineHeight: 40,
		textAlign: "center",
		backgroundColor: "transparent",
	},
	filler: {
		opacity: 0,
	},
});
