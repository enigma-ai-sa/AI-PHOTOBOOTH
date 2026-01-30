"use client";

import Button from "@/components/UI/Button";
import PrintCopiesModal from "@/components/PrintCopiesModal";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoRefreshOutline } from "react-icons/io5";
// import { IoPrint } from "react-icons/io5"; // Commented out - print feature disabled

// Network-aware timeout detection for slow WiFi
const getNetworkAwareTimeout = (): number => {
  if (typeof navigator !== "undefined" && "connection" in navigator) {
    const connection = (navigator as Navigator & { 
      connection?: { effectiveType?: string; downlink?: number } 
    }).connection;
    
    if (connection?.effectiveType) {
      // Adjust timeout based on connection type
      switch (connection.effectiveType) {
        case "slow-2g":
          return 180000; // 3 minutes for very slow connections
        case "2g":
          return 150000; // 2.5 minutes
        case "3g":
          return 120000; // 2 minutes
        default:
          return 90000; // 1.5 minutes for 4g/wifi
      }
    }
    
    // If we have downlink info, adjust accordingly
    if (connection?.downlink && connection.downlink < 1) {
      return 180000; // 3 minutes for < 1 Mbps
    }
  }
  return 90000; // Default 90 seconds
};

// Exponential backoff delay calculation
const getRetryDelay = (attempt: number): number => {
  // Exponential backoff: 2s, 4s, 8s, capped at 15s
  return Math.min(2000 * Math.pow(2, attempt), 15000);
};

export default function Processing() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Creating your photo...");
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
    
    // Update loading message based on attempt
    if (attempt > 0) {
      setLoadingMessage(`Retrying... (attempt ${attempt + 1}/4)`);
    } else {
      setLoadingMessage("Creating your photo...");
    }

    try {
      const controller = new AbortController();
      // Use network-aware timeout
      const timeout = getNetworkAwareTimeout();
      console.log(`Using timeout: ${timeout}ms based on network conditions`);
      const timeoutId = setTimeout(() => controller.abort(), timeout);

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
      
      // Set the S3 URL - image will load directly from S3/CDN
      setGeneratedImage(data.imageUrl);
      setQrCode(data.qrCodeUrl);
      
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          // Increased max retries to 4 for slow networks
          if (attempt < 3) {
            const delay = getRetryDelay(attempt);
            setError(`Request timed out. Retrying in ${delay/1000}s... (${attempt + 1}/4)`);
            setTimeout(
              () => generateImage(imageData, attempt + 1, selectedOption),
              delay
            );
            return;
          } else {
            setError("Request timed out after 4 attempts. Please check your connection and try again.");
          }
        } else if (err.message.includes("Failed to fetch") || err.message.includes("network")) {
          // Network error - retry with backoff
          if (attempt < 3) {
            const delay = getRetryDelay(attempt);
            setError(`Network error. Retrying in ${delay/1000}s... (${attempt + 1}/4)`);
            setTimeout(
              () => generateImage(imageData, attempt + 1, selectedOption),
              delay
            );
            return;
          } else {
            setError("Network error after 4 attempts. Please check your WiFi connection.");
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
    <div className="h-dvh w-full max-w-[1080px] mx-auto bg-white p-3 sm:p-4 lg:p-6 overflow-hidden flex flex-col aspect-[9/16]">
      {isLoading ? (
        /* Loading State - Full Screen */
        <div className="flex-1 rounded-2xl sm:rounded-3xl lg:rounded-[40px] overflow-hidden border-4 sm:border-6 lg:border-8 border-gradient-green-end bg-stone-600 flex items-center justify-center">
          <div className="text-center z-10 px-4">
            <div className="mb-6 sm:mb-8 lg:mb-10">
              <div className="inline-block relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 border-8 sm:border-12 lg:border-[16px] border-white border-t-gray-400 border-r-gray-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 border-8 sm:border-12 lg:border-[16px] border-transparent border-r-white rounded-full animate-spin animation-delay-150"></div>
              </div>
            </div>
            <p className="text-white text-xl sm:text-2xl lg:text-3xl font-medium">
              {loadingMessage}
            </p>
            {retryCount > 0 && (
              <p className="text-gray-300 text-sm sm:text-base mt-2">
                Slow connection detected - please wait...
              </p>
            )}
          </div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="flex-1 rounded-2xl sm:rounded-3xl lg:rounded-[40px] overflow-hidden border-4 sm:border-6 lg:border-8 border-gradient-green-end bg-stone-600 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-400 mb-4 sm:mb-6 text-lg sm:text-xl lg:text-2xl">{error}</p>
            <Button
              onClick={() => generateImage(capturedImage!, 0)}
              variant="primary"
              size="large"
              className="!py-4 sm:!py-5 lg:!py-6 !text-lg sm:!text-xl lg:!text-2xl"
              disabled={isLoading}
            >
              {isLoading ? "Retrying..." : "Retry"}
            </Button>
          </div>
        </div>
      ) : generatedImage ? (
        /* Success State - Image + QR Code + Buttons (Portrait Layout) */
        <div className="flex-1 flex flex-col gap-3 sm:gap-4 overflow-auto">
          {/* Generated Image - Sized to content */}
          <div className="rounded-2xl sm:rounded-3xl lg:rounded-[40px] overflow-hidden border-4 sm:border-6 lg:border-8 border-gradient-green-end w-fit mx-auto">
            <img
              src={generatedImage}
              alt="AI generated photo"
              className="max-w-full h-auto object-contain"
              style={{ maxHeight: "calc(100dvh - 280px)" }}
              onError={() => {
                console.error("Failed to load generated image:", generatedImage);
                setError("Failed to load the generated image. Please try again.");
                setGeneratedImage(null);
              }}
              onLoad={() => {
                console.log("Generated image loaded successfully from S3");
              }}
            />
          </div>

          {/* Bottom Section - QR Code and Button stacked vertically */}
          <div className="bg-gradient-light-green-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-5 flex-shrink-0">
            {/* QR Code Section */}
            {qrCode && (
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-lg flex-shrink-0">
                  <img
                    src={qrCode}
                    alt="QR Code to download your photo"
                    className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40"
                  />
                </div>
                <div className="text-gradient-green-end">
                  <p className="text-xl sm:text-2xl lg:text-3xl font-medium mb-1">Scan to Download</p>
                  <p className="text-sm sm:text-base lg:text-lg opacity-80">Save your photo to your phone</p>
                </div>
              </div>
            )}

            {/* Retake Button */}
            <Button
              onClick={handleStartOver}
              variant="tertiary"
              size="large"
              className="w-full gap-2 sm:gap-3 !py-3 sm:!py-4 lg:!py-5 !text-lg sm:!text-xl lg:!text-2xl"
            >
              <IoRefreshOutline className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
              Retake Photo
            </Button>

            {/* Powered by text */}
            <p className="text-base sm:text-lg font-normal text-center mt-2 sm:mt-3">
              <span className="text-black">Powered by </span>
              <span className="bg-gradient-to-r from-primary-purple-500 via-primary-light-blue-500 to-accent-green-500 bg-clip-text text-transparent font-medium">
                enigma
              </span>
            </p>
          </div>
        </div>
      ) : (
        /* Waiting State */
        <div className="flex-1 rounded-2xl sm:rounded-3xl lg:rounded-[40px] overflow-hidden border-4 sm:border-6 lg:border-8 border-gradient-green-end bg-stone-600 flex items-center justify-center">
          <p className="text-gray-300 text-xl sm:text-2xl">Waiting...</p>
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
