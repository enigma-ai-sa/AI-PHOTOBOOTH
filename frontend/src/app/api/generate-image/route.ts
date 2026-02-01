// src/app/api/generate-image/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5000";

// Increased timeout for slow networks (3 minutes)
const BACKEND_TIMEOUT = 180000;

export async function POST(request: NextRequest) {
  console.log(`🔧 DEBUG: Using backend URL: ${BACKEND_URL}`);
  
  // Create abort controller with timeout for backend call
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);
  
  try {
    const { image, option, eventSlug } = await request.json();

    if (!image) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!option) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: "No option provided" }, { status: 400 });
    }

    console.log(`🎨 Sending image to Flask backend for generation using option: ${option}...`);
    console.log(`🏢 Event slug: ${eventSlug || 'none (legacy mode)'}`);
    console.log(`⏱️ Backend timeout set to ${BACKEND_TIMEOUT}ms`);

    // Call Flask backend with the unified endpoint
    // Backend now returns S3 URL instead of base64 (~200 bytes vs ~10MB response)
    // Include eventSlug for multi-tenant support
    const response = await fetch(`${BACKEND_URL}/image-generator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: image,
        option: option,
        eventSlug: eventSlug || undefined,  // Pass event slug for multi-tenant
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend error: ${response.status}`);
    }

    const data = await response.json();

    // Backend now returns imageUrl (S3 URL) instead of base64 image
    if (!data.imageUrl) {
      return NextResponse.json(
        { error: "No image URL returned from backend" },
        { status: 500 }
      );
    }

    // Handle QR code if present (still base64, but small ~2KB)
    const qrCodeUrl = data.qrCode
      ? (data.qrCode.startsWith('data:')
          ? data.qrCode
          : `data:image/png;base64,${data.qrCode}`)
      : null;

    console.log("✅ Image generation successful, S3 URL:", data.imageUrl);

    return NextResponse.json({
      imageUrl: data.imageUrl,  // Now an S3 URL, not base64
      qrCodeUrl: qrCodeUrl,
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    console.error("❌ Error generating image:", error);
    
    // Handle abort/timeout error
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Backend request timed out. Please try again." },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Image generation failed",
      },
      { status: 500 }
    );
  }
}
