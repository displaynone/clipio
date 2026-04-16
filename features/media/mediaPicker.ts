import * as ImagePicker from "expo-image-picker";
import { MediaAsset } from "@/types/media";

export async function pickVideoFromLibrary(): Promise<MediaAsset[]> {
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
		.map((asset, index) => ({
			id: asset.assetId ?? `${asset.uri}-${index}`,
			uri: asset.uri,
			type: "video" as const,
			duration:
				typeof asset.duration === "number" && asset.duration > 0
					? Math.round(asset.duration)
					: undefined,
			width: asset.width,
			height: asset.height,
		}))
		.filter((asset) => asset.uri != null);
}
