import Svg, { Rect } from "react-native-svg";

export default function FocusTopTemplateIcon() {
	return (
		<Svg viewBox="0 0 144 216" fill="none" className="max-h-fit">
			<Rect x={0} y={0} width={144} height={216} rx={14} fill="#340090" />
			<Rect x={4} y={4} width={136} height={102} rx={10} fill="#280072" />
			<Rect x={4} y={110} width={66} height={102} rx={10} fill="#280072" />
			<Rect x={74} y={110} width={66} height={50} rx={10} fill="#280072" />
			<Rect x={74} y={164} width={66} height={48} rx={10} fill="#280072" />
		</Svg>
	);
}
