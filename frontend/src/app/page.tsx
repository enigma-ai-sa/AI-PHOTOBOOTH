"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { MdArrowOutward } from "react-icons/md";
import Button from "@/components/UI/Button";
import LanguageToggle from "@/components/LanguageToggle";
import { useTranslation } from "@/i18n/useTranslation";

export default function Home() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col"
      style={{ backgroundImage: "url('/assets/heroBgImage.png')" }}
    >
      {/* Header */}
      <header className="flex justify-between items-center py-6 px-9">
        <Image
          src="/assets/enigmaLogo.svg"
          alt="Enigma"
          width={240}
          height={60}
        />
        <Image
          src="/assets/saudiCupLogo.svg"
          alt="Saudi Cup 2026"
          width={160}
          height={40}
        />
      </header>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Content */}
      <div className="p-6 flex flex-col gap-6">
        <p
          className="text-6xl"
          style={{
            background: "linear-gradient(190.73deg, #B3B3B3 50.53%, rgba(255, 255, 255, 0.4) 72.89%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {t.home.tagline}
        </p>
        <h1 className="text-saudi-gold text-8xl leading-tight">
          {t.home.title}
          <br />
          {t.home.titleLine2}
        </h1>

        <div className="flex items-center justify-between gap-4 mt-16">
          <p className="text-white text-2xl">
            {t.home.subtitle}
          </p>
          <LanguageToggle />
        </div>

        <Button
          onClick={() => router.push("/select-style")}
          variant="saudi"
          size="large"
          className="w-full flex items-center justify-center gap-4"
        >
          {t.home.startButton}
          <MdArrowOutward size={46} className={isRTL ? "-scale-x-100" : ""} />
        </Button>
      </div>
    </div>
  );
}
