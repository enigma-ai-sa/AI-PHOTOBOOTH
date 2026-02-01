import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "AI Photobooth",
  description: "Multi-tenant AI Photobooth for events and conferences",
};

export const viewport: Viewport = {
  width: 1080,
  height: 1920,
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-dvh bg-white flex items-center justify-center">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
