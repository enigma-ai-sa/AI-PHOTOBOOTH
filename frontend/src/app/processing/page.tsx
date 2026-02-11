"use client";

import Button from "@/components/UI/Button";
import { useImageStream } from "@/hooks/useImageStream";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoRefreshOutline } from "react-icons/io5";
import { useTranslation } from "@/i18n/useTranslation";

export default function Processing() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const hasStartedGenerationRef = useRef(false);
  const router = useRouter();
  const { t } = useTranslation();

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

  const handleRetake = () => {
    router.push("/select-style");
  };

  const handleBackToHome = () => {
    localStorage.removeItem("capturedImage");
    localStorage.removeItem("selectedOption");
    router.push("/");
  };

  return (
    <div className="h-screen bg-saudi-green p-8 overflow-hidden flex w-full flex-col relative">
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

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-0 px-9">
          {error ? (
            /* Error state */
            <div className="flex-1 flex flex-col">
              <div className="flex-1 rounded-[25px] border-4 border-saudi-gold bg-[#2a2a2a] flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-red-400 mb-4 text-2xl">{error}</p>
                  <Button
                    onClick={handleRetry}
                    variant="saudi"
                    size="medium"
                    disabled={isLoading}
                  >
                    {isLoading ? t.processing.retrying : t.processing.retry}
                  </Button>
                </div>
              </div>
            </div>
          ) : isComplete && currentImage ? (
            /* Complete state - show image, QR, and buttons */
            <div className="flex-1 flex flex-col min-h-0 gap-6">
              {/* Image container - takes available space */}
              <div className="flex-1 min-h-0 rounded-[25px] border-4 border-saudi-gold overflow-hidden">
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

              {/* Content below image - fades in */}
              <div className="flex-shrink animate-fadeIn flex flex-col justify-center pt-6 overflow-hidden">
                {/* Powered by enigma */}
                <div className="flex items-center justify-center mb-6 gap-2">
                  <span className="text-white text-3xl">
                    {t.processing.poweredBy}{" "}
                  </span>
                  <span className="bg-gradient-to-r from-primary-purple-500 via-primary-light-blue-500 to-accent-green-500 bg-clip-text text-transparent font-medium text-3xl">
                    enigma
                  </span>
                </div>

                {/* QR Section */}
                {qrCode && (
                  <div className="flex items-stretch justify-between my-10">
                    <div className="flex flex-col justify-between">
                      <div className="grid gap-2">
                        <h2 className="text-6xl text-white">
                          {t.processing.scanQRCode}{" "}
                          <span className="text-saudi-gold">
                            {t.processing.qrCodeHighlight}
                          </span>
                        </h2>
                        <p className="text-white/70 text-5xl">
                          {t.processing.toGetArtwork}
                        </p>
                      </div>
                      {/* Thank you text - positioned under QR text */}
                      <p className="text-white/70 text-2xl mt-auto">
                        {t.processing.thankYouMessage}
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-[80px]">
                      <img
                        src={qrCode}
                        alt="QR Code to download your photo"
                        className="w-80 h-80"
                      />
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Button
                    onClick={handleRetake}
                    variant="saudi-outline"
                    size="large"
                    className="gap-3"
                  >
                    <IoRefreshOutline />
                    {t.processing.retake}
                  </Button>
                  <Button
                    onClick={handleBackToHome}
                    variant="saudi"
                    size="large"
                  >
                    {t.processing.backToHome}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Loading state - with or without partial image */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 rounded-[25px] border-4 border-saudi-gold overflow-hidden bg-[#2a2a2a] relative">
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
                              <div className="w-20 h-20 border-8 border-saudi-gold border-t-saudi-gold/30 border-r-saudi-gold/30 rounded-full animate-spin"></div>
                            </div>
                          </div>
                          <p className="text-white text-2xl font-medium">
                            {imageType === "partial"
                              ? t.processing.refiningImage
                              : t.processing.generatingQR}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Initial loading state with no image yet */
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white/70 text-3xl">
                      {t.processing.processingMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
