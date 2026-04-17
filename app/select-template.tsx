import TemplateCard from "@/components/TemplateCard";
import GradientMaskedText from "@/components/ui/GradientMaskedText";
import { templateRegistry } from "@/features/templates/templates";
import { useVideoSelection } from "@/hooks/useVideoSelection";
import { getTemplateCapacity, isUnlimitedTemplate, TemplateOrientation } from "@/types/template";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import {
	Button,
	PressableFeedback,
	ScrollShadow,
	useThemeColor,
} from "heroui-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { ArrowLeftIcon } from "react-native-heroicons/outline";

function OrientationIcon({
	orientation,
	color,
}: {
	orientation: TemplateOrientation;
	color: string;
}) {
	const isVertical = orientation === "vertical";

	return (
		<View
			className="items-center justify-center"
			style={{
				width: 18,
				height: 18,
			}}
		>
			<View
				style={{
					width: isVertical ? 9 : 14,
					height: isVertical ? 14 : 9,
					borderRadius: 3,
					borderWidth: 1.5,
					borderColor: color,
				}}
			/>
		</View>
	);
}

export default function SelectTemplateScreen() {
	const { selectedUris } = useVideoSelection();
	const router = useRouter();
	const foregroundColor = useThemeColor("foreground");
	const gradientFromColor = useThemeColor("success");
	const gradientToColor = useThemeColor("link");
	const borderColor = useThemeColor("border");
	const accentColor = useThemeColor("accent");
	const mutedColor = useThemeColor("muted");
	const [orientationFilter, setOrientationFilter] =
		useState<TemplateOrientation>("vertical");

	// Filtrar plantillas que puedan acomodar la cantidad de elementos seleccionados
	const availableTemplates = templateRegistry.filter(
		(template) => getTemplateCapacity(template) >= selectedUris.length,
	);
	const filteredTemplates = availableTemplates.filter(
		(template) => template.orientation === orientationFilter,
	);

	return (
		<View className="h-full bg-background">
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
								Select Template
							</Text>
						</View>
					),
				}}
			/>
			<ScrollShadow className="flex-1" LinearGradientComponent={LinearGradient}>
				<ScrollView
					className="flex-1"
					contentContainerClassName="flex-grow px-4 pb-8 pt-4"
					showsVerticalScrollIndicator={false}
				>
					<View className="pb-2">
						<Text className="text-center font-headline text-4xl font-bold leading-none tracking-[-0.04em] text-foreground">
							Shape
						</Text>
						<GradientMaskedText
							text="your story"
							colors={[gradientFromColor, gradientToColor]}
						/>
						<Text className="mt-4 max-w-sm text-sm font-medium leading-6 text-muted">
							Choose a cinematic layout to set how your project looks.
						</Text>
						<Text className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-accent">
							{selectedUris.length} elemento{selectedUris.length !== 1 ? "s" : ""}{" "}
							seleccionado{selectedUris.length !== 1 ? "s" : ""}
							{filteredTemplates.some((template) => isUnlimitedTemplate(template))
								? " · Incluye secuencia ilimitada"
								: ""}
						</Text>
					</View>

					{availableTemplates.length > 0 ? (
						<View className="flex-col flex-wrap items-stretch justify-between">
							<View className="mb-10 p-1 bg-surface-container-low rounded-2xl flex flex-row items-center gap-1 border border-border/50">
								<PressableFeedback
									onPress={() => setOrientationFilter("vertical")}
									className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300 font-label text-sm uppercase tracking-wider font-bold group bg-surface-container text-on-surface-variant bg-surface-tertiary`}
									// style={{
									// 	borderWidth: 1,
									// 	borderColor:
									// 		orientationFilter === "vertical"
									// 			? accentColor
									// 			: borderColor,
									// 	backgroundColor:
									// 		orientationFilter === "vertical"
									// 			? accentColor
									// 			: "transparent",
									// }}
								>
									<View className="flex-row items-center justify-center gap-2">
										<OrientationIcon
											orientation="vertical"
											color={
												orientationFilter === "vertical"
													? foregroundColor
													: mutedColor
											}
										/>
										<Text
											className={`font-manrope text-sm font-bold uppercase tracking-[0.12em] ${orientationFilter === "vertical" ? "text-field-placeholder" : "text-muted"}`}
										>
											Vertical
										</Text>
									</View>
								</PressableFeedback>

								<PressableFeedback
									onPress={() => setOrientationFilter("landscape")}
									className="flex-1 rounded-2xl px-4 py-3 active:scale-[0.98]"
									style={{
										borderWidth: 1,
										borderColor:
											orientationFilter === "landscape"
												? accentColor
												: borderColor,
										backgroundColor:
											orientationFilter === "landscape"
												? accentColor
												: "transparent",
									}}
								>
									<View className="flex-row items-center justify-center gap-2">
										<OrientationIcon
											orientation="landscape"
											color={
												orientationFilter === "landscape"
													? foregroundColor
													: mutedColor
											}
										/>
										<Text
											style={{
												color:
													orientationFilter === "landscape"
														? foregroundColor
														: mutedColor,
											}}
											className="font-manrope text-sm font-bold uppercase tracking-[0.12em]"
										>
											Landscape
										</Text>
									</View>
								</PressableFeedback>
							</View>

							{filteredTemplates.length > 0 ? (
								filteredTemplates.map((template) => (
									<TemplateCard key={template.id} template={template} />
								))
							) : (
								<View className="items-center rounded-2xl border border-dashed border-outline/40 px-5 py-10">
									<Text className="text-center text-lg font-bold text-foreground">
										No hay plantillas {orientationFilter}
									</Text>
									<Text className="mt-2 text-center text-sm leading-6 text-muted">
										Cambia el filtro para ver otras composiciones disponibles.
									</Text>
								</View>
							)}
						</View>
					) : (
						<View className="flex-1 items-center justify-center px-5 py-16">
							<Text className="mb-3 text-xl font-bold text-foreground">
								No hay plantillas disponibles
							</Text>
							<Text className="mb-6 text-center text-base leading-6 text-muted">
								No tienes plantillas que puedan acomodar {selectedUris.length}{" "}
								elemento{selectedUris.length !== 1 ? "s" : ""}.{"\n\n"}
								Regresa y selecciona menos elementos o contacta al desarrollador
								para agregar más plantillas.
							</Text>
							<Button onPress={() => router.back()}>
								<Button.Label>Volver a seleccionar medios</Button.Label>
							</Button>
						</View>
					)}
				</ScrollView>
			</ScrollShadow>
		</View>
	);
}
