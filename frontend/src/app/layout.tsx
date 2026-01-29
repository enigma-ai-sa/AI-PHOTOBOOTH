import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Photobooth",
  description: "Create AI-generated photos at the King Faisal Specialist Hospital",
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
        {children}
      </body>
    </html>
  );
}
