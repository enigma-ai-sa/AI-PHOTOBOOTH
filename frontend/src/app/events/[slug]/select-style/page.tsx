"use client"

import Button from "@/components/UI/Button"
import Image from "next/image"
import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import { LuArrowRight } from "react-icons/lu"
import { useEvent } from "@/contexts/EventContext"

export default function EventSelectStyle() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const { getPromptOptions, event } = useEvent()
  
  const imageOptions = getPromptOptions()

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId)
  }

  const handleNext = () => {
    if (selectedOption) {
      const selected = imageOptions.find(
        (option) => option.id === selectedOption
      )
      if (selected) {
        // Store the selected option and event slug in localStorage
        localStorage.setItem("selectedOption", selected.option)
        localStorage.setItem("eventSlug", slug)
        // Navigate to camera
        router.push(`/events/${slug}/camera`)
      }
    }
  }

  const handleBack = () => {
    router.push(`/events/${slug}`)
  }

  if (imageOptions.length === 0) {
    return (
      <div className="h-dvh w-full max-w-[1080px] mx-auto p-3 sm:p-4 lg:p-6 bg-white flex items-center justify-center aspect-[9/16]">
        <div className="text-center">
          <p className="text-xl text-gray-500 mb-4">No styles available for this event</p>
          <Button onClick={handleBack} variant="tertiary" size="large">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh w-full max-w-[1080px] mx-auto p-3 sm:p-4 lg:p-6 bg-white overflow-hidden aspect-[9/16]">
      <div className="w-full h-full rounded-2xl flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-h-0">
          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl text-gradient-green-end font-medium text-center py-2">
            Choose Your Photo Style
          </h2>

          {/* Image Options Grid - Dynamic based on count */}
          <div className={`grid gap-2 sm:gap-3 flex-1 min-h-0 ${
            imageOptions.length <= 2 ? 'grid-cols-1' : 
            imageOptions.length <= 4 ? 'grid-cols-2 grid-rows-2' : 
            'grid-cols-2 grid-rows-3'
          }`}>
            {imageOptions.map((option) => (
              <div
                key={option.id}
                className={`relative cursor-pointer rounded-xl sm:rounded-2xl lg:rounded-3xl transition-all duration-200 border-4 sm:border-6 lg:border-8 overflow-hidden flex flex-col ${
                  selectedOption === option.id
                    ? "border-gradient-green-end"
                    : "border-gray-400 hover:scale-[1.01]"
                }`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <div className="flex-1 relative min-h-0 bg-gray-100">
                  {option.image ? (
                    <img
                      src={option.image}
                      alt={option.label}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-300">
                        {option.label.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  className={`py-2 sm:py-3 px-2 sm:px-3 transition-colors duration-200 flex-shrink-0 ${
                    selectedOption === option.id
                      ? "bg-gradient-green-end text-white"
                      : "bg-gray-400 text-black"
                  }`}
                >
                  <p className="text-center font-medium text-base sm:text-xl lg:text-2xl">
                    {option.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons - Stacked vertically for portrait */}
          <div className="flex flex-col gap-2 sm:gap-3 w-full flex-shrink-0">
            <Button
              onClick={handleNext}
              disabled={!selectedOption}
              variant="primary"
              size="large"
              className="w-full flex items-center justify-center gap-2 sm:gap-3 !py-4 sm:!py-5 lg:!py-6 !text-xl sm:!text-2xl lg:!text-3xl"
            >
              Next <LuArrowRight className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
            </Button>
            <Button
              onClick={handleBack}
              variant="tertiary"
              size="large"
              className="w-full !py-4 sm:!py-5 lg:!py-6 !text-xl sm:!text-2xl lg:!text-3xl"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
