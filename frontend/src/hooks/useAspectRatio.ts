import { getAspectRatioConfig, getAspectTailwindClass, getVideoAspectRatio } from "@/data/aspectRatioConfig";

export function useAspectRatio() {
  const config = getAspectRatioConfig();
  return {
    config,
    tailwindClass: getAspectTailwindClass(),
    videoConstraintRatio: getVideoAspectRatio(),
    isFullHeight: config.numericRatio === null,
  };
}
