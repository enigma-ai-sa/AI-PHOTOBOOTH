"use client";

import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoHome } from "react-icons/go";
import { IoPrintOutline } from "react-icons/io5";

export default function Processing() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const image = localStorage.getItem("capturedImage");
    if (!image) {
      router.push("/camera");
      return;
    }

    setCapturedImage(image);

    // Only start generation once
    if (!hasStartedGeneration && !generatedImage && !isLoading) {
      setHasStartedGeneration(true);
      const startGeneration = async () => {
        await generateImage(image);
      };
      startGeneration();
    }
  }, [hasStartedGeneration, generatedImage, isLoading, router]);

  const generateImage = async (imageData: string, attempt = 0) => {
    // Prevent multiple simultaneous calls
    if (isLoading) {
      console.log("Generation already in progress, skipping...");
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
        body: JSON.stringify({ image: imageData }),
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
      console.log(
        "Current generatedImage state before setting:",
        generatedImage
      );
      setGeneratedImage(data.imageUrl);
      console.log("Set generatedImage state to:", data.imageUrl);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          if (attempt < 2) {
            setError(`Request timed out. Retrying... (${attempt + 1}/3)`);
            setTimeout(() => generateImage(imageData, attempt + 1), 2000);
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
    localStorage.removeItem("capturedImage");
    router.push("/");
  };

  const handlePrint = async () => {
    if (!generatedImage) return;

    setIsPrinting(true);
    setPrintSuccess(false);
    setPrintError(null);

    try {
      // Convert base64 to blob
      const base64Data = generatedImage.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      // Create FormData and send to Flask backend
      const formData = new FormData();
      formData.append("file", blob, "generated_image.png");

      const BACKEND_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";

      const response = await fetch(`${BACKEND_URL}/print`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Print failed");
      }

      setPrintSuccess(true);
      setTimeout(() => {
        setPrintSuccess(false);
      }, 5000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to print";
      setPrintError(errorMessage);
      setTimeout(() => {
        setPrintError(null);
      }, 5000);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="h-screen custom-brand-gradient grid grid-rows-[auto_1fr_auto] py-20 px-10 gap-20 overflow-hidden">
      <Logo
        text={
          generatedImage
            ? "Your photo has been generated!"
            : "Generating your photo..."
        }
      />

      <div className="flex flex-col items-center gap-8 w-full flex-1 justify-center">
        {/* Polaroid-style container */}
        <div
          className="bg-white p-8 pb-12 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300 flex flex-col rounded-4xl"
          style={{ width: "fit-content", maxWidth: "95vw" }}
        >
          <div
            className="bg-stone-600 flex items-center justify-center border-2 border-gray-300 overflow-hidden"
            style={{ width: 800, height: 800 }}
          >
            {isLoading ? (
              <div className="relative w-full h-full bg-primary-purple-600 flex items-center justify-center overflow-hidden">
                {/* Main loading content */}
                <div className="text-center z-10">
                  <div className="mb-6">
                    <div className="inline-block relative">
                      <div className="w-45 h-45 border-15 border-white border-t-primary-purple-400 border-r-primary-purple-400 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-45 h-45 border-15 border-transparent border-r-pwhite rounded-full animate-spin animation-delay-150 r"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-white text-2xl font-medium">
                      {retryCount > 0
                        ? `Creating The AI Image... (${retryCount + 1}/3)`
                        : "Creating The AI Image..."}
                    </p>

                    <p className="text-purple-200 text-lg mt-3">
                      Please wait just a few seconds.
                    </p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="text-center p-4">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => generateImage(capturedImage!, 0)}
                  className="bg-primary-purple-500 hover:bg-purple-700 text-white px-4 py-2 rounded"
                  disabled={isLoading}
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </button>
              </div>
            ) : generatedImage ? (
              <div>
                <img
                  src={generatedImage}
                  alt="AI generated photo"
                  className="w-full h-full object-contain transform -scale-x-100"
                  style={{ width: "100%", height: "100%" }}
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
            ) : (
              <p className="text-purple-300 text-lg">Waiting...</p>
            )}
          </div>

          {/* Polaroid caption area */}
          <div className="mt-4 text-center">
            <p className="text-black font-semibold text-5xl italic">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
            </p>
            <p className="text-xl mt-1">
              <span className="text-gray-500">Powered by </span>
              <span className="bg-gradient-to-r from-primary-purple-500  via-primary-light-blue-500 to-accent-green-500 bg-clip-text text-transparent font-semibold">
                Enigma
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {generatedImage && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="text-white bg-primary-purple-500 hover:bg-primary-purple-600 disabled:opacity-50 disabled:cursor-not-allowed py-10 px-8 rounded-3xl text-4xl shadow-purple-900/50 text-center flex items-center gap-4 justify-center transition-all"
              >
                <IoPrintOutline />
                {isPrinting ? "Printing..." : "Print Photo"}
              </button>
              <button
                onClick={handleStartOver}
                className="text-primary-purple-500 bg-white hover:bg-gray-100 py-10 px-8 rounded-3xl text-4xl shadow-purple-900/50 text-center flex items-center gap-4 justify-center transition-all"
              >
                <GoHome />
                Home Screen
              </button>
            </div>
            {printSuccess && (
              <div className="text-center py-4 px-6 bg-green-500 text-white rounded-2xl text-2xl font-semibold">
                ✓ Print sent to printer successfully!
              </div>
            )}
            {printError && (
              <div className="text-center py-4 px-6 bg-red-500 text-white rounded-2xl text-2xl font-semibold">
                ✗ Print error: {printError}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
