import ReactNativePreviewRenderer from "@/components/preview/ReactNativePreviewRenderer";
import { PreviewEngine } from "./contracts";

export const reactNativePreviewEngine: PreviewEngine = {
  id: "react-native-preview",
  displayName: "React Native Preview Engine",
  Renderer: ReactNativePreviewRenderer,
};

