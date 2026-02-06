"use client";

import Button from "@/components/UI/Button";
import { useRouter } from "next/navigation";
import { GoHome } from "react-icons/go";
import { useTranslation } from "@/i18n/useTranslation";

export default function ThankYou() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleHomeScreen = () => {
    localStorage.removeItem("capturedImage");
    localStorage.removeItem("selectedEndpoint");
    router.push("/");
  };

  return (
    <div className="h-screen p-10 bg-white">
      <div className="grid grid-rows-[auto_1fr_auto] pt-10 gap-10 border-gradient-blue-white bg-gradient-light-blue-white rounded-3xl h-full">
        <div className="h-30" />

        <div className="mx-auto text-center text-gradient-blue-end font-normal flex flex-col items-center gap-8">
          <h1 className="font-medium text-[180px] leading-[1.1]">{t.thankYou.title}</h1>
          <h3 className="text-5xl">{t.thankYou.subtitle}</h3>
        </div>

        <div className="mx-auto text-center text-gradient-blue-end w-full flex flex-col gap-6 font-normal">
          <h3 className="text-4xl">{t.thankYou.shareMessage}</h3>
          <Button
            onClick={handleHomeScreen}
            variant="primary"
            size="large"
            className="w-full flex items-center justify-center gap-4"
          >
            <GoHome size={46} />
            {t.thankYou.homeButton}
          </Button>
        </div>
      </div>
    </div>
  );
}
