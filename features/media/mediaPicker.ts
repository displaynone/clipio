import * as ImagePicker from "expo-image-picker";

export async function pickVideoFromLibrary(): Promise<string[]> {
	const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

	if (permission.status !== "granted") {
		throw new Error("Permiso de galería denegado");
	}

	const result = await ImagePicker.launchImageLibraryAsync({
		mediaTypes: ["videos"],
		allowsMultipleSelection: true,
		quality: 0.7,
	});

	if (result.canceled || !result.assets || result.assets.length === 0) {
		return [];
	}

	return result.assets
		.map((asset) => asset.uri)
		.filter((uri) => uri != null) as string[];
}
