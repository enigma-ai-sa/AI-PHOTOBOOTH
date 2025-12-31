"use client";

import Button from "@/components/UI/Button";
import PrintCopiesModal from "@/components/PrintCopiesModal";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoPrint, IoRefreshOutline } from "react-icons/io5";

export default function Processing() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printCopies, setPrintCopies] = useState(1);
  const hasStartedGenerationRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const image = localStorage.getItem("capturedImage");
    const option = localStorage.getItem("selectedOption");

    if (!image || !option) {
      router.push("/camera");
      return;
    }

    setCapturedImage(image);

    // Only start generation once using ref to prevent race conditions
    if (!hasStartedGenerationRef.current && !generatedImage) {
      hasStartedGenerationRef.current = true;
      generateImage(image, 0, option);
    }
  }, [generatedImage, router]);

  const generateImage = async (
    imageData: string,
    attempt = 0,
    option?: string
  ) => {
    // Prevent multiple simultaneous calls
    if (isLoading) {
      console.log("Generation already in progress, skipping...");
      return;
    }

    const selectedOption = option || localStorage.getItem("selectedOption");
    if (!selectedOption) {
      setError("No option selected. Please select a style.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRetryCount(attempt);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageData,
          option: selectedOption,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.imageUrl) {
        throw new Error("No image URL received from server");
      }
      console.log("Received image URL:", data.imageUrl);
      console.log("Received QR code URL:", data.qrCodeUrl);
      console.log(
        "Current generatedImage state before setting:",
        generatedImage
      );
      setGeneratedImage(data.imageUrl);
      setQrCode(data.qrCodeUrl);
      console.log("Set generatedImage state to:", data.imageUrl);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          if (attempt < 2) {
            setError(`Request timed out. Retrying... (${attempt + 1}/3)`);
            setTimeout(
              () => generateImage(imageData, attempt + 1, selectedOption),
              2000
            );
            return;
          } else {
            setError("Request timed out after 3 attempts. Please try again.");
          }
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    router.push("/select-style");
  };

  const handlePrint = () => {
    if (!generatedImage) return;
    setShowPrintModal(true);
  };

  const handleConfirmPrint = async () => {
    if (!generatedImage) return;

    try {
      // Fetch the image once
      const response = await fetch(generatedImage);
      const blob = await response.blob();

      // Print multiple copies by making multiple API calls
      for (let i = 0; i < printCopies; i++) {
        const formData = new FormData();
        formData.append("file", blob, "generated_image.png");

        await fetch("http://127.0.0.1:5000/print", {
          method: "POST",
          body: formData,
        });
      }
    } catch (error) {
      console.error("Print failed:", error);
    }

    setShowPrintModal(false);
    router.push("/thank-you");
  };

  const handleIncrementCopies = () => {
    setPrintCopies((prev) => Math.min(prev + 1, 10));
  };

  const handleDecrementCopies = () => {
    setPrintCopies((prev) => Math.max(prev - 1, 1));
  };

  const handleCancelPrint = () => {
    setShowPrintModal(false);
    setPrintCopies(1);
  };

  return (
    <div className="h-screen bg-white p-8 overflow-hidden flex w-full flex-col">
      <div className="relative w-full h-full mx-auto flex-1 flex flex-col">
        <div className="rounded-3xl overflow-hidden border-4 border-gradient-blue-end w-full flex-1">
          {isLoading ? (
            <div className="relative w-full h-full bg-stone-600 flex items-center justify-center overflow-hidden">
              {/* Main loading content */}
              <div className="text-center z-10">
                <div className="mb-6">
                  <div className="inline-block relative">
                    <div className="w-45 h-45 border-15 border-white border-t-gray-400 border-r-gray-400 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-45 h-45 border-15 border-transparent border-r-white rounded-full animate-spin animation-delay-150"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-white text-4xl font-medium">
                    {retryCount > 0
                      ? `Your New Year's photo is being created... (${
                          retryCount + 1
                        }/3)`
                      : "Your New Year's photo is being created..."}
                  </p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="relative w-full h-full bg-stone-600 flex items-center justify-center p-4 mx-auto">
              <div className="text-center mx-auto">
                <p className="text-red-400 mb-4 text-2xl">{error}</p>
                <Button
                  onClick={() => generateImage(capturedImage!, 0)}
                  variant="primary"
                  size="medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </Button>
              </div>
            </div>
          ) : generatedImage ? (
            <div className="relative w-full h-full flex flex-col">
              <div className="flex-1 relative">
                <img
                  src={generatedImage}
                  alt="AI generated photo"
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.error(
                      "Failed to load generated image:",
                      generatedImage
                    );
                    setError(
                      "Failed to load the generated image. Please try again."
                    );
                  }}
                  onLoad={() => {
                    console.log("Generated image loaded successfully");
                  }}
                />
              </div>
              {qrCode && (
                <div className="absolute top-4 right-4 bg-white p-3 rounded-xl shadow-lg flex flex-col items-center gap-2">
                  <img
                    src={qrCode}
                    alt="QR Code to download your photo"
                    className="w-52 h-52"
                  />
                  <p className="text-xs font-medium text-gray-700 text-center">
                    Scan to download
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full bg-stone-600 flex items-center justify-center">
              <p className="text-gray-300 text-lg">Waiting...</p>
            </div>
          )}
        </div>

        {generatedImage && (
          <div className="absolute bottom-8 left-8 right-8 z-10 space-y-4 bg-gradient-to-t from-black/30 via-black/10 to-transparent py-10 px-6 rounded-3xl backdrop-blur-sm bg-white/90">
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
              >
                <IoPrint />
                Print Photo
              </Button>
            </div>
          </div>
        )}
      </div>

      <PrintCopiesModal
        isOpen={showPrintModal}
        copies={printCopies}
        onIncrement={handleIncrementCopies}
        onDecrement={handleDecrementCopies}
        onConfirm={handleConfirmPrint}
        onCancel={handleCancelPrint}
      />
    </div>
  );
}
