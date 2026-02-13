export type AspectRatioKey =
  | "16:9"
  | "4:3"
  | "3:2"
  | "1:1"
  | "9:16"
  | "2:3"
  | "full-height";

export interface AspectRatioConfig {
  key: AspectRatioKey;
  label: string;
  numericRatio: number | null; // For video constraints (null = no restriction)
  tailwindClass: string | null; // For CSS class (null = use h-full)
}

export const ASPECT_RATIOS: Record<AspectRatioKey, AspectRatioConfig> = {
  "16:9": {
    key: "16:9",
    label: "Widescreen",
    numericRatio: 16 / 9,
    tailwindClass: "aspect-[16/9]",
  },
  "4:3": {
    key: "4:3",
    label: "Standard",
    numericRatio: 4 / 3,
    tailwindClass: "aspect-[4/3]",
  },
  "3:2": {
    key: "3:2",
    label: "Classic",
    numericRatio: 3 / 2,
    tailwindClass: "aspect-[3/2]",
  },
  "1:1": {
    key: "1:1",
    label: "Square",
    numericRatio: 1,
    tailwindClass: "aspect-square",
  },
  "9:16": {
    key: "9:16",
    label: "Portrait",
    numericRatio: 9 / 16,
    tailwindClass: "aspect-[9/16]",
  },
  "2:3": {
    key: "2:3",
    label: "Portrait 2:3",
    numericRatio: 2 / 3,
    tailwindClass: "aspect-[2/3]",
  },
  "full-height": {
    key: "full-height",
    label: "Full Height",
    numericRatio: null,
    tailwindClass: null,
  },
};

// ====== CHANGE THIS TO SWITCH ASPECT RATIO ======
export const CURRENT_ASPECT_RATIO: AspectRatioKey = "3:2";

// ====== TOGGLE PRINT VS DONE BUTTON ======
export const SHOW_PRINT_BUTTON = false; // Set to false to show "Done" button, true to show "Print"

// Helper functions
export const getAspectRatioConfig = () => ASPECT_RATIOS[CURRENT_ASPECT_RATIO];
export const getAspectTailwindClass = () => {
  const config = getAspectRatioConfig();
  return config.tailwindClass ?? "h-full !w-full";
};
export const getVideoAspectRatio = () =>
  getAspectRatioConfig().numericRatio ?? undefined;
