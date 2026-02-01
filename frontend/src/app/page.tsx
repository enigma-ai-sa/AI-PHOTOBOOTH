"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to events page for multi-tenant experience
    router.replace("/events");
  }, [router]);

  return (
    <div className="h-dvh w-full flex items-center justify-center bg-gradient-light-green-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to events...</p>
      </div>
    </div>
  );
}
