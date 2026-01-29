"use client";

import Button from "@/components/UI/Button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiCheck, FiRefreshCw } from "react-icons/fi";

export default function Preview() {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [imageError, setImageError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get captured image from localStorage
    const image = localStorage.getItem("capturedImage");

    console.log("Preview: Looking for captured image, found:", image ? `${image.length} chars` : "null");

    if (!image) {
      // If no image, redirect back to camera
      console.log("Preview: No image found, redirecting to select-style");
      router.push("/select-style");
      return;
    }

    setCapturedImage(image);
    setIsLoading(false);
  }, [router]);

  const handleRetake = () => {
    router.push("/camera");
  };

  const handleGenerate = () => {
    // Navigate to processing page
    router.push("/processing");
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-2xl text-gray-600">Loading preview...</p>
      </div>
    );
  }

  if (!capturedImage) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="h-screen bg-white p-12 overflow-hidden flex w-full flex-col">
      {/* Image container - centered */}
      <div className="relative w-full mx-auto flex-1 flex items-center justify-center">
        <div className="rounded-[40px] overflow-hidden border-8 border-gradient-green-end w-full aspect-[3/2] relative">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <p className="text-red-500 text-xl">Failed to load image</p>
            </div>
          ) : (
            <Image
              src={capturedImage}
              alt="Captured photo"
              fill
              className="object-cover transform -scale-x-100"
              unoptimized
              onError={() => {
                console.error("Failed to load preview image");
                setImageError(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Bottom controls - outside image container */}
      <div className="w-full mx-auto grid grid-cols-2 gap-8 py-12 px-8">
        <Button
          onClick={handleRetake}
          variant="tertiary"
          size="large"
          className="gap-8 !py-16 !text-5xl"
        >
          <FiRefreshCw size={70} /> Retake
        </Button>
        <Button
          onClick={handleGenerate}
          variant="primary"
          size="large"
          className="gap-8 !py-16 !text-5xl"
        >
          <FiCheck size={70} /> Generate
        </Button>
      </div>
    </div>
  );
}
