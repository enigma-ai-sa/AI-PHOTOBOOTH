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
    label: "Sewing/Weaving",
    image: "/selectImage/palmCraft.jpg",
    endpoint: "/image-generator-palm-craft",
  },
  {
    id: "ahlam-logo",
    label: "Ahlam Logo",
    image: "/selectImage/ahlamLogo.jpg",
    endpoint: "/image-generator-embroidery",
  },
  {
    id: "alula-selfie",
    label: "Al-Ula Background Selfie",
    image: "/selectImage/alulaSelfie.jpg",
    endpoint: "/image-generator-ghibli",
  },
];
