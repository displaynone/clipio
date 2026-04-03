import FocusTopTemplateView from "@/components/templates/FocusTopTemplateView";
import Grid2x2TemplateView from "@/components/templates/Grid2x2TemplateView";
import { TemplateViewProps } from "@/components/templates/template-view.types";

export default function TemplateTemplateView(props: TemplateViewProps) {
	switch (props.template.id) {
		case "grid-2x2":
			return <Grid2x2TemplateView {...props} />;
		case "focus-top":
		default:
			return <FocusTopTemplateView {...props} />;
	}
}
