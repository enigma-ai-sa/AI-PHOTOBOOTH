export interface ImageOption {
  id: string;
  label: string;
  image?: string;
  option: string;
}

export const imageOptions: ImageOption[] = [
  {
    id: "bluebrains",
    label: "Blue Brains",
    image: "/selectImage/BlueBrains.png",
    option: "bluebrains",
  },
  {
    id: "mecno2026",
    label: "MECNO 2026",
    image: "/selectImage/MECNO2026.png",
    option: "mecno2026",
  },
  {
    id: "riyadhcity",
    label: "Riyadh City",
    image: "/selectImage/RiyadhCity.png",
    option: "riyadhcity",
  },
  {
    id: "sketch",
    label: "Sketch",
    image: "/selectImage/Sketch.png",
    option: "sketch",
  },
];
