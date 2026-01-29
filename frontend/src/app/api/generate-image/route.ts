// src/app/api/generate-image/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";

export async function POST(request: NextRequest) {
  console.log(`🔧 DEBUG: Using backend URL: ${BACKEND_URL}`);
  try {
    const { image, option } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!option) {
      return NextResponse.json({ error: "No option provided" }, { status: 400 });
    }

    console.log(`🎨 Sending image to Flask backend for generation using option: ${option}...`);

    // Call Flask backend with the unified endpoint
    const response = await fetch(`${BACKEND_URL}/image-generator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: image,
        option: option,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.image && !data.imageUrl) {
      return NextResponse.json(
        { error: "No image returned from backend" },
        { status: 500 }
      );
    }

    // Use S3 URL directly if available (much faster), otherwise fall back to base64
    let imageUrl = data.imageUrl || data.image;
    
    // Only add data URL prefix if it's base64 and doesn't already have it
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
      imageUrl = `data:image/png;base64,${imageUrl}`;
    }

    // Handle QR code if present
    const qrCodeUrl = data.qrCode
      ? (data.qrCode.startsWith('data:')
          ? data.qrCode
          : `data:image/png;base64,${data.qrCode}`)
      : null;

    console.log("✅ Image generation successful, using URL:", imageUrl?.substring(0, 50) + "...");

    return NextResponse.json({
      imageUrl: imageUrl,
      qrCodeUrl: qrCodeUrl,
    });
  } catch (error: unknown) {
    console.error("❌ Error generating image:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Image generation failed",
      },
      { status: 500 }
    );
  }
}
