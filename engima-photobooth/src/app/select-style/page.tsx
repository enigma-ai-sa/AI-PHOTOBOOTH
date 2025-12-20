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
        // Navigate to camera with the selected endpoint
        router.push(
          `/camera?endpoint=${encodeURIComponent(selected.endpoint)}`
        );
      }
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="h-dvh p-4 md:p-8 bg-white">
      <div className="w-full h-full py-6 rounded-2xl flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 py-6 flex flex-col gap-15 min-h-0">
          {/* Title */}
          <h2 className="text-7xl text-gradient-blue-end font-medium text-center">
            Choose Your Favorite <span className="block">Photo Style</span>
          </h2>

          {/* Image Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
            {imageOptions.map((option) => (
              <div
                key={option.id}
                className={`relative cursor-pointer rounded-[25px] md:rounded-[50px] transition-all duration-200 border-8 md:border-[15px] overflow-hidden flex flex-col ${
                  selectedOption === option.id
                    ? "border-gradient-blue-end bg-gradient-blue-end"
                    : "border-gray-400 hover:scale-[1.02] bg-gray-400"
                }`}
                onClick={() => handleOptionSelect(option.id)}
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
                    selectedOption === option.id
                      ? "bg-gradient-blue-end text-white"
                      : "bg-gray-400  text-black"
                  }`}
                >
                  <p className="text-center font-medium text-2xl">
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
