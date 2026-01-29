"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { BiArrowBack } from "react-icons/bi";
import { IoCameraOutline } from "react-icons/io5";
import Webcam from "react-webcam";

export default function Camera() {
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);

  const takePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot({
      width: 1920,
      height: 1280,
    });
    
    if (imageSrc) {
      setIsCapturing(true);
      
      try {
        // Save the captured image directly
        localStorage.setItem("capturedImage", imageSrc);
        console.log("Image saved to localStorage, size:", imageSrc.length);
        
        // Navigate to preview after a brief delay to show "Captured!" message
        setTimeout(() => {
          setIsCapturing(false);
          router.push("/preview");
        }, 800);
      } catch (error) {
        console.error("Failed to save image:", error);
        setIsCapturing(false);
        alert("Failed to capture image. Please try again.");
      }
    } else {
      console.error("No image captured from webcam");
      alert("Failed to capture image. Please ensure camera is working.");
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
    width: { ideal: 1920 },
    height: { ideal: 1280 },
    aspectRatio: 3 / 2,
  };

  
  return (
    <div className="h-screen bg-white p-12 overflow-hidden flex w-full flex-col">
      {/* Camera container - centered */}
      <div className="relative w-full mx-auto flex-1 flex items-center justify-center">
        <div className="rounded-[40px] overflow-hidden border-8 border-gradient-green-end w-full aspect-[3/2] relative">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover transform -scale-x-100 rounded-[40px] overflow-hidden bg-stone-600"
          />

          {isCountingDown && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gradient-green-end animate-pulse border-gradient-green-end border-14 border-bg-opacity-50 rounded-full w-80 h-80 flex items-center justify-center">
                <div className="text-[12rem] font-bold text-white">
                  {countdownNumber}
                </div>
              </div>
            </div>
          )}

          {isCapturing && (
            <div className="absolute inset-0 bg-white opacity-80 rounded-[40px] flex items-center justify-center">
              <div className="text-5xl font-bold text-purple-800">Captured!</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls - outside camera container */}
      <div className="w-full mx-auto grid grid-cols-3 gap-8 py-12 px-8">
        <button
          onClick={() => router.push("/select-style")}
          className="text-gradient-green-end text-6xl font-normal flex items-center gap-8"
        >
          <BiArrowBack size={70} /> Back
        </button>
        <button 
          onClick={startCountdown}
          className="bg-gradient-green-end rounded-full p-12 text-white w-fit mx-auto hover:scale-105 transition-transform"
        >
          <IoCameraOutline size={140} />
        </button>
        <div></div> {/* Empty div to maintain grid spacing */}
      </div>
    </div>
  );
}
