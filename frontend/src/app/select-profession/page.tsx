"use client";

import Button from "@/components/UI/Button";
import { getImageOptionsByStyle, ImageOption } from "@/data/imageOptions";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LuArrowLeft, LuArrowRight } from "react-icons/lu";

export default function SelectProfession() {
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [professionOptions, setProfessionOptions] = useState<ImageOption[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<"studio" | "ghibli" | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get the selected style from localStorage
    const style = localStorage.getItem("selectedStyle") as "studio" | "ghibli" | null;

    if (!style) {
      // If no style selected, redirect back to style selection
      router.push("/select-type");
      return;
    }

    setSelectedStyle(style);
    // Get professions for the selected style
    const options = getImageOptionsByStyle(style);
    setProfessionOptions(options);
  }, [router]);

  const handleProfessionSelect = (professionId: string) => {
    setSelectedProfession(professionId);
  };

  const handleNext = () => {
    if (selectedProfession && selectedStyle) {
      const selected = professionOptions.find(
        (option) => option.id === selectedProfession
      );
      if (selected) {
        // Store the complete option (style_profession) in localStorage
        // Format: "studio_doctor" or "ghibli_astronaut"
        const backendOption = `${selected.style}_${selected.profession}`;
        localStorage.setItem("selectedOption", backendOption);
        // Navigate to camera
        router.push("/camera");
      }
    }
  };

  const handleBack = () => {
    router.push("/select-type");
  };

  // Show loading state while fetching style
  if (!selectedStyle || professionOptions.length === 0) {
    return (
      <div className="h-dvh p-4 md:p-8 !pt-0 bg-forest-green bg-[url('/patterns/background.svg')] bg-repeat-round flex items-center justify-center">
        <p className="text-4xl text-cream">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="h-dvh p-4 md:p-8 !pt-0 bg-forest-green bg-[url('/patterns/background.svg')] bg-repeat-round">
      <div className="w-full h-full py-6 rounded-2xl flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 py-6 flex flex-col gap-15 min-h-0">
          {/* Title */}
          <h2 className="text-8xl text-cream font-medium text-center">
            اختر مهنتك المفضلة
          </h2>

          {/* Image Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-[1fr_1fr_auto] gap-6 flex-1 min-h-0 overflow-y-auto">
            {professionOptions.map((option) => (
              <div
                key={option.id}
                className={`relative cursor-pointer rounded-[25px] md:rounded-[50px] transition-all duration-200 border-8 md:border-[15px] overflow-hidden h-[650px] flex flex-col ${
                  selectedProfession === option.id
                    ? "border-gold bg-gold"
                    : "border-cream hover:scale-[1.02] bg-cream"
                }`}
                onClick={() => handleProfessionSelect(option.id)}
              >
                <div className="flex-1 relative">
                  <Image
                    src={option.image}
                    alt={option.label}
                    fill
                    className="object-cover rounded-4xl object-top"
                    priority
                  />
                </div>
                <div
                  className={`p-6 transition-colors duration-200 flex-shrink-0 ${
                    selectedProfession === option.id
                      ? "bg-gold text-white"
                      : "bg-cream text-black"
                  }`}
                >
                  <p className="text-center font-medium text-2xl">
                    {option.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Instruction & Navigation Buttons */}
          <div className="flex flex-col gap-6 w-full flex-shrink-0">
            {/* Scroll Instruction */}
            <p className="text-center text-white text-4xl font-medium">
              أسحب لأعلي لمزيد من الخيارات
            </p>

            {/* Navigation Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 w-full">
              <Button
                onClick={handleBack}
                variant="tertiary"
                size="large"
                className="w-full order-2 md:order-1 flex items-center justify-center gap-4 leading-none"
              >
                <LuArrowLeft size={46} className="-mb-3" /> رجوع
              </Button>
              <Button
                onClick={handleNext}
                disabled={!selectedProfession}
                variant="primary"
                size="large"
                className="w-full order-1 md:order-2 flex items-center justify-center gap-4"
              >
                التالي <LuArrowRight size={46} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
