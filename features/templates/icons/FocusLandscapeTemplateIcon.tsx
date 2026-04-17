import Svg, { Rect } from "react-native-svg";

export default function FocusLandscapeTemplateIcon() {
	return (
		<Svg viewBox="0 0 216 144" fill="none" className="max-h-fit">
			<Rect x={0} y={0} width={216} height={144} rx={14} fill="#340090" />
			<Rect x={4} y={4} width={102} height={136} rx={10} fill="#280072" />
			<Rect x={110} y={4} width={102} height={66} rx={10} fill="#280072" />
			<Rect x={110} y={74} width={49} height={66} rx={10} fill="#280072" />
			<Rect x={163} y={74} width={49} height={66} rx={10} fill="#280072" />
		</Svg>
	);
}
