export interface ImageOption {
  id: string;
  label: string;
  image: string;
  profession: string; // backend profession name (e.g., "astronaut", "doctor")
  style: "studio" | "ghibli"; // style type
}

export const professions = [
  {
    id: "astronaut",
    labelAr: "رائد فضاء",
    imageFile: "space.jpeg",
    backendName: "astronaut",
  },
  {
    id: "doctor",
    labelAr: "طبيب",
    imageFile: "doctor.jpeg",
    backendName: "doctor",
  },
  {
    id: "engineer",
    labelAr: "مهندس",
    imageFile: "engineer.jpeg",
    backendName: "engineer",
  },
  {
    id: "pilot",
    labelAr: "طيار",
    imageFile: "pilot.jpeg",
    backendName: "pilot",
  },
  {
    id: "police",
    labelAr: "شرطي",
    imageFile: "policeman.jpeg",
    backendName: "police",
  },
  {
    id: "fireman",
    labelAr: "رجل إطفاء",
    imageFile: "fireFighter.jpeg",
    backendName: "fireman",
  },
  {
    id: "teacher",
    labelAr: "معلم",
    imageFile: "teacher.jpeg",
    backendName: "teacher",
  },
  {
    id: "judge",
    labelAr: "قاضي",
    imageFile: "laywer.jpeg",
    backendName: "judge",
  },
  {
    id: "chemist",
    labelAr: "كيميائي",
    imageFile: "scientist.jpeg",
    backendName: "chemist",
  },
  {
    id: "artist",
    labelAr: "فنان",
    imageFile: "art.jpeg",
    backendName: "artist",
  },
];

// Generate image options dynamically based on style
export const getImageOptionsByStyle = (
  style: "studio" | "ghibli"
): ImageOption[] => {
  return professions.map((profession) => ({
    id: `${style}_${profession.id}`,
    label: profession.labelAr,
    image: `/selectImage/${style}/${profession.imageFile}`,
    profession: profession.backendName,
    style: style,
  }));
};

// For backward compatibility, export all options (both styles)
export const imageOptions: ImageOption[] = [
  ...getImageOptionsByStyle("studio"),
  ...getImageOptionsByStyle("ghibli"),
];
