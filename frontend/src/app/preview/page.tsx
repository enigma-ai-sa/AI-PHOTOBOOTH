"use client";

import Button from "@/components/UI/Button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiCheck, FiRefreshCw } from "react-icons/fi";

export default function Preview() {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [endpoint, setEndpoint] = useState<string>("");

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
    <div className="h-screen bg-white p-8 overflow-hidden flex w-full flex-col">
      {/* Image container - centered */}
      <div className="relative w-full max-w-6xl mx-auto flex-1 flex items-center justify-center">
        <div className="rounded-3xl overflow-hidden border-4 border-gradient-blue-end w-full aspect-[2/3] relative">
          <Image
            src={capturedImage}
            alt="Captured photo"
            fill
            className="object-cover transform -scale-x-100 rotate-180"
            unoptimized
          />
        </div>
      </div>

      {/* Bottom controls - outside image container */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-2 gap-4 py-6 px-6">
        <Button
          onClick={handleRetake}
          variant="tertiary"
          size="large"
          className="gap-6"
        >
          <FiRefreshCw size={50} /> Retake
        </Button>
        <Button
          onClick={handleGenerate}
          variant="primary"
          size="large"
          className="gap-6"
        >
          <FiCheck size={50} /> Generate
        </Button>
      </div>
    </div>
  );
}
