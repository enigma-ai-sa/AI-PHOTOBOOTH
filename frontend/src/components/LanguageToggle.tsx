"use client";

import { HiOutlineGlobe } from "react-icons/hi";
import { useTranslation } from "@/i18n/useTranslation";

interface LanguageToggleProps {
  className?: string;
  size?: number;
}

export default function LanguageToggle({ className = "", size = 30 }: LanguageToggleProps) {
  const { toggleLocale, locale } = useTranslation();

  return (
    <button
      onClick={toggleLocale}
      className={`border border-white rounded-full p-2 text-white hover:bg-white/10 transition-colors ${className}`}
      aria-label={locale === "en" ? "Switch to Arabic" : "Switch to English"}
    >
      <HiOutlineGlobe size={size} />
    </button>
  );
}
