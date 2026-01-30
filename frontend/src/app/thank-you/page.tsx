"use client";

import Button from "@/components/UI/Button";
import { useRouter } from "next/navigation";
import { GoHome } from "react-icons/go";

export default function ThankYou() {
  const router = useRouter();

  const handleHomeScreen = () => {
    localStorage.removeItem("capturedImage");
    localStorage.removeItem("selectedEndpoint");
    router.push("/");
  };

  return (
    <div className="h-dvh w-full max-w-[1080px] mx-auto p-3 sm:p-4 lg:p-6 bg-white aspect-[9/16]">
      <div className="grid grid-rows-[auto_1fr_auto] pt-6 sm:pt-8 gap-6 sm:gap-8 border-gradient-green-white bg-gradient-light-green-white rounded-2xl sm:rounded-3xl h-full px-4 sm:px-6">
        <div className="h-12 sm:h-16 lg:h-20" />

        <div className="mx-auto text-center text-gradient-green-end font-normal flex flex-col items-center justify-center gap-4 sm:gap-6">
          <h1 className="font-medium text-5xl sm:text-6xl lg:text-7xl leading-[1.1]">Thank You!</h1>
          <h3 className="text-xl sm:text-2xl lg:text-3xl px-2">We hope you enjoyed your AI experience</h3>
        </div>

        <div className="mx-auto text-center text-gradient-green-end w-full flex flex-col gap-4 sm:gap-5 font-normal pb-4 sm:pb-6">
          <h3 className="text-lg sm:text-xl lg:text-2xl">Share your joy and come back soon!</h3>
          <Button
            onClick={handleHomeScreen}
            variant="primary"
            size="large"
            className="w-full flex items-center justify-center gap-2 sm:gap-3 !py-4 sm:!py-5 lg:!py-6 !text-xl sm:!text-2xl lg:!text-3xl"
          >
            <GoHome className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
            Home Screen
          </Button>
        </div>
      </div>
    </div>
  );
}
