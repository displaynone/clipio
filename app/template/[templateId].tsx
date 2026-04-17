import TemplateTemplateView from "@/components/templates/TemplateTemplateView";
import { validateTemplateReady } from "@/features/editor/editorManager";
import { pickMediaFromLibrary } from "@/features/media/mediaPicker";
import { getTemplate, templateRegistry } from "@/features/templates/templates";
import { useEditorProject } from "@/hooks/useEditorProject";
import { useTemplateInstance } from "@/hooks/useTemplateInstance";
import { videoExportService } from "@/services/videoExportService";
import { useEditorStore } from "@/stores/editorStore";
import { getTemplateCapacity, isUnlimitedTemplate, TemplateInstance } from "@/types/template";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert as HeroAlert, Button, PressableFeedback, ScrollShadow, useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import { Alert as NativeAlert, Text, View } from "react-native";
import {
  ArrowLeftIcon,
  XMarkIcon,
} from "react-native-heroicons/outline";

type ExportAlertState = {
	status: "success" | "danger" | "warning";
	title: string;
	description: string;
	outputUri?: string;
};

export default function TemplateDetailScreen() {
	const params = useLocalSearchParams<{ templateId: string }>();
	const router = useRouter();
	const [isPickLoading, setIsPickLoading] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [exportProgress, setExportProgress] = useState(0);
	const [exportAlert, setExportAlert] = useState<ExportAlertState | null>(null);
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
		setSequenceEffect,
		setSequenceTransitionSeconds,
	} = useTemplateInstance(template ?? templateRegistry[0]);
	const project = useEditorProject(template ?? templateRegistry[0], instance as TemplateInstance);
	const registerMediaAssets = useEditorStore((state) => state.registerMediaAssets);

	useEffect(() => {
		if (!template) {
			NativeAlert.alert(
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
			const assets = await pickMediaFromLibrary();
			if (assets.length > 0) {
				const availableSlots = isUnlimitedTemplate(template)
					? Number.POSITIVE_INFINITY
					: (template.maxSlots ?? 0) - selectedUris.length;
				if (availableSlots <= 0) {
					NativeAlert.alert(
						"Límite alcanzado",
						`Esta plantilla solo permite ${getTemplateCapacity(template)} elementos.`,
					);
					return;
				}

				const assetsToAdd = assets.slice(
					0,
					Number.isFinite(availableSlots) ? availableSlots : assets.length,
				);
				addUri(assetsToAdd.map((asset) => asset.uri));
				registerMediaAssets(assetsToAdd);

				const addedCount = Math.min(assets.length, availableSlots);
				if (Number.isFinite(availableSlots) && assets.length > availableSlots) {
					NativeAlert.alert(
						"Algunos elementos no se agregaron",
						`Solo se pudieron agregar ${addedCount} elemento${addedCount !== 1 ? "s" : ""} de los ${assets.length} seleccionados.`,
					);
				}
			}
		} catch (error) {
			NativeAlert.alert("Error al seleccionar medios", `${error}`);
		} finally {
			setIsPickLoading(false);
		}
	};

	const handleExport = async () => {
		if (
			!validateTemplateReady(instance as TemplateInstance, template.maxSlots)
		) {
			const remainingCount =
				template.maxSlots == null
					? 1 - selectedUris.length
					: template.maxSlots - selectedUris.length;
			setExportAlert({
				status: "warning",
				title: "Exportación deshabilitada",
				description:
					template.maxSlots == null
						? "Selecciona al menos un video o imagen para poder exportar."
						: `Selecciona ${remainingCount} elemento${remainingCount !== 1 ? "s" : ""} más para poder exportar.`,
			});
			return;
		}

		try {
			setExportAlert(null);
			setIsExporting(true);
			setExportProgress(0);
			const result = await videoExportService.exportToFile(project, (event) => {
				setExportProgress(event.progress);
			});

			if (!result.success || !result.outputUri) {
				throw new Error(result.error ?? "No se pudo exportar el video.");
			}

			setExportAlert({
				status: "success",
				title: "Exportación completada",
				description: `Video guardado en:\n${result.outputUri}`,
				outputUri: result.outputUri,
			});
		} catch (error) {
			console.log("[video-export] Export failed", error);
			console.error("[video-export] Export failed", error);
			setExportAlert({
				status: "danger",
				title: "Error de export",
				description: `${error}`,
			});
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<View className="flex-1 bg-background">
			<Stack.Screen
				options={{
					headerShadowVisible: false,
					headerTintColor: "#ffffff",
					statusBarStyle: "light",
					statusBarBackgroundColor: "#16052a",
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
					project={project}
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
					onSetSequenceEffect={setSequenceEffect}
					onSetSequenceTransitionSeconds={setSequenceTransitionSeconds}
				/>
			</ScrollShadow>

			{exportAlert ? (
				<View className="absolute left-4 right-4 top-4 z-20">
					<HeroAlert
						status={exportAlert.status}
						className="items-start border border-[#d9c3ff] bg-[#cdb4ff]"
						style={{
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 8 },
							shadowOpacity: 0.36,
							shadowRadius: 22,
							elevation: 12,
						}}
					>
						<HeroAlert.Indicator iconProps={{ color: "#16052a" }} />
						<HeroAlert.Content>
							<HeroAlert.Title className="text-[#16052a]">
								{exportAlert.title}
							</HeroAlert.Title>
							<HeroAlert.Description className="text-[#4a3862]">
								{exportAlert.description}
							</HeroAlert.Description>
							{exportAlert.outputUri ? (
								<Button
									onPress={() =>
										router.push({
											pathname: "/export-preview",
											params: { uri: encodeURIComponent(exportAlert.outputUri ?? "") },
										})
									}
									className="mt-3 self-start bg-[#16052a]"
								>
									<Button.Label className="text-[#f8efff]">
										Ver video
									</Button.Label>
								</Button>
							) : null}
						</HeroAlert.Content>
						<PressableFeedback
							onPress={() => setExportAlert(null)}
							className="ml-2 rounded-full p-1 active:scale-95"
						>
							<XMarkIcon width={16} height={16} color="#16052a" />
						</PressableFeedback>
					</HeroAlert>
				</View>
			) : null}

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
