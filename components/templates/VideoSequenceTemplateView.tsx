import VideoThumbnail from "@/components/VideoThumbnail";
import ReorderableClipList from "@/components/templates/ReorderableClipList";
import TemplateThumbnailLoadingIndicator from "@/components/templates/TemplateThumbnailLoadingIndicator";
import { useVideoThumbnailPrefetch } from "@/hooks/useVideoThumbnailPrefetch";
import { TemplateSequenceEffect } from "@/types/template";
import { PressableFeedback } from "heroui-native";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import {
	AdjustmentsHorizontalIcon,
	ArrowLeftIcon,
	ArrowRightIcon,
	ArrowUpIcon,
	ArrowsPointingInIcon,
	MagnifyingGlassPlusIcon,
	SparklesIcon,
	SunIcon,
} from "react-native-heroicons/outline";
import { TemplateViewProps } from "./template-view.types";

const EFFECT_OPTIONS = [
	{
		id: "fade",
		label: "Fundido",
		icon: AdjustmentsHorizontalIcon,
		description: "Disuelve un clip sobre el siguiente.",
	},
	{
		id: "blur",
		label: "Blur",
		icon: SparklesIcon,
		description: "Transición difuminada con entrada suave.",
	},
	{
		id: "zoom",
		label: "Zoom",
		icon: MagnifyingGlassPlusIcon,
		description: "Empuja al siguiente clip con acercamiento.",
	},
	{
		id: "contrast-pop",
		label: "Color Boost",
		icon: SparklesIcon,
		description: "Explota color y contraste durante el cruce entre clips.",
	},
	{
		id: "pixelate",
		label: "Pixelate",
		icon: AdjustmentsHorizontalIcon,
		description: "Rompe la imagen en bloques y recupera detalle al terminar.",
	},
	{
		id: "hlslice",
		label: "HL Slice",
		icon: ArrowLeftIcon,
		description: "Corta la imagen en franjas horizontales durante el cambio.",
	},
	{
		id: "hrslice",
		label: "HR Slice",
		icon: ArrowRightIcon,
		description: "Divide la imagen en franjas horizontales con salida inversa.",
	},
	{
		id: "fadeblack",
		label: "Fade Black",
		icon: AdjustmentsHorizontalIcon,
		description: "Pasa brevemente por negro antes de mostrar el siguiente clip.",
	},
	{
		id: "diagtl",
		label: "Diag TL",
		icon: ArrowUpIcon,
		description: "Entrada diagonal desde la esquina superior izquierda.",
	},
	{
		id: "flash-shake",
		label: "Flash + Shake",
		icon: SparklesIcon,
		description: "Mete un destello corto y una sacudida agresiva en el cruce.",
	},
	{
		id: "rgb-split",
		label: "RGB Split",
		icon: SparklesIcon,
		description: "Separa los canales de color para una aberración cromática en el cambio.",
	},
	{
		id: "glow",
		label: "Glow",
		icon: SunIcon,
		description: "Añade un halo suave y luminoso durante la transición.",
	},
	{
		id: "speed-ramp",
		label: "Speed Ramp",
		icon: MagnifyingGlassPlusIcon,
		description: "Acelera el tramo central del clip y enlaza sin solapado.",
	},
	{
		id: "vhs-retro",
		label: "VHS Retro",
		icon: SparklesIcon,
		description: "Mete grano, color envejecido y arrastre luminoso tipo cinta VHS.",
	},
	{
		id: "light-point",
		label: "Punto de luz",
		icon: SunIcon,
		description: "Apertura circular brillante al centro.",
	},
	{
		id: "wipe-left",
		label: "Barrido lateral",
		icon: ArrowLeftIcon,
		description: "El nuevo clip entra barriendo de derecha a izquierda.",
	},
	{
		id: "wipe-up",
		label: "Barrido vertical",
		icon: ArrowUpIcon,
		description: "El siguiente plano entra de abajo hacia arriba.",
	},
	{
		id: "circle-close",
		label: "Cierre circular",
		icon: ArrowsPointingInIcon,
		description: "El plano se cierra en círculo antes del corte.",
	},
] as const satisfies {
	id: TemplateSequenceEffect;
	label: string;
	icon: ComponentType<{ width?: number; height?: number; color?: string }>;
	description: string;
}[];

