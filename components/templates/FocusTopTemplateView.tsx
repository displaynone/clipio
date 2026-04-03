import TemplatePreviewCanvas from "@/components/TemplatePreviewCanvas";
import { Button, PressableFeedback } from "heroui-native";
import { ScrollView, Text, View } from "react-native";
import {
	ChevronDoubleDownIcon,
	ChevronDoubleUpIcon,
	VideoCameraIcon,
} from "react-native-heroicons/outline";
import { TemplateViewProps } from "./template-view.types";

const BACKGROUND_COLORS = ["#111827", "#0B1120", "#1E3A8A", "#0F172A", "#1F2937"];

export default function FocusTopTemplateView({
	template,
	instance,
	selectedUris,
	audioSourceUri: _audioSourceUri,
	isPickLoading,
	accentColor,
	foregroundColor,
	onPick,
	onSwap,
	onMove: _onMove,
	onRemove,
	onSetAudioSource: _onSetAudioSource,
	onSetGap,
	onSetBorderRadius,
	onSetBackgroundColor,
}: TemplateViewProps) {
	return (
		<ScrollView
			className="flex-1"
			contentContainerClassName="flex-grow px-4 pb-8 pt-4"
			showsVerticalScrollIndicator={false}
		>
			<Text className="mb-0.5 text-[22px] font-extrabold tracking-[-0.02em] text-foreground">
				{template.name}
			</Text>
			<Text className="mb-3 text-sm text-muted">{template.description}</Text>

			<TemplatePreviewCanvas template={template} instance={instance} />

			<View className="mb-3">
				<Button onPress={onPick} isDisabled={isPickLoading} className="w-full">
					<VideoCameraIcon color={foregroundColor} width={18} height={18} />
					<Button.Label>
						{isPickLoading ? "Cargando..." : "Seleccionar videos"}
					</Button.Label>
				</Button>
			</View>

			<View className="mb-3">
				<Text className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-muted">
					Color fondo
				</Text>
				<View className="flex-row gap-2">
					{BACKGROUND_COLORS.map((color) => (
						<PressableFeedback
							key={color}
							className="h-7.5 w-7.5 rounded-full border-2"
							style={[
								{
									backgroundColor: color,
									borderColor:
										instance.style.backgroundColor === color ? accentColor : "transparent",
								},
							]}
							onPress={() => onSetBackgroundColor(color)}
						/>
					))}
				</View>
			</View>

			<View className="mb-3">
				<Text className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-muted">
					Gap ({instance.style.gap}px)
				</Text>
				<View className="flex-row gap-2.5">
					<Button
						onPress={() => onSetGap(Math.max(0, instance.style.gap - 2))}
						variant="ghost"
					>
						<Button.Label>-</Button.Label>
					</Button>
					<Button onPress={() => onSetGap(instance.style.gap + 2)} variant="ghost">
						<Button.Label>+</Button.Label>
					</Button>
				</View>
			</View>

			<View className="mb-3">
				<Text className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-muted">
					Bordes ({instance.style.borderRadius}px)
				</Text>
				<View className="flex-row gap-2.5">
					<Button
						onPress={() => onSetBorderRadius(Math.max(0, instance.style.borderRadius - 2))}
						variant="ghost"
					>
						<Button.Label>-</Button.Label>
					</Button>
					<Button
						onPress={() => onSetBorderRadius(Math.min(50, instance.style.borderRadius + 2))}
						variant="ghost"
					>
						<Button.Label>+</Button.Label>
					</Button>
				</View>
			</View>

			<Text className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-[0.05em] text-muted">
				Reordenar clips
			</Text>
			{selectedUris.map((uri, index) => (
				<View
					key={`${uri}-${index}`}
					className="mb-2 flex-row items-center justify-between rounded-xl bg-surface-secondary px-3 py-2.5"
				>
					<Text className="text-foreground">Clip {index + 1}</Text>
					<View className="flex-row gap-2">
						<Button onPress={() => onSwap(index, -1)} isIconOnly size="sm" variant="ghost">
							<ChevronDoubleUpIcon width={14} height={14} color={foregroundColor} />
						</Button>
						<Button onPress={() => onSwap(index, 1)} isIconOnly size="sm" variant="ghost">
							<ChevronDoubleDownIcon width={14} height={14} color={foregroundColor} />
						</Button>
						<Button onPress={() => onRemove(index)} isIconOnly size="sm" variant="danger">
							<Text className="font-bold text-danger-foreground">✕</Text>
						</Button>
					</View>
				</View>
			))}
		</ScrollView>
	);
}
