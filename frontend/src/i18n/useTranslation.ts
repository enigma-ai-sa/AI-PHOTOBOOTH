"use client";

import { useLanguage } from "./LanguageContext";

export function useTranslation() {
  return useLanguage();
}
