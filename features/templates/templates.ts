import { TemplateData } from "@/types/template";

export const templateRegistry: TemplateData[] = [
	{
		id: "grid-2x2",
		name: "2x2 Grid",
		description:
			"Composición vertical 9:16 con 4 videos en cuadrícula.",
		maxSlots: 4,
		defaultStyle: {
			backgroundColor: "#111827",
			gap: 6,
			borderRadius: 10,
		},
		output: {
			width: 1080,
			height: 1920,
		},
		slots: [
			{ id: "a", x: 0, y: 0, width: 50, height: 50 },
			{ id: "b", x: 50, y: 0, width: 50, height: 50 },
			{ id: "c", x: 0, y: 50, width: 50, height: 50 },
			{ id: "d", x: 50, y: 50, width: 50, height: 50 },
		],
	},
	{
		id: "focus-top",
		name: "Focus Layout",
		description: "Composición vertical 9:16 con foco superior y tres clips abajo.",
		maxSlots: 4,
		defaultStyle: {
			backgroundColor: "#0F172A",
			gap: 8,
			borderRadius: 12,
		},
		output: {
			width: 1080,
			height: 1920,
		},
		slots: [
			{ id: "a", x: 0, y: 0, width: 100, height: 55 },
			{ id: "b", x: 0, y: 55, width: 33.333, height: 45 },
			{ id: "c", x: 33.333, y: 55, width: 33.333, height: 45 },
			{ id: "d", x: 66.666, y: 55, width: 33.333, height: 45 },
		],
	},
];

export const getTemplate = (id: string) =>
	templateRegistry.find((item) => item.id === id);
