export interface ImageOption {
  id: string;
  label: string;
  image?: string;
  option: string;
}

export const imageOptions: ImageOption[] = [
  {
    id: "oil-painting",
    label: "Oil Painting Style Portrait",
    image: "/selectImage/oilPaintingStylePortrait.png",
    option: "portrait",
  },
  {
    id: "fashion-illustration",
    label: "Fashion Illustration (Outfit Focus)",
    image: "/selectImage/fashionIllustration(OutfitFocus).png",
    option: "card",
  },
  {
    id: "riding-horse",
    label: "Riding The Horse in Official Racing Gear",
    image: "/selectImage/ridingTheHorseInOfficialRacingGear.png",
    option: "horse",
  },
  {
    id: "holding-trophy",
    label: "Holding The Saudi Cup Trophy",
    image: "/selectImage/holdingTheSaudiCupTrophy.png",
    option: "trophy",
  },
];
