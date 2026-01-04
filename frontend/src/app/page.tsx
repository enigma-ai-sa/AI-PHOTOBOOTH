"use client";

import { useRouter } from "next/navigation";
import { MdArrowOutward } from "react-icons/md";
import Button from "@/components/UI/Button";
import Logo from "@/components/Logo";

export default function Home() {
  const router = useRouter();

  return (
    <div className="h-screen relative bg-[url('/patterns/mainBackground.jpg')] bg-[length:100%_auto] bg-top bg-no-repeat bg-forest-green">
      {/* Gradient overlay at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[60vh] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(32, 91, 70, 0) 0%, rgba(32, 91, 70, 0.95) 25%, #205B46 90%)",
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 h-full p-10 flex flex-col justify-between">
        {/* Logo in top right */}
        <div className="flex justify-end ">
          <Logo width={150} height={80} className="" />
        </div>

        {/* Bottom content section */}
        <div className="pb-10 flex flex-col gap-30">
          <div className="mx-auto text-center text-cream font-bold flex flex-col items-center pb-20">
            <h1 className="text-[144px]">
              إختَـــــــــــــــــر مهنتك المـســـــــــتقبلية
            </h1>
          </div>

          <div className="mx-auto text-center text-white w-full flex flex-col gap-6 font-normal">
            <h3 className="text-4xl">
              شوف شكلك بالمستقبل — بالمهنة اللي تختارها!
            </h3>
            <Button
              onClick={() => router.push("/select-style")}
              variant="primary"
              size="large"
              className="w-full flex items-center justify-center gap-4"
            >
              أبدأ الآن
              <MdArrowOutward size={46} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
