"use client";

import Button from "@/components/UI/Button";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

export default function Processing() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
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

  const handleRetry = () => {
    // Get endpoint from localStorage to navigate back to camera with the same settings
    const endpoint = localStorage.getItem("selectedEndpoint");
    if (endpoint) {
      router.push(`/camera?endpoint=${endpoint}`);
    } else {
      router.push("/camera");
    }
  };

  const handleHome = () => {
    router.push("/");
  };

  return (
    <div className="h-dvh p-4 md:p-8 !pt-0 bg-forest-green bg-[url('/patterns/background.svg')] bg-repeat-round">
      <div className="w-full h-full py-6 rounded-2xl flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 gap-4">
          <div className="rounded-[50px] overflow-hidden border-[15px] border-cream w-full flex-1">
            {isLoading ? (
              <div className="relative w-full h-full bg-stone-600 flex items-center justify-center overflow-hidden">
                {/* Main loading content */}
                <div className="text-center z-10">
                  <div className="mb-6">
                    <div className="inline-block relative">
                      <div className="w-45 h-45 border-15 border-gold border-t-cream border-r-cream rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-45 h-45 border-15 border-transparent border-r-gold rounded-full animate-spin animation-delay-150"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-cream text-4xl font-medium">
                      {retryCount > 0
                        ? `جارٍ إنشاء صورتك... (${retryCount + 1}/3)`
                        : "جارٍ إنشاء صورتك..."}
                    </p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="relative w-full h-full bg-stone-600 flex items-center justify-center p-4 mx-auto">
                <div className="text-center mx-auto">
                  <p className="text-cream mb-4 text-2xl">{error}</p>
                  <Button
                    onClick={() => generateImage(capturedImage!, 0)}
                    variant="primary"
                    size="medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "جارٍ إعادة المحاولة..." : "إعادة المحاولة"}
                  </Button>
                </div>
              </div>
            ) : generatedImage ? (
              <div className="w-full h-full flex flex-col relative">
                {/* QR Code Section - Top Right Corner */}
                {qrCode && (
                  <div className="absolute top-10 right-4 z-10">
                    <div className="bg-white rounded-[5rem] border-4 border-cream shadow-lg flex flex-col items-center  overflow-hidden p-4">
                      <img
                        src={qrCode}
                        alt="QR Code to download your photo"
                        className="w-64 h-64"
                      />
                      <p className="text-xl font-medium text-gray-700 text-center dir-rtl">
                        امسح رمز QR لتحميل صورتك
                      </p>
                    </div>
                  </div>
                )}

                {/* Image Section - Full Container */}
                <div className="flex-1 min-h-0 rounded-xl overflow-hidden">
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
              </div>
            ) : (
              <div className="relative w-full h-full bg-stone-600 flex items-center justify-center">
                <p className="text-cream text-lg">انتظر من فضلك...</p>
              </div>
            )}
          </div>

          {/* Enigma Badge - Below Container */}
          {generatedImage && (
            <div className="flex justify-center -mt-8">
              <div className="bg-cream px-16 py-6 rounded-b-[2rem]">
                <p className="text-4xl font-normal text-center whitespace-nowrap">
                  <span className="bg-gradient-to-r from-primary-purple-500 via-primary-light-blue-500 to-accent-green-500 bg-clip-text text-transparent font-medium">
                    enigma
                  </span>
                  <span className="text-primary-purple-600">من صنع </span>
                </p>
              </div>
            </div>
          )}

          {/* Buttons Section - Outside Border */}
          {generatedImage && (
            <div className="py-6 px-6">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleRetry}
                  variant="tertiary"
                  size="large"
                  className="gap-6"
                >
                  إعادة المحاولة
                  <FiRefreshCw size={50} />
                </Button>
                <Button
                  onClick={handleHome}
                  variant="primary"
                  size="large"
                  className="gap-6"
                >
                  العودة للقائمة الرئيسية
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
