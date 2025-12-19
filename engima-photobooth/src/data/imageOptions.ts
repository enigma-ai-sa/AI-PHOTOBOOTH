export interface ImageOption {
  id: string;
  label: string;
  image: string;
  endpoint: string;
}

export const imageOptions: ImageOption[] = [
  {
    id: "pottery",
    label: "Pottery Making",
    image: "/selectImage/pottery.jpg",
    endpoint: "/image-generator-pottery",
  },
  {
    id: "palm-craft",
    label: "Palm Craft",
    image: "/selectImage/palmCraft.jpg",
    endpoint: "/image-generator-palm-craft",
  },
  {
    id: "ghibli",
    label: "Ghibli Style",
    image: "/selectImage/ghibli.jpg",
    endpoint: "/image-generator-ghibli",
  },
  {
    id: "embroidery",
    label: "Embroidery Art",
    image: "/selectImage/embroidery.jpg",
    endpoint: "/image-generator-embroidery",
  },
];
