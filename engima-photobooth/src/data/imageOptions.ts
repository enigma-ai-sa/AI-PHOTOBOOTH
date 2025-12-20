export interface ImageOption {
  id: string;
  label: string;
  image: string;
  endpoint: string;
}

export const imageOptions: ImageOption[] = [
  {
    id: "pottery",
    label: "pottery (الفخار)",
    image: "/selectImage/pottery.jpg",
    endpoint: "/image-generator-pottery",
  },
  {
    id: "palm-craft",
    label: "Palm leaf weaving (الخوص)",
    image: "/selectImage/palmcraft.png",
    endpoint: "/image-generator-palm-craft",
  },
  {
    id: "embroidery",
    label: "Traditional embroidery (الطرز)",
    image: "/selectImage/embroidery.png",
    endpoint: "/image-generator-embroidery",
  },
  {
    id: "ghibli",
    label: "Ghibli style (غبلي)",
    image: "/selectImage/ghibli.png",
    endpoint: "/image-generator-ghibli",
  },
];
