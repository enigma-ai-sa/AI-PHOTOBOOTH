"use client";
import Button from "@/components/UI/Button";
import { imageOptions } from "@/data/imageOptions";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuArrowRight } from "react-icons/lu";
import { useTranslation } from "@/i18n/useTranslation";

export default function SelectStyle() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const router = useRouter();
  const { t, isRTL } = useTranslation();

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleNext = () => {
    if (selectedOption) {
      const selected = imageOptions.find(
        (option) => option.id === selectedOption,
      );
      if (selected) {
        // Store the selected option in localStorage
        localStorage.setItem("selectedOption", selected.option);
        // Navigate to camera
        router.push("/camera");
      }
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  // Helper function to get translated label
  const getOptionLabel = (optionId: string) => {
    return t.imageOptions[optionId as keyof typeof t.imageOptions] || optionId;
  };

  return (
    <div className="h-dvh p-4 md:p-8 bg-saudi-green relative">
      {/* Background Pattern Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none"
        style={{ backgroundImage: "url('/assets/saudiBgPattern.png')" }}
      />

      <div className="w-full h-full flex flex-col relative z-10">
        {/* Header with Logos */}
        <header className="flex justify-between items-center py-6 px-9">
          <Image
            src="/assets/enigmaLogo.svg"
            alt="Enigma"
            width={240}
            height={60}
          />
          <Image
            src="/assets/saudiCupLogo.svg"
            alt="Saudi Cup 2026"
            width={160}
            height={40}
          />
        </header>

        {/* Main Content Area */}
        <div className="flex-1 py-6 flex flex-col gap-15 min-h-0">
          {/* Title */}
          <h2 className="text-7xl text-saudi-gold font-medium text-center">
            {t.selectStyle.title}
          </h2>

          {/* Image Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-[1fr_1fr_auto] gap-6 flex-1 min-h-0">
            {imageOptions.map((option) => (
              <div
                key={option.id}
                className={`relative cursor-pointer rounded-[25px] md:rounded-[50px] transition-all duration-200 border-8 md:border-2 overflow-hidden px-4 pt-5 ${
                  option.image
                    ? "flex flex-col"
                    : "md:col-span-2 flex items-center justify-center h-30"
                } ${
                  selectedOption === option.id
                    ? "border-saudi-gold bg-saudi-gold"
                    : "border-saudi-card-border hover:scale-[1.02] bg-saudi-card-base"
                }`}
                onClick={() => handleOptionSelect(option.id)}
              >
                {option.image ? (
                  <>
                    <div
                      className={`flex-1 relative rounded-4xl overflow-hidden ${
                        selectedOption === option.id
                          ? "border-4 border-saudi-gold"
                          : ""
                      }`}
                    >
                      <Image
                        src={option.image}
                        alt={getOptionLabel(option.id)}
                        fill
                        className="object-cover rounded-4xl object-top border-4 border-saudi-card-border "
                        priority
                      />
                    </div>
                    <div
                      className={`p-6 transition-colors duration-200 flex-shrink-0 ${
                        selectedOption === option.id
                          ? "bg-saudi-gold text-saudi-green"
                          : "bg-saudi-card-base text-white"
                      }`}
                    >
                      <p className="text-center font-medium text-2xl">
                        {getOptionLabel(option.id)}
                      </p>
                    </div>
                  </>
                ) : (
                  <div
                    className={`p-6 transition-colors duration-200 w-full ${
                      selectedOption === option.id
                        ? "bg-saudi-gold text-saudi-green"
                        : "bg-saudi-card-base text-white"
                    }`}
                  >
                    <p className="text-center font-medium text-2xl">
                      {getOptionLabel(option.id)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 w-full flex-shrink-0">
            <Button
              onClick={handleBack}
              variant="saudi-back"
              size="large"
              className="w-full order-2 md:order-1"
            >
              {t.selectStyle.back}
            </Button>
            <Button
              onClick={handleNext}
              disabled={!selectedOption}
              variant="saudi"
              size="large"
              className="w-full order-1 md:order-2 flex items-center justify-center gap-4"
            >
              {t.selectStyle.next} <LuArrowRight size={46} className={isRTL ? "-scale-x-100" : ""} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
