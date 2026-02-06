"use client";

import { useAspectRatio } from "@/hooks/useAspectRatio";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { BiArrowBack } from "react-icons/bi";
import { IoCameraOutline } from "react-icons/io5";
import Webcam from "react-webcam";
import { useTranslation } from "@/i18n/useTranslation";

export default function Camera() {
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const { tailwindClass, videoConstraintRatio } = useAspectRatio();
  const { t, isRTL } = useTranslation();

  const takePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setIsCapturing(true);

      // Convert to RGBA format using canvas with error handling
      const img = new window.Image();
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
            error,
          );
          // Fallback to original image
          localStorage.setItem("capturedImage", imageSrc);
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
        cleanup();
        setTimeout(() => {
          router.push("/preview");
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
    width: { ideal: 6000 },
    height: { ideal: 4000 },
    ...(videoConstraintRatio && { aspectRatio: videoConstraintRatio }),
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

        {/* Camera container - centered */}
        <div className="relative w-full max-w-6xl mx-auto flex-1 flex items-center justify-center">
          <div
            className={`rounded-[25px] overflow-hidden border-4 border-saudi-gold w-full ${tailwindClass} relative`}
          >
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/png"
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover transform -scale-x-100 rounded-[25px] overflow-hidden bg-stone-600"
            />

            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-saudi-green animate-pulse border-4 border-saudi-gold rounded-full w-48 h-48 flex items-center justify-center">
                  <div className="text-9xl font-bold text-saudi-gold">
                    {countdownNumber}
                  </div>
                </div>
              </div>
            )}

            {isCapturing && (
              <div className="absolute inset-0 bg-saudi-gold opacity-80 rounded-[25px] flex items-center justify-center">
                <div className="text-2xl font-bold text-saudi-green">
                  {t.camera.captured}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom controls - outside camera container */}
        <div className="w-full max-w-6xl mx-auto grid grid-cols-3 gap-4 py-6 px-6">
          <button
            onClick={() => router.push("/select-style")}
            className="text-saudi-gold text-5xl font-normal flex items-center gap-6"
          >
            <BiArrowBack className={isRTL ? "-scale-x-100" : ""} /> {t.camera.back}
          </button>
          <button
            onClick={startCountdown}
            className="bg-saudi-gold rounded-full p-6 text-saudi-green w-fit mx-auto hover:bg-saudi-gold-dark transition-colors"
          >
            <IoCameraOutline size={90} />
          </button>
          <div></div> {/* Empty div to maintain grid spacing */}
        </div>
      </div>
    </div>
  );
}
