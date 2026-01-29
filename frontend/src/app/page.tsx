"use client";

import { useRouter } from "next/navigation";
import { MdArrowOutward } from "react-icons/md";
import Button from "@/components/UI/Button";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  return (
    <div className="h-screen p-16 bg-white">
      <div className="grid grid-rows-[auto_1fr_auto] pt-8 gap-12 border-gradient-green-white bg-gradient-light-green-white rounded-[40px] h-full px-12 relative">
        {/* Hospital Logo - Top Right */}
        <div className="absolute top-12 right-16 z-10">
          <Image
            src="/assets/HospitalLogo.png"
            alt="King Faisal Specialist Hospital & Research Centre"
            width={750}
            height={375}
            className="object-contain"
            priority
          />
        </div>

        <div className="h-72" />

        <div className="mx-auto text-center text-gradient-green-end font-normal flex flex-col items-center gap-14">
          <h3 className="text-7xl">Start a brand</h3>
          <h1 className="font-medium text-[260px] leading-[1.1]">
            New AI
            <span className="block font-normal text-[190px]">Experience</span>
          </h1>
          <h3 className="text-7xl">like you never had before</h3>
        </div>

        <div className="mx-auto text-center text-gradient-green-end w-full flex flex-col gap-10 font-normal pb-10">
          <h3 className="text-6xl">Create your photo and share your joy!</h3>
          <Button
            onClick={() => router.push("/select-style")}
            variant="primary"
            size="large"
            className="w-full flex items-center justify-center gap-6 !py-20 !text-6xl"
          >
            Start Now
            <MdArrowOutward size={70} />
          </Button>
        </div>
      </div>
    </div>
  );
}
