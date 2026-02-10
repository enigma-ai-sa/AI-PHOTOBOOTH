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
  }
];
