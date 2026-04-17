import { TemplateData } from "@/types/template";
import FocusLandscapeTemplateIcon from "./icons/FocusLandscapeTemplateIcon";
import FocusTopTemplateIcon from "./icons/FocusTopTemplateIcon";
import Grid2x2LandscapeTemplateIcon from "./icons/Grid2x2LandscapeTemplateIcon";
import Grid2x2TemplateIcon from "./icons/Grid2x2TemplateIcon";
import VideoSequenceLandscapeTemplateIcon from "./icons/VideoSequenceLandscapeTemplateIcon";
import VideoSequenceTemplateIcon from "./icons/VideoSequenceTemplateIcon";

export const templateRegistry: TemplateData[] = [
	{
		id: "vertical-sequence",
		name: "Video Sequence",
		description:
			"Reproduce cualquier cantidad de clips uno tras otro y los une con un fundido de 1 segundo entre cada video.",
		kind: "sequence",
		orientation: "vertical",
		maxSlots: null,
		defaultStyle: {
			backgroundColor: "#111827",
			gap: 0,
			borderRadius: 0,
			sequenceEffect: "fade",
			sequenceTransitionSeconds: 1,
		},
		output: {
			width: 1080,
			height: 1920,
		},
		slots: [{ id: "full", x: 0, y: 0, width: 100, height: 100 }],
		template: <VideoSequenceTemplateIcon />,
	},
	{
		id: "landscape-sequence",
		name: "Video Sequence Landscape",
		description:
			"Reproduce cualquier cantidad de clips landscape uno tras otro con un fundido de 1 segundo.",
		kind: "sequence",
		orientation: "landscape",
		maxSlots: null,
		defaultStyle: {
			backgroundColor: "#111827",
			gap: 0,
			borderRadius: 0,
			sequenceEffect: "fade",
			sequenceTransitionSeconds: 1,
		},
		output: {
			width: 1920,
			height: 1080,
		},
		slots: [{ id: "full", x: 0, y: 0, width: 100, height: 100 }],
		template: <VideoSequenceLandscapeTemplateIcon />,
	},
	{
		id: "grid-2x2",
		name: "2x2 Grid",
		description: "Composición vertical 9:16 con 4 videos en cuadrícula.",
		kind: "grid",
		orientation: "vertical",
		maxSlots: 4,
		defaultStyle: {
			backgroundColor: "#111827",
			gap: 6,
			borderRadius: 10,
			sequenceEffect: "fade",
			sequenceTransitionSeconds: 1,
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
		template: <Grid2x2TemplateIcon />,
	},
	{
		id: "landscape-grid-2x2",
		name: "2x2 Grid Landscape",
		description: "Composición landscape 16:9 con 4 videos en cuadrícula.",
		kind: "grid",
		orientation: "landscape",
		maxSlots: 4,
		defaultStyle: {
			backgroundColor: "#111827",
			gap: 6,
			borderRadius: 10,
			sequenceEffect: "fade",
			sequenceTransitionSeconds: 1,
		},
		output: {
			width: 1920,
			height: 1080,
		},
		slots: [
			{ id: "a", x: 0, y: 0, width: 50, height: 50 },
			{ id: "b", x: 50, y: 0, width: 50, height: 50 },
			{ id: "c", x: 0, y: 50, width: 50, height: 50 },
			{ id: "d", x: 50, y: 50, width: 50, height: 50 },
		],
		template: <Grid2x2LandscapeTemplateIcon />,
	},
	{
		id: "focus-top",
		name: "Focus Layout",
		description:
			"Composición vertical 9:16 en dos secciones: un clip arriba y tres clips iguales abajo.",
		kind: "grid",
		orientation: "vertical",
		maxSlots: 4,
		defaultStyle: {
			backgroundColor: "#0F172A",
			gap: 8,
			borderRadius: 12,
			sequenceEffect: "fade",
			sequenceTransitionSeconds: 1,
		},
		output: {
			width: 1080,
			height: 1920,
		},
		slots: [
			{ id: "a", x: 0, y: 0, width: 100, height: 50 },
			{ id: "b", x: 0, y: 50, width: 50, height: 50 },
			{ id: "c", x: 50, y: 50, width: 50, height: 25 },
			{ id: "d", x: 50, y: 75, width: 50, height: 25 },
		],
		template: <FocusTopTemplateIcon />,
	},
	{
		id: "landscape-focus",
		name: "Focus Layout Landscape",
		description:
			"Composición landscape 16:9 con un clip principal a la izquierda y tres clips a la derecha.",
		kind: "grid",
		orientation: "landscape",
		maxSlots: 4,
		defaultStyle: {
			backgroundColor: "#0F172A",
			gap: 8,
			borderRadius: 12,
			sequenceEffect: "fade",
			sequenceTransitionSeconds: 1,
		},
		output: {
			width: 1920,
			height: 1080,
		},
		slots: [
			{ id: "a", x: 0, y: 0, width: 50, height: 100 },
			{ id: "b", x: 50, y: 0, width: 50, height: 50 },
			{ id: "c", x: 50, y: 50, width: 25, height: 50 },
			{ id: "d", x: 75, y: 50, width: 25, height: 50 },
		],
		template: <FocusLandscapeTemplateIcon />,
	},
];

export const getTemplate = (id: string) =>
	templateRegistry.find((item) => item.id === id);
