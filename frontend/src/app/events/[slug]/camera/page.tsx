"use client"

import { useRouter, useParams } from "next/navigation"
import { useCallback, useRef, useState } from "react"
import { BiArrowBack } from "react-icons/bi"
import { IoCameraOutline } from "react-icons/io5"
import Webcam from "react-webcam"

export default function EventCamera() {
  const webcamRef = useRef<Webcam>(null)
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const [isCapturing, setIsCapturing] = useState(false)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [countdownNumber, setCountdownNumber] = useState(3)

  const takePhoto = useCallback(() => {
    // Capture at 3:4 aspect ratio for portrait (1080x1440)
    const imageSrc = webcamRef.current?.getScreenshot({
      width: 1080,
      height: 1440,
    })
    
    if (imageSrc) {
      setIsCapturing(true)
      
      try {
        // Save the captured image directly
        localStorage.setItem("capturedImage", imageSrc)
        console.log("Image saved to localStorage, size:", imageSrc.length)
        
        // Navigate to preview after a brief delay to show "Captured!" message
        setTimeout(() => {
          setIsCapturing(false)
          router.push(`/events/${slug}/preview`)
        }, 800)
      } catch (error) {
        console.error("Failed to save image:", error)
        setIsCapturing(false)
        alert("Failed to capture image. Please try again.")
      }
    } else {
      console.error("No image captured from webcam")
      alert("Failed to capture image. Please ensure camera is working.")
    }
  }, [router, slug])

  const startCountdown = useCallback(() => {
    if (isCountingDown || isCapturing) return

    setIsCountingDown(true)
    setCountdownNumber(3)

    const countdownInterval = setInterval(() => {
      setCountdownNumber((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setIsCountingDown(false)
          takePhoto()
          return 3
        }
        return prev - 1
      })
    }, 1000)
  }, [isCountingDown, isCapturing, takePhoto])

  // 3:4 aspect ratio for portrait mode camera
  const videoConstraints = {
    facingMode: "user",
    width: { ideal: 1080 },
    height: { ideal: 1440 },
    aspectRatio: 3 / 4,
  }

  
  return (
    <div className="h-dvh w-full max-w-[1080px] mx-auto bg-white p-3 sm:p-4 lg:p-6 overflow-hidden flex flex-col aspect-[9/16]">
      {/* Camera container - takes most of the space */}
      <div className="relative w-full flex-1 flex items-center justify-center min-h-0">
        <div className="rounded-2xl sm:rounded-3xl lg:rounded-[40px] overflow-hidden border-4 sm:border-6 lg:border-8 border-gradient-green-end w-full h-full max-h-full relative">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.7}
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover transform -scale-x-100 bg-stone-600"
          />

          {isCountingDown && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gradient-green-end animate-pulse border-gradient-green-end border-8 sm:border-10 lg:border-14 border-bg-opacity-50 rounded-full w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 flex items-center justify-center">
                <div className="text-6xl sm:text-8xl lg:text-[10rem] font-bold text-white">
                  {countdownNumber}
                </div>
              </div>
            </div>
          )}

          {isCapturing && (
            <div className="absolute inset-0 bg-white opacity-80 flex items-center justify-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-800">Captured!</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls - stacked vertically for portrait */}
      <div className="w-full flex flex-col items-center gap-3 sm:gap-4 py-4 sm:py-6 flex-shrink-0">
        <button 
          onClick={startCountdown}
          className="bg-gradient-green-end rounded-full p-4 sm:p-6 lg:p-8 text-white hover:scale-105 transition-transform"
        >
          <IoCameraOutline className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24" />
        </button>
        <button
          onClick={() => router.push(`/events/${slug}/select-style`)}
          className="text-gradient-green-end text-xl sm:text-2xl lg:text-3xl font-normal flex items-center gap-2 sm:gap-3"
        >
          <BiArrowBack className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" /> Back
        </button>
      </div>
    </div>
  )
}
