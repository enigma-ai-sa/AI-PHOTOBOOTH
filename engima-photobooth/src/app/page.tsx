"use client";

import { useRouter } from "next/navigation";
import { MdArrowOutward } from "react-icons/md";
import Button from "@/components/UI/Button";

export default function Home() {
  const router = useRouter();

  return (
    <div className="h-screen p-10 bg-white">
      <div className="grid grid-rows-[auto_1fr_auto] pt-10 gap-10 border-gradient-blue-white bg-gradient-light-blue-white rounded-3xl h-full">
        <div className="h-30" />

        <div className="mx-auto text-center text-gradient-blue-end font-normal flex flex-col items-center gap-8">
          <h3 className="text-5xl">Start a brand</h3>
          <h1 className="font-medium text-[180px] leading-[1.1]">
            New AI
            <span className="block font-normal text-[130px]">Experience</span>
          </h1>
          <h3 className="text-5xl">like you never had before</h3>
        </div>

        <div className="mx-auto text-center text-gradient-blue-end w-full flex flex-col gap-6 font-normal">
          <h3 className="text-4xl">Create your photo and share your joy!</h3>
          <Button
            onClick={() => router.push("/select-style")}
            variant="primary"
            size="large"
            className="w-full flex items-center justify-center gap-4"
          >
            Start Now
            <MdArrowOutward size={46} />
          </Button>
        </div>
      </div>
    </div>
  );
}
