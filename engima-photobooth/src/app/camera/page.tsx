"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { BiArrowBack } from "react-icons/bi";
import { IoCameraOutline } from "react-icons/io5";
import Webcam from "react-webcam";

export default function Camera() {
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const endpoint = searchParams.get("endpoint");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);

  const takePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setIsCapturing(true);

      // Convert to RGBA format using canvas with error handling
      const img = new Image();
      let timeoutId: NodeJS.Timeout; // eslint-disable-line prefer-const

      const cleanup = () => {
        clearTimeout(timeoutId);
        setIsCapturing(false);
      };

      const processImage = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            throw new Error("Failed to get canvas context");
          }

          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image on canvas (this ensures RGBA format)
          ctx.drawImage(img, 0, 0);

          // Get RGBA format image data
          const rgbaImageSrc = canvas.toDataURL("image/png");
          localStorage.setItem("capturedImage", rgbaImageSrc);
          // Store the selected endpoint
          if (endpoint) {
            localStorage.setItem("selectedEndpoint", endpoint);
          }
        } catch (error) {
          console.warn(
            "Canvas processing failed, using original image:",
            error
          );
          // Fallback to original image
          localStorage.setItem("capturedImage", imageSrc);
          if (endpoint) {
            localStorage.setItem("selectedEndpoint", endpoint);
          }
        }

        cleanup();
        setTimeout(() => {
          router.push("/preview");
        }, 500);
      };

      img.onload = processImage;

      img.onerror = () => {
        console.warn("Image loading failed, using original image");
        localStorage.setItem("capturedImage", imageSrc);
        if (endpoint) {
          localStorage.setItem("selectedEndpoint", endpoint);
        }
        cleanup();
        setTimeout(() => {
          router.push("/preview");
        }, 500);
      };

      // Set timeout protection (5 seconds)
      timeoutId = setTimeout(() => {
        console.warn("Image processing timeout, using original image");
        localStorage.setItem("capturedImage", imageSrc);
        if (endpoint) {
          localStorage.setItem("selectedEndpoint", endpoint);
        }
        cleanup();
        router.push("/processing");
      }, 10000);

      img.src = imageSrc;
    }
  }, [router, endpoint]);

  const startCountdown = useCallback(() => {
    if (isCountingDown || isCapturing) return;

    setIsCountingDown(true);
    setCountdownNumber(3);

    const countdownInterval = setInterval(() => {
      setCountdownNumber((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsCountingDown(false);
          takePhoto();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isCountingDown, isCapturing, takePhoto]);

  const videoConstraints = {
    facingMode: "user",
  };

  return (
    <div className="h-screen bg-white p-8 overflow-hidden flex w-full flex-col">
      <div className="relative w-full h-full mx-auto flex-1 flex flex-col">
        <div className="rounded-3xl overflow-hidden border-4 border-gradient-blue-end w-full flex-1">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/png"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover transform -scale-x-100 rounded-3xl overflow-hidden bg-stone-600"
            style={{ height: "100%" }}
          />
        </div>

        {isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-gradient-blue-end animate-pulse border-gradieny-blue-endborder-14 border-bg-opacity-50 rounded-full w-62 h-62 flex items-center justify-center">
              <div className="text-9xl font-bold text-white">
                {countdownNumber}
              </div>
            </div>
          </div>
        )}

        {isCapturing && (
          <div className="absolute inset-0 bg-white opacity-80 rounded-3xl flex items-center justify-center">
            <div className="text-2xl font-bold text-purple-800">Captured!</div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 absolute bottom-8 left-8 right-8 z-10 bg-gradient-to-t from-black/30 via-black/10 to-transparent py-10 px-6 rounded-3xl backdrop-blur-sm bg-white/90">
          <button
            onClick={() => router.push("/select-style")}
            className="text-gradient-blue-end text-5xl font-normal flex items-center gap-6"
          >
            <BiArrowBack /> Back
          </button>
          <button className="bg-gradient-blue-end rounded-full p-8 text-white w-fit mx-auto">
            <IoCameraOutline size={90} onClick={startCountdown} />
          </button>
        </div>
      </div>
    </div>
  );
}