export default function VideoSequenceTemplateView({
	instance,
	project,
	selectedUris,
	foregroundColor,
	onMove,
	onSetSequenceEffect,
	onSetSequenceTransitionSeconds,
}: TemplateViewProps) {
	const orderedUris = selectedUris;
	const previewUris = orderedUris.slice(0, 3);
	const selectedEffect = instance.style.sequenceEffect ?? "fade";
	const isSpeedRamp = selectedEffect === "speed-ramp";
	const transitionSeconds = Math.max(0, instance.style.sequenceTransitionSeconds ?? 1);
	const [transitionInput, setTransitionInput] = useState(String(transitionSeconds));
	const selectedEffectLabel =
		EFFECT_OPTIONS.find((effect) => effect.id === selectedEffect)?.label ?? "Fundido";
	const selectedEffectDescription =
		EFFECT_OPTIONS.find((effect) => effect.id === selectedEffect)?.description ??
		"Disuelve un clip sobre el siguiente.";
	const thumbnailLoading = useVideoThumbnailPrefetch(previewUris);

	useEffect(() => {
		setTransitionInput(String(transitionSeconds));
	}, [transitionSeconds]);

	function commitTransitionSeconds(rawValue: string) {
		const parsed = Number(rawValue.replace(",", "."));
		const nextValue = Number.isFinite(parsed)
			? Math.min(10, Math.max(0, Math.round(parsed * 10) / 10))
			: transitionSeconds;

		setTransitionInput(String(nextValue));
		onSetSequenceTransitionSeconds(nextValue);
	}

	return (
		<ScrollView
			className="flex-1"
			contentContainerClassName="flex-grow px-6 pb-10 pt-6"
			showsVerticalScrollIndicator={false}
		>
			<View className="mb-8 items-center">
				<View
					className="w-full max-w-[320px] overflow-hidden rounded-2xl bg-surface-secondary p-3"
					style={{
						aspectRatio: project.canvas.width / project.canvas.height,
						backgroundColor: project.canvas.backgroundColor,
					}}
				>
					<TemplateThumbnailLoadingIndicator
						loadedCount={thumbnailLoading.loadedCount}
						totalCount={thumbnailLoading.totalCount}
					/>
					{previewUris.map((uri, index) => (
						<View
							key={`sequence-preview-${uri}`}
							className="absolute left-3 right-3 overflow-hidden rounded-xl border border-background"
							style={{
								left: 12 + index * 54,
								// height: 150,
								opacity: 1 - index * 0.16,
							}}
						>
							<VideoThumbnail uri={uri} className="h-full w-full rounded-none" />
						</View>
					))}
					<View className="absolute bottom-4 left-4 right-4 rounded-xl bg-background/70 px-4 py-3">
						<Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
							Video Sequence
						</Text>
						<Text className="mt-1 text-sm leading-5 text-foreground">
							{isSpeedRamp
								? `${orderedUris.length} clips con speed ramp manual y corte directo.`
								: `${orderedUris.length} clips enlazados con ${selectedEffectLabel.toLowerCase()}.`}
						</Text>
					</View>
				</View>
			</View>

			<View className="mb-6 rounded-2xl bg-surface-secondary p-4">
				<View className="mb-4 flex-row items-center justify-between gap-4">
					<Text className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
						Efecto
					</Text>
					<Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
						{selectedEffectLabel}
					</Text>
				</View>
				<Text className="mb-4 text-sm leading-6 text-muted">
					{selectedEffectDescription}
				</Text>

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="gap-3 pr-2"
				>
					{EFFECT_OPTIONS.map((effect) => {
						const isSelected = selectedEffect === effect.id;
						const Icon = effect.icon;

						return (
							<PressableFeedback
								key={effect.id}
								onPress={() => onSetSequenceEffect(effect.id)}
								className={`w-36 rounded-xl border px-4 py-4 active:scale-[0.99] ${
									isSelected
										? "border-accent bg-accent/10"
										: "border-border bg-background"
								}`}
							>
								<View className="items-start gap-4">
									<View
										className={`rounded-full p-3 ${
											isSelected ? "bg-accent/15" : "bg-overlay"
										}`}
									>
										<Icon width={20} height={20} color={foregroundColor} />
									</View>
									<Text className="text-sm font-bold text-foreground">
										{effect.label}
									</Text>
									<Text className="text-xs leading-5 text-muted">
										{effect.description}
									</Text>
									<Text
										className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
											isSelected ? "text-accent" : "text-muted"
										}`}
									>
										{isSelected ? "Activo" : "Elegir"}
									</Text>
								</View>
							</PressableFeedback>
						);
					})}
				</ScrollView>

					<View className="mt-5 rounded-xl bg-background px-4 py-4">
						<View className="mb-2 flex-row items-center justify-between gap-4">
							<Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
								{isSpeedRamp ? "Ramp" : "Duración"}
							</Text>
							<Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
								{isSpeedRamp ? "1s -> 2x" : `${transitionSeconds}s`}
							</Text>
						</View>
						<Text className="mb-3 text-sm leading-6 text-muted">
							{isSpeedRamp
								? "Acelera manualmente 1 segundo del clip a 2x y concatena sin solapado."
								: "Indica cuántos segundos dura la transición entre clips. Usa `0` para cortar sin efecto."}
						</Text>
						{isSpeedRamp ? null : (
							<View className="flex-row items-center justify-between rounded-xl border border-border bg-surface-secondary px-4 py-3">
								<Text className="text-sm font-bold text-foreground">Segundos</Text>
								<View className="min-w-20 flex-row items-center justify-end gap-2">
									<TextInput
										value={transitionInput}
										onChangeText={setTransitionInput}
										onBlur={() => commitTransitionSeconds(transitionInput)}
										onEndEditing={(event) => commitTransitionSeconds(event.nativeEvent.text)}
										keyboardType="decimal-pad"
										returnKeyType="done"
										maxLength={4}
										selectTextOnFocus
										className="min-w-16 rounded-lg bg-background px-3 py-2 text-right text-sm font-bold text-foreground"
									/>
									<Text className="text-sm font-bold text-muted">s</Text>
								</View>
							</View>
						)}
					</View>
				</View>

			<ReorderableClipList
				project={project}
				selectedUris={selectedUris}
				foregroundColor={foregroundColor}
				onMove={onMove}
				accordionValue="sequence-clips"
				accordionTitle="Sequence Order"
				countLabel={(count) => `${count} Clips`}
				infoBox={
					<View className="mb-5 rounded-xl bg-surface-secondary px-4 py-4">
						<Text className="text-sm font-bold text-foreground">
							Los clips se exportan uno tras otro
						</Text>
						<Text className="mt-1 text-sm leading-6 text-muted">
							{isSpeedRamp
								? "Cada clip acelera un tramo central antes del siguiente corte. Reordena la lista para cambiar el montaje final."
								: `La unión visual usa ${selectedEffectLabel.toLowerCase()}. Reordena la lista para cambiar el montaje final.`}
						</Text>
					</View>
				}
				renderItemTitle={({ index }) => `Clip ${index + 1}`}
				renderItemSubtitle={({ durationLabel }) =>
					isSpeedRamp
						? `${durationLabel} · speed ramp 1s a 2x`
						: `${durationLabel} · ${selectedEffectLabel.toLowerCase()} ${transitionSeconds}s con el siguiente`
				}
			/>
		</ScrollView>
	);
}
