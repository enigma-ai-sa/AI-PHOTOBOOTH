"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { IoCameraOutline } from "react-icons/io5";
import { LuArrowLeft } from "react-icons/lu";
import Webcam from "react-webcam";
import Logo from "@/components/Logo";

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
    aspectRatio: 3 / 2, // Canon EOS R50 photo aspect ratio
  };

  return (
    <div className="h-dvh p-4 md:p-8 !pt-0 bg-forest-green bg-[url('/patterns/background.svg')] bg-repeat-round">
      <div className="w-full h-full py-6 rounded-2xl flex flex-col">
        {/* Logo */}
        <div className="flex justify-end">
          <Logo width={150} height={80} className="" />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          {/* Title */}
          <h2 className="text-8xl text-cream font-medium text-center py-10">
            جاهز للتصوير؟ 😄
          </h2>

          {/* Camera container - centered */}
          <div className="relative w-full flex-1 flex items-center justify-center">
            <div className="rounded-[50px] overflow-hidden border-[15px] border-gold w-full h-full relative">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/png"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover transform -scale-x-100 rounded-[50px] overflow-hidden bg-stone-600"
              />

              {isCountingDown && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-gold animate-pulse border-8 border-cream rounded-full w-62 h-62 flex items-center justify-center">
                    <div className="text-9xl font-bold text-forest-green leading-none">
                      {countdownNumber}
                    </div>
                  </div>
                </div>
              )}

              {isCapturing && (
                <div className="absolute inset-0 bg-gold opacity-80 rounded-[50px] flex items-center justify-center">
                  <div className="text-2xl font-bold text-forest-green">
                    Captured!
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom controls - outside camera container */}
          <div className="w-full grid grid-cols-3 gap-4 py-6 px-6 flex-shrink-0">
            <button
              onClick={() => router.push("/select-style")}
              className="text-cream text-5xl font-normal flex items-center gap-6"
            >
              <LuArrowLeft /> رجوع
            </button>
            <button className="bg-gold rounded-full p-8 text-forest-green w-fit mx-auto">
              <IoCameraOutline size={90} onClick={startCountdown} />
            </button>
            <div></div> {/* Empty div to maintain grid spacing */}
          </div>
        </div>
      </div>
    </div>
  );
}
