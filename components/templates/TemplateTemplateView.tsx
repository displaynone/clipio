import FocusTopTemplateView from "@/components/templates/FocusTopTemplateView";
import Grid2x2TemplateView from "@/components/templates/Grid2x2TemplateView";
import { TemplateViewProps } from "@/components/templates/template-view.types";
import VideoSequenceTemplateView from "./VideoSequenceTemplateView";

export default function TemplateTemplateView(props: TemplateViewProps) {
	if (props.template.kind === "sequence") {
		return <VideoSequenceTemplateView {...props} />;
	}

	switch (props.template.id) {
		case "grid-2x2":
		case "landscape-grid-2x2":
			return <Grid2x2TemplateView {...props} />;
		case "focus-top":
		case "landscape-focus":
		default:
			return <FocusTopTemplateView {...props} />;
	}
}
