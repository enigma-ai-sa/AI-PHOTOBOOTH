// src/app/api/generate-image/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";

export async function POST(request: NextRequest) {
  try {
    const { image, endpoint } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!endpoint) {
      return NextResponse.json({ error: "No endpoint provided" }, { status: 400 });
    }

    console.log(`🎨 Sending image to Flask backend for generation using endpoint: ${endpoint}...`);

    // Call Flask backend with the selected endpoint
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: image,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.image) {
      return NextResponse.json(
        { error: "No image returned from backend" },
        { status: 500 }
      );
    }

    // Convert base64 to data URL format if needed
    const imageUrl = data.image.startsWith('data:')
      ? data.image
      : `data:image/png;base64,${data.image}`;

    console.log("✅ Image generation successful");

    return NextResponse.json({
      imageUrl: imageUrl,
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
