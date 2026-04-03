import TemplateTemplateView from "@/components/templates/TemplateTemplateView";
import { validateTemplateReady } from "@/features/editor/editorManager";
import { pickVideoFromLibrary } from "@/features/media/mediaPicker";
import { getTemplate, templateRegistry } from "@/features/templates/templates";
import { useTemplateInstance } from "@/hooks/useTemplateInstance";
import { videoExportService } from "@/services/videoExportService";
import { TemplateInstance } from "@/types/template";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { PressableFeedback, ScrollShadow, useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import {
  ArrowLeftIcon,
} from "react-native-heroicons/outline";

export default function TemplateDetailScreen() {
	const params = useLocalSearchParams<{ templateId: string }>();
	const router = useRouter();
	const [isPickLoading, setIsPickLoading] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [exportProgress, setExportProgress] = useState(0);
  const foregroundColor = useThemeColor('foreground');
  const accentColor = useThemeColor('accent');

	const templateId = String(params.templateId ?? "");
	const template = getTemplate(templateId);

	const {
		instance,
		selectedUris,
		audioSourceUri,
		addUri,
		swap,
		move,
		remove,
		setAudioSource,
		setGap,
		setBorderRadius,
		setBackgroundColor,
	} = useTemplateInstance(template ?? templateRegistry[0]);

	useEffect(() => {
		if (!template) {
			Alert.alert(
				"Plantilla no encontrada",
				"El id de plantilla no es válido",
				[{ text: "Volver", onPress: () => router.back() }],
			);
		}
	}, [template, router]);

	if (!template) {
		return null;
	}

	const handlePick = async () => {
		try {
			setIsPickLoading(true);
			const uris = await pickVideoFromLibrary();
			if (uris.length > 0) {
				const availableSlots = template.maxSlots - selectedUris.length;
				if (availableSlots <= 0) {
					Alert.alert(
						"Límite alcanzado",
						`Esta plantilla solo permite ${template.maxSlots} videos.`,
					);
					return;
				}

				// El hook addUri ahora maneja automáticamente los límites
				addUri(uris);

				const addedCount = Math.min(uris.length, availableSlots);
				if (uris.length > availableSlots) {
					Alert.alert(
						"Algunos videos no se agregaron",
						`Solo se pudieron agregar ${addedCount} video${addedCount !== 1 ? "s" : ""} de los ${uris.length} seleccionados.`,
					);
				}
			}
		} catch (error) {
			Alert.alert("Error al seleccionar video", `${error}`);
		} finally {
			setIsPickLoading(false);
		}
	};

	const handleExport = async () => {
		if (
			!validateTemplateReady(instance as TemplateInstance, template.maxSlots)
		) {
			Alert.alert(
				"Exportación deshabilitada",
				`Selecciona ${template.maxSlots - selectedUris.length} videos más para poder exportar.`,
			);
			return;
		}

		try {
			setIsExporting(true);
			setExportProgress(0);
			const result = await videoExportService.exportToFile(
				template,
				instance as TemplateInstance,
				setExportProgress,
			);

			if (!result.success || !result.outputUri) {
				throw new Error(result.error ?? "No se pudo exportar el video.");
			}

			Alert.alert(
				"Exportación completada",
				`Video guardado en:\n${result.outputUri}`,
			);
		} catch (error) {
			Alert.alert("Error de export", `${error}`);
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen
				options={{
					headerShadowVisible: false,
					headerStyle: {
						backgroundColor: "#16052a",
					},
					headerTitle: "",
					headerLeft: () => (
						<View className="flex-row items-center gap-4">
							<PressableFeedback
								onPress={() => router.back()}
								className="rounded-full p-2 active:scale-95"
							>
								<ArrowLeftIcon width={20} height={20} color="#b6a0ff" />
							</PressableFeedback>
							<Text className="font-manrope text-lg font-bold tracking-tight text-[#f1dfff]">
								Export Project
							</Text>
						</View>
					),
					headerRight: () => (
						<PressableFeedback
							onPress={handleExport}
							isDisabled={isExporting}
							className="overflow-hidden rounded-xl active:scale-95"
						>
							<LinearGradient
								colors={["#b6a0ff", "#7e51ff"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 }}
							>
								<Text className="font-bold tracking-tight text-[#340090]">
									{isExporting ? "Exporting..." : "Export"}
								</Text>
							</LinearGradient>
						</PressableFeedback>
					),
				}}
			/>
			<ScrollShadow className="flex-1" LinearGradientComponent={LinearGradient}>
				<TemplateTemplateView
					template={template}
					instance={instance as TemplateInstance}
					selectedUris={selectedUris}
					audioSourceUri={audioSourceUri}
					isPickLoading={isPickLoading}
					accentColor={accentColor}
					foregroundColor={foregroundColor}
					onPick={handlePick}
					onSwap={swap}
					onMove={move}
					onRemove={remove}
					onSetAudioSource={setAudioSource}
					onSetGap={setGap}
					onSetBorderRadius={setBorderRadius}
					onSetBackgroundColor={setBackgroundColor}
				/>
			</ScrollShadow>

			{isExporting ? (
				<View className="absolute inset-0 items-center justify-center bg-background/85 px-6">
					<View className="w-full max-w-xs rounded-2xl bg-surface-secondary px-5 py-5">
						<Text className="mb-2 text-lg font-bold text-foreground">Exportando video</Text>
						<Text className="mb-4 text-sm text-muted">
							Se está generando el montaje final en formato 9:16.
						</Text>
						<View className="h-2 overflow-hidden rounded-full bg-background">
							<View
								className="h-full bg-accent"
								style={{ width: `${Math.round(exportProgress * 100)}%` }}
							/>
						</View>
						<Text className="mt-3 text-right text-xs font-bold uppercase tracking-[0.08em] text-accent">
							{Math.round(exportProgress * 100)}%
						</Text>
					</View>
				</View>
			) : null}
		</View>
	);
}
