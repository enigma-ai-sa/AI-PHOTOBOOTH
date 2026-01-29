"use client";

import Button from "@/components/UI/Button";
import PrintCopiesModal from "@/components/PrintCopiesModal";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoRefreshOutline } from "react-icons/io5";
// import { IoPrint } from "react-icons/io5"; // Commented out - print feature disabled

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

        await fetch("http://127.0.0.1:8000/print", {
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
    <div className="h-screen bg-white p-12 overflow-hidden flex w-full flex-col">
      {isLoading ? (
        /* Loading State - Full Screen */
        <div className="flex-1 rounded-[40px] overflow-hidden border-8 border-gradient-green-end bg-stone-600 flex items-center justify-center">
          <div className="text-center z-10">
            <div className="mb-12">
              <div className="inline-block relative">
                <div className="w-64 h-64 border-[20px] border-white border-t-gray-400 border-r-gray-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-64 h-64 border-[20px] border-transparent border-r-white rounded-full animate-spin animation-delay-150"></div>
              </div>
            </div>
            <p className="text-white text-5xl font-medium">
              {retryCount > 0
                ? `Your photo is being created... (${retryCount + 1}/3)`
                : "Your photo is being created..."}
            </p>
          </div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="flex-1 rounded-[40px] overflow-hidden border-8 border-gradient-green-end bg-stone-600 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-400 mb-8 text-4xl">{error}</p>
            <Button
              onClick={() => generateImage(capturedImage!, 0)}
              variant="primary"
              size="large"
              className="!py-12 !text-4xl"
              disabled={isLoading}
            >
              {isLoading ? "Retrying..." : "Retry"}
            </Button>
          </div>
        </div>
      ) : generatedImage ? (
        /* Success State - Image + QR Code + Buttons */
        <div className="flex-1 flex flex-col gap-8 overflow-hidden">
          {/* Generated Image - Takes priority space */}
          <div className="rounded-[40px] overflow-hidden border-8 border-gradient-green-end flex-shrink-0">
            <img
              src={generatedImage}
              alt="AI generated photo"
              className="w-full h-auto object-contain"
              onError={() => {
                console.error("Failed to load generated image:", generatedImage);
                setError("Failed to load the generated image. Please try again.");
              }}
              onLoad={() => {
                console.log("Generated image loaded successfully");
              }}
            />
          </div>

          {/* Bottom Section - Button on left, QR on right */}
          <div className="bg-gradient-light-green-white rounded-[40px] p-8 flex-shrink-0">
            <p className="text-5xl font-normal text-center mb-6">
              <span className="text-black">Powered by </span>
              <span className="bg-gradient-to-r from-primary-purple-500 via-primary-light-blue-500 to-accent-green-500 bg-clip-text text-transparent font-medium">
                enigma
              </span>
            </p>
            <div className="flex items-center justify-between gap-12">
              {/* Retake Button - Left */}
              <Button
                onClick={handleStartOver}
                variant="tertiary"
                size="large"
                className="gap-8 !py-16 !px-16 !text-6xl"
              >
                <IoRefreshOutline size={80} />
                Retake
              </Button>

              {/* Print Button - Commented out */}
              {/* <Button
                onClick={handlePrint}
                variant="primary"
                size="large"
                className="gap-6 !py-14 !text-5xl"
              >
                <IoPrint size={60} />
                Print Photo
              </Button> */}

              {/* QR Code - Right */}
              {qrCode && (
                <div className="flex items-center gap-16">
                  <div className="text-gradient-green-end text-right">
                    <p className="text-7xl font-medium mb-4">Scan to Download</p>
                    <p className="text-4xl opacity-80">Save your photo to your phone</p>
                  </div>
                  <div className="bg-white rounded-3xl p-8 shadow-xl">
                    <img
                      src={qrCode}
                      alt="QR Code to download your photo"
                      className="w-[450px] h-[450px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Waiting State */
        <div className="flex-1 rounded-[40px] overflow-hidden border-8 border-gradient-green-end bg-stone-600 flex items-center justify-center">
          <p className="text-gray-300 text-4xl">Waiting...</p>
        </div>
      )}

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
