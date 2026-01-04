"use client";

import Button from "@/components/UI/Button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiCheck, FiRefreshCw } from "react-icons/fi";
import Logo from "@/components/Logo";

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
    <div className="h-dvh p-4 md:p-8 !pt-0 bg-forest-green bg-[url('/patterns/background.svg')] bg-repeat-round">
      <div className="w-full h-full py-6 rounded-2xl flex flex-col">
        {/* Logo */}
        <div className="flex justify-end pb-10">
          <Logo width={150} height={80} className="" />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6 min-h-0 ">
          {/* Image container - centered */}
          <div className="relative w-full flex-1 flex items-center justify-center">
            <div className="rounded-[50px] overflow-hidden border-[15px] border-gold w-full h-full relative">
              <Image
                src={capturedImage}
                alt="Captured photo"
                fill
                className="object-cover transform -scale-x-100"
                unoptimized
              />
            </div>
          </div>

          {/* Bottom controls - outside image container */}
          <div className="w-full grid grid-cols-2 gap-4 py-6 px-6 flex-shrink-0">
            <Button
              onClick={handleRetake}
              variant="tertiary"
              size="large"
              className="gap-6"
            >
              إعادة المحاولة
              <FiRefreshCw size={50} />
            </Button>
            <Button
              onClick={handleGenerate}
              variant="primary"
              size="large"
              className="gap-6"
            >
              تأكيد
              <FiCheck size={50} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
