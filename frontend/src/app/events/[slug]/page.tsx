"use client"

import { useRouter, useParams } from "next/navigation"
import { MdArrowOutward } from "react-icons/md"
import Button from "@/components/UI/Button"
import Image from "next/image"
import { useEvent } from "@/contexts/EventContext"

export default function EventHome() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const { event } = useEvent()

  return (
    <div className="h-dvh w-full max-w-[1080px] mx-auto p-4 sm:p-6 lg:p-8 bg-white aspect-[9/16]">
      <div className="grid grid-rows-[auto_1fr_auto] pt-4 sm:pt-6 gap-6 sm:gap-8 lg:gap-10 border-gradient-green-white bg-gradient-light-green-white rounded-2xl sm:rounded-3xl lg:rounded-[40px] h-full px-4 sm:px-6 lg:px-8 relative">
        {/* Logo - Top Right */}
        <div className="w-full flex justify-end pt-4 sm:pt-6 z-10">
          {event.logo_url ? (
            <img
              src={event.logo_url}
              alt={event.company_name}
              className="object-contain w-[55%] sm:w-[50%] lg:w-[45%] h-auto max-h-24"
            />
          ) : (
            <div className="text-right">
              <h2 className="text-xl font-bold text-gradient-green-end">{event.company_name}</h2>
            </div>
          )}
        </div>

        <div className="mx-auto text-center text-gradient-green-end font-normal flex flex-col items-center justify-center gap-4 sm:gap-6 lg:gap-8">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl">Welcome to</h3>
          <h1 className="font-medium text-5xl sm:text-6xl lg:text-7xl leading-[1.1]">
            {event.name}
          </h1>
          <h3 className="text-xl sm:text-2xl lg:text-3xl">AI Photo Experience</h3>
        </div>

        <div className="mx-auto text-center text-gradient-green-end w-full flex flex-col gap-4 sm:gap-6 font-normal pb-4 sm:pb-6 lg:pb-8">
          <h3 className="text-xl sm:text-2xl lg:text-3xl px-2">Create your photo and share your joy!</h3>
          <Button
            onClick={() => router.push(`/events/${slug}/select-style`)}
            variant="primary"
            size="large"
            className="w-full flex items-center justify-center gap-3 sm:gap-4 !py-6 sm:!py-8 lg:!py-10 !text-2xl sm:!text-3xl lg:!text-4xl"
          >
            Start Now
            <MdArrowOutward className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
          </Button>
        </div>
      </div>
    </div>
  )
}
