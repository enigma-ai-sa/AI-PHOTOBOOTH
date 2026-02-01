"use client"

import Button from "@/components/UI/Button"
import Image from "next/image"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { FiCheck, FiRefreshCw } from "react-icons/fi"

export default function EventPreview() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const [capturedImage, setCapturedImage] = useState<string>("")
  const [imageError, setImageError] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Get captured image from localStorage
    const image = localStorage.getItem("capturedImage")

    console.log("Preview: Looking for captured image, found:", image ? `${image.length} chars` : "null")

    if (!image) {
      // If no image, redirect back to select-style
      console.log("Preview: No image found, redirecting to select-style")
      router.push(`/events/${slug}/select-style`)
      return
    }

    setCapturedImage(image)
    setIsLoading(false)
  }, [router, slug])

  const handleRetake = () => {
    router.push(`/events/${slug}/camera`)
  }

  const handleGenerate = () => {
    // Navigate to processing page
    router.push(`/events/${slug}/processing`)
  }

  if (isLoading) {
    return (
      <div className="h-dvh w-full max-w-[1080px] mx-auto bg-white flex items-center justify-center aspect-[9/16]">
        <p className="text-xl sm:text-2xl text-gray-600">Loading preview...</p>
      </div>
    )
  }

  if (!capturedImage) {
    return null // Don't render anything while redirecting
  }

  return (
    <div className="h-dvh w-full max-w-[1080px] mx-auto bg-white p-3 sm:p-4 lg:p-6 overflow-hidden flex flex-col aspect-[9/16]">
      {/* Image container - takes most of the space */}
      <div className="relative w-full flex-1 flex items-center justify-center min-h-0">
        <div className="rounded-2xl sm:rounded-3xl lg:rounded-[40px] overflow-hidden border-4 sm:border-6 lg:border-8 border-gradient-green-end w-full h-full relative">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <p className="text-red-500 text-lg sm:text-xl">Failed to load image</p>
            </div>
          ) : (
            <Image
              src={capturedImage}
              alt="Captured photo"
              fill
              className="object-cover transform -scale-x-100"
              unoptimized
              onError={() => {
                console.error("Failed to load preview image")
                setImageError(true)
              }}
            />
          )}
        </div>
      </div>

      {/* Bottom controls - stacked vertically for portrait */}
      <div className="w-full flex flex-col gap-2 sm:gap-3 py-4 sm:py-6 flex-shrink-0">
        <Button
          onClick={handleGenerate}
          variant="primary"
          size="large"
          className="w-full gap-2 sm:gap-3 !py-4 sm:!py-5 lg:!py-6 !text-xl sm:!text-2xl lg:!text-3xl"
        >
          <FiCheck className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" /> Generate
        </Button>
        <Button
          onClick={handleRetake}
          variant="tertiary"
          size="large"
          className="w-full gap-2 sm:gap-3 !py-4 sm:!py-5 lg:!py-6 !text-xl sm:!text-2xl lg:!text-3xl"
        >
          <FiRefreshCw className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" /> Retake
        </Button>
      </div>
    </div>
  )
}
