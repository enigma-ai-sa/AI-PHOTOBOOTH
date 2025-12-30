export interface ImageOption {
  id: string;
  label: string;
  image?: string;
  option: string;
}

export const imageOptions: ImageOption[] = [
  {
    id: "ghibli",
    label: "Ghibli Style",
    image: "/selectImage/ghibli.png",
    option: "ghibli",
  },
  {
    id: "studio",
    label: "Studio Portrait",
    image: "/selectImage/studio.png",
    option: "studio",
  },
  {
    id: "2026",
    label: "2026 Celebration",
    image: "/selectImage/2026.png",
    option: "2026",
  },
  {
    id: "hny",
    label: "Happy New Year",
    image: "/selectImage/hny.png",
    option: "HNY",
  },
];
