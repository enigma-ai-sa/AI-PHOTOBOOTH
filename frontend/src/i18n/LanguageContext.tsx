"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import en from "./translations/en.json";
import ar from "./translations/ar.json";

export type Locale = "en" | "ar";
export type Translations = typeof en;

const translations: Record<Locale, Translations> = { en, ar };

interface LanguageContextType {
  locale: Locale;
  t: Translations;
  isRTL: boolean;
  toggleLocale: () => void;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "preferred-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  // Initialize locale from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === "en" || stored === "ar")) {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  // Update document direction when locale changes
  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = locale;
    }
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    const newLocale = locale === "en" ? "ar" : "en";
    setLocale(newLocale);
  }, [locale, setLocale]);

  const value: LanguageContextType = {
    locale,
    t: translations[locale],
    isRTL: locale === "ar",
    toggleLocale,
    setLocale,
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ ...value, t: translations.en, locale: "en", isRTL: false }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
