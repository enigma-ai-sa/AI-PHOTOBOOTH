"use client";

import { useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { IoCameraOutline } from "react-icons/io5";
import { BiArrowBack } from "react-icons/bi";

export default function Camera() {
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();
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
        } catch (error) {
          console.warn(
            "Canvas processing failed, using original image:",
            error
          );
          // Fallback to original image
          localStorage.setItem("capturedImage", imageSrc);
        }

        cleanup();
        setTimeout(() => {
          router.push("/processing");
        }, 500);
      };

      img.onload = processImage;

      img.onerror = () => {
        console.warn("Image loading failed, using original image");
        localStorage.setItem("capturedImage", imageSrc);
        cleanup();
        setTimeout(() => {
          router.push("/processing");
        }, 500);
      };

      // Set timeout protection (5 seconds)
      timeoutId = setTimeout(() => {
        console.warn("Image processing timeout, using original image");
        localStorage.setItem("capturedImage", imageSrc);
        cleanup();
        router.push("/processing");
      }, 10000);

      img.src = imageSrc;
    }
  }, [router]);

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
    <div className="h-screen custom-brand-gradient grid grid-rows-[auto_1fr_auto] py-20 px-10 gap-20 overflow-hidden">
      <Logo text={"Get ready to have your photo taken!"} />

      <div className="relative w-full mx-auto flex-1 flex flex-col">
        <p className="text-lg text-stone-300 text-center mb-4">
          Position yourself in the frame
        </p>
        <div className="rounded-2xl overflow-hidden border-4 border-purple-600 shadow-2xl shadow-purple-900/50 w-full flex-1">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/png"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover transform -scale-x-100"
            style={{ height: "100%" }}
          />
        </div>

        {isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary-light-blue-500 animate-pulse border-14 border-light-blue-600 bg-opacity-50 rounded-full w-32 h-32 flex items-center justify-center">
              <div className="text-6xl font-bold text-white">
                {countdownNumber}
              </div>
            </div>
          </div>
        )}

        {isCapturing && (
          <div className="absolute inset-0 bg-white opacity-80 rounded-2xl flex items-center justify-center">
            <div className="text-2xl font-bold text-purple-800">Captured!</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => router.push("/")}
          className="text-white text-4xl flex items-center gap-2"
        >
          <BiArrowBack /> Back
        </button>

        <div className="flex flex-col items-center justify-center">
          <button className="bg-white rounded-full p-8 text-primary-light-blue-700 w-fit mx-auto">
            <IoCameraOutline size={70} onClick={startCountdown} />
          </button>
          <p className="text-lg  text-center mt-6">
            Click and take your picture
          </p>
        </div>
      </div>
    </div>
  );
}
