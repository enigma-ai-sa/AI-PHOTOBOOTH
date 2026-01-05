"use client";

import Button from "@/components/UI/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuArrowRight } from "react-icons/lu";

export default function SelectType() {
  const [selectedStyle, setSelectedStyle] = useState<
    "studio" | "ghibli" | null
  >("studio");
  const router = useRouter();

  const handleStyleSelect = (style: "studio" | "ghibli") => {
    setSelectedStyle(style);
  };

  const handleNext = () => {
    if (selectedStyle) {
      // Store the selected style in localStorage
      localStorage.setItem("selectedStyle", selectedStyle);
      // Navigate to profession selection
      router.push("/select-profession");
    }
  };

  return (
    <div className="h-dvh p-4 md:p-8 !pt-0 bg-forest-green bg-[url('/patterns/background.svg')] bg-repeat-round">
      <div className="w-full h-full py-6 rounded-2xl flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 py-6 flex flex-col gap-15 min-h-0 justify-center">
          {/* Title */}
          <h2 className="text-8xl text-cream font-medium text-center mb-60">
            اختر شكل الصورة
          </h2>

          {/* Style Options */}
          <div className="flex flex-col gap-10 w-full px-8">
            {/* Realistic (Studio) Option */}
            <button
              onClick={() => handleStyleSelect("studio")}
              className={`relative cursor-pointer rounded-[50px] transition-all duration-200 border-[6px] py-24 flex items-center justify-center ${
                selectedStyle === "studio"
                  ? "border-cream bg-cream ring-inset ring-[8px] ring-forest-green"
                  : "border-cream hover:scale-[1.02] bg-forest-green"
              }`}
            >
              <p
                className={`text-center font-medium text-8xl transition-colors duration-200 ${
                  selectedStyle === "studio"
                    ? "text-forest-green"
                    : "text-cream"
                }`}
              >
                واقعي
              </p>
            </button>

            {/* Cartoon (Ghibli) Option */}
            <button
              onClick={() => handleStyleSelect("ghibli")}
              className={`relative cursor-pointer rounded-[50px] transition-all duration-200 border-[6px] py-24 flex items-center justify-center ${
                selectedStyle === "ghibli"
                  ? "border-cream bg-cream ring-inset ring-[8px] ring-forest-green"
                  : "border-cream hover:scale-[1.02] bg-forest-green"
              }`}
            >
              <p
                className={`text-center font-medium text-8xl transition-colors duration-200 ${
                  selectedStyle === "ghibli"
                    ? "text-forest-green"
                    : "text-cream"
                }`}
              >
                كارتون
              </p>
            </button>
          </div>
        </div>

        {/* Navigation Buttons - Fixed at bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 w-full flex-shrink-0">
          <Button
            onClick={handleNext}
            disabled={!selectedStyle}
            variant="primary"
            size="large"
            className="w-full flex items-center justify-center gap-4"
          >
            التالي <LuArrowRight size={46} />
          </Button>
        </div>
      </div>
    </div>
  );
}
