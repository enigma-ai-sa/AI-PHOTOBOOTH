"use client";

import Button from "@/components/UI/Button";
import { useAspectRatio } from "@/hooks/useAspectRatio";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiRotateCcw, FiArrowRight } from "react-icons/fi";
import { useTranslation } from "@/i18n/useTranslation";

export default function Preview() {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [endpoint, setEndpoint] = useState<string>("");
  const { tailwindClass } = useAspectRatio();
  const { t, isRTL } = useTranslation();

  useEffect(() => {
    // Get captured image and endpoint from localStorage
    const image = localStorage.getItem("capturedImage");
    const selectedEndpoint = localStorage.getItem("selectedEndpoint");

    if (!image) {
      // If no image, redirect back to camera
      router.push("/select-style");
      return;
    }

    setCapturedImage(image);
    setEndpoint(selectedEndpoint || "");
  }, [router]);

  const handleRetake = () => {
    // Navigate back to camera with the same endpoint
    if (endpoint) {
      router.push(`/camera?endpoint=${endpoint}`);
    } else {
      router.push("/select-style");
    }
  };

  const handleGenerate = () => {
    // Navigate to processing page
    router.push("/processing");
  };

  if (!capturedImage) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="h-screen bg-saudi-green overflow-hidden flex w-full flex-col relative">
      {/* Background pattern overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none"
        style={{ backgroundImage: "url('/assets/saudiBgPattern.png')" }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with logos */}
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

        {/* Image container - centered */}
        <div className="relative w-full max-w-6xl mx-auto flex-1 flex items-center justify-center px-8">
          <div
            className={`rounded-[25px] overflow-hidden border-4 border-saudi-gold w-full ${tailwindClass}`}
          >
            <img
              src={capturedImage}
              alt="Captured photo"
              className="w-full h-full object-cover transform -scale-x-100"
            />
          </div>
        </div>

        {/* Bottom controls */}
        <div className="w-full max-w-6xl mx-auto grid grid-cols-2 gap-4 py-6 px-9">
          <Button
            onClick={handleRetake}
            variant="saudi-outline"
            size="large"
            className="gap-6"
          >
            <FiRotateCcw size={50} /> {t.preview.retry}
          </Button>
          <Button
            onClick={handleGenerate}
            variant="saudi"
            size="large"
            className="gap-6"
          >
            {t.preview.generate} <FiArrowRight size={50} className={isRTL ? "-scale-x-100" : ""} />
          </Button>
        </div>
      </div>
    </div>
  );
}
