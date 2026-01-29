"use client";
import Button from "@/components/UI/Button";
import { imageOptions } from "@/data/imageOptions";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuArrowRight } from "react-icons/lu";

export default function SelectStyle() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const router = useRouter();

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleNext = () => {
    if (selectedOption) {
      const selected = imageOptions.find(
        (option) => option.id === selectedOption
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

  return (
    <div className="h-dvh p-4 md:p-6 bg-white overflow-hidden">
      <div className="w-full h-full rounded-2xl flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Title */}
          <h2 className="text-5xl md:text-6xl text-gradient-green-end font-medium text-center py-2">
            Choose Your Photo Style
          </h2>

          {/* Image Options Grid */}
          <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 min-h-0">
            {imageOptions.map((option) => (
              <div
                key={option.id}
                className={`relative cursor-pointer rounded-[20px] md:rounded-[30px] transition-all duration-200 border-[8px] md:border-[10px] overflow-hidden flex flex-col ${
                  selectedOption === option.id
                    ? "border-gradient-green-end"
                    : "border-gray-400 hover:scale-[1.01]"
                }`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <div className="flex-1 relative min-h-0">
                  {option.image && (
                    <Image
                      src={option.image}
                      alt={option.label}
                      fill
                      sizes="50vw"
                      className="object-cover object-top"
                      priority
                    />
                  )}
                </div>
                <div
                  className={`py-3 px-4 transition-colors duration-200 flex-shrink-0 ${
                    selectedOption === option.id
                      ? "bg-gradient-green-end text-white"
                      : "bg-gray-400 text-black"
                  }`}
                >
                  <p className="text-center font-medium text-2xl md:text-4xl">
                    {option.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 w-full flex-shrink-0">
            <Button
              onClick={handleBack}
              variant="tertiary"
              size="large"
              className="w-full order-2 md:order-1"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!selectedOption}
              variant="primary"
              size="large"
              className="w-full order-1 md:order-2 flex items-center justify-center gap-4"
            >
              Next <LuArrowRight size={46} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
