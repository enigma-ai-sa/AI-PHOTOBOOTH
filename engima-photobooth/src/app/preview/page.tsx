"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BiArrowBack } from "react-icons/bi";
import { FiCheck, FiRefreshCw } from "react-icons/fi";
import Image from "next/image";
import Button from "@/components/UI/Button";

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
      <div className="relative w-full h-full mx-auto flex-1 flex flex-col">
        <div className="rounded-3xl overflow-hidden border-4 border-gradient-blue-end w-full flex-1 relative">
          <Image
            src={capturedImage}
            alt="Captured photo"
            fill
            className="object-cover transform -scale-x-100"
            unoptimized
          />
        </div>

        <div className="grid grid-cols-2 gap-4 absolute bottom-8 left-8 right-8 z-10 bg-gradient-to-t from-black/30 via-black/10 to-transparent py-10 px-6 rounded-3xl backdrop-blur-sm bg-white/90">
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
    </div>
  );
}
