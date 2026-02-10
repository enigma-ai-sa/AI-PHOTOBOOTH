"use client";

import Button from "@/components/UI/Button";
import { useAspectRatio } from "@/hooks/useAspectRatio";
import { useImageStream } from "@/hooks/useImageStream";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoPrintOutline, IoRefreshOutline } from "react-icons/io5";

export default function Processing() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const hasStartedGenerationRef = useRef(false);
  const router = useRouter();
  const { tailwindClass } = useAspectRatio();

  const {
    currentImage,
    imageType,
    qrCode,
    isLoading,
    isComplete,
    error,
    startStream,
    reset,
  } = useImageStream();

  useEffect(() => {
    const image = localStorage.getItem("capturedImage");
    const option = localStorage.getItem("selectedOption");

    if (!image || !option) {
      router.push("/camera");
      return;
    }

    setCapturedImage(image);

    // Only start generation once using ref to prevent race conditions
    if (!hasStartedGenerationRef.current && !currentImage) {
      hasStartedGenerationRef.current = true;
      startStream(image, option);
    }
  }, [currentImage, router, startStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stream will be cancelled when component unmounts due to AbortController cleanup
    };
  }, []);

  const handleRetry = () => {
    if (!capturedImage) return;
    const option = localStorage.getItem("selectedOption");
    if (!option) {
      router.push("/select-style");
      return;
    }
    reset();
    hasStartedGenerationRef.current = true;
    startStream(capturedImage, option);
  };

  const handleStartOver = () => {
    router.push("/select-style");
  };

  const handlePrint = async () => {
    if (!currentImage || isPrinting) return;
    setIsPrinting(true);
    try {
      await fetch("/api/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: currentImage }),
      });
    } catch (err) {
      console.error("Print request failed:", err);
    }
    router.push("/thank-you");
  };

  // Determine loading text based on state
  const getLoadingText = () => {
    if (error) return null;
    if (imageType === "partial") return "Refining image...";
    if (imageType === "final" && !qrCode) return "Generating QR code...";
    if (!currentImage) return "Your New Year's photo is being created...";
    return null;
  };

  const loadingText = getLoadingText();

  return (
    <div className="h-screen bg-white p-8 overflow-hidden flex w-full flex-col">
      <div className="relative w-full h-full mx-auto flex-1 flex flex-col">
        <div className="rounded-3xl overflow-hidden border-4 border-gradient-blue-end w-full flex-1">
          {error ? (
            <div className="relative w-full h-full bg-stone-600 flex items-center justify-center p-4 mx-auto">
              <div className="text-center mx-auto">
                <p className="text-red-400 mb-4 text-2xl">{error}</p>
                <Button
                  onClick={handleRetry}
                  variant="primary"
                  size="medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </Button>
              </div>
            </div>
          ) : isComplete && currentImage ? (
            <div className="w-full h-full flex flex-col p-6 relative">
              {/* QR Code Section - Top Right Corner */}
              {qrCode && (
                <div className="absolute top-0 right-4 z-10">
                  <div className="bg-white rounded-xl shadow-lg flex flex-col items-center gap-2">
                    <img
                      src={qrCode}
                      alt="QR Code to download your photo"
                      className="w-64 h-64"
                    />
                    <p className="text-sm font-medium text-gray-700 text-center">
                      Scan to download
                    </p>
                  </div>
                </div>
              )}

              {/* Image Section - Centered */}
              <div className="flex-1 flex items-center justify-center min-h-0">
                {/* Image Section - 3:2 Aspect Ratio */}
                <div
                  className={`w-full max-w-6xl ${tailwindClass} rounded-xl overflow-hidden`}
                >
                  <img
                    src={currentImage}
                    alt="AI generated photo"
                    className="w-full h-full object-cover image-ready"
                    onError={() => {
                      console.error(
                        "Failed to load generated image:",
                        currentImage,
                      );
                    }}
                  />
                </div>
              </div>

              {/* Buttons Section - White Background - At Bottom */}
              <div className="bg-white py-10 px-6 rounded-3xl space-y-4 shadow-md mt-6">
                <p className="text-3xl font-normal text-center">
                  <span className="text-black">Powered by </span>
                  <span className="bg-gradient-to-r from-primary-purple-500 via-primary-light-blue-500 to-accent-green-500 bg-clip-text text-transparent font-medium">
                    enigma
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleStartOver}
                    variant="tertiary"
                    size="large"
                    className="gap-4"
                  >
                    <IoRefreshOutline />
                    Retake
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="primary"
                    size="large"
                    className="gap-4"
                    disabled={isPrinting}
                  >
                    <IoPrintOutline />
                    {isPrinting ? "Printing..." : "Print"}
                  </Button>
                </div>
              </div>
            </div>
          ) : isLoading || currentImage ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Container with same size as final image */}
              <div
                className={`w-full max-w-6xl ${tailwindClass} rounded-xl overflow-hidden bg-stone-600 relative`}
              >
                {currentImage ? (
                  <>
                    {/* The streaming image with blur/opacity transitions */}
                    <img
                      src={currentImage}
                      alt="Generating..."
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        imageType === "partial"
                          ? "image-loading"
                          : "image-ready"
                      }`}
                    />

                    {/* Spinner overlay for partial images */}
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="text-center">
                          <div className="mb-6">
                            <div className="inline-block relative">
                              <div className="w-20 h-20 border-8 border-white border-t-gray-400 border-r-gray-400 rounded-full animate-spin"></div>
                            </div>
                          </div>
                          {loadingText && (
                            <p className="text-white text-2xl font-medium">
                              {loadingText}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Initial loading state with no image yet */
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="mb-6">
                        <div className="inline-block relative">
                          <div className="w-45 h-45 border-15 border-white border-t-gray-400 border-r-gray-400 rounded-full animate-spin"></div>
                          <div className="absolute inset-0 w-45 h-45 border-15 border-transparent border-r-white rounded-full animate-spin animation-delay-150"></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-white text-4xl font-medium">
                          {loadingText}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full bg-stone-600 flex items-center justify-center">
              <p className="text-gray-300 text-lg">Waiting...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
