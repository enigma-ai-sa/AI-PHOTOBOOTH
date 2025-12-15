"use client";

import Link from "next/link";
import { MdArrowOutward } from "react-icons/md";
import Logo from "@/components/Logo";
import Image from "next/image";

export default function Home() {
  return (
    <div className="h-screen custom-brand-gradient grid grid-rows-[auto_1fr_auto] py-20 px-10 gap-10">
      <Logo text="Capture your photo and let AI do the rest" />

      <div className="text-center flex flex-col justify-center h-full gap-8">
        <div className="flex-1 flex items-center justify-center min-h-0 rounded-4xl hadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
          <Image
            src="/assets/image.png"
            alt="AI Photo Booth Robot"
            width={500}
            height={500}
            className="h-full w-auto object-contain rounded-4xl"
          />
        </div>
      </div>

      <Link
        href="/camera"
        className="w-full text-primary-purple-500  bg-white  py-10 px-8 rounded-3xl text-4xl shadow-purple-900/50 text-center flex items-center gap-4  mx-auto justify-center"
      >
        Start
        <MdArrowOutward />
      </Link>
    </div>
  );
}
