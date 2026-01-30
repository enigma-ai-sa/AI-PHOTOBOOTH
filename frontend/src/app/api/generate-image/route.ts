// src/app/api/generate-image/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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

    console.log(`🎨 Sending image to FastAPI backend for generation using option: ${option}...`);

    // Convert base64 to blob for multipart/form-data
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Buffer.from(base64Data, "base64");
    const blob = new Blob([binaryData], { type: "image/png" });

    // Create FormData with the image file and option
    const formData = new FormData();
    formData.append("image", blob, "captured_image.png");
    formData.append("option", option);

    // Call FastAPI backend with SSE streaming endpoint
    const response = await fetch(`${BACKEND_URL}/generate-stream`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error response:", errorText);
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body received from backend");
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let finalImage: string | null = null;
    let qrCodeImage: string | null = null;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events (separated by double newlines)
      const events = buffer.split("\n\n");
      buffer = events.pop() || ""; // Keep incomplete event in buffer

      for (const event of events) {
        if (!event.trim()) continue;

        // Parse SSE format: "data: {...}"
        const lines = event.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6); // Remove "data: " prefix
            try {
              const data = JSON.parse(jsonStr);

              switch (data.type) {
                case "partial":
                  console.log("📸 Received partial image update");
                  // Could be used for progressive display, but we just log for now
                  break;

                case "final":
                  console.log("✅ Received final image");
                  finalImage = data.image;
                  break;

                case "qrcode":
                  console.log("📱 Received QR code");
                  qrCodeImage = data.image;
                  break;

                case "done":
                  console.log("🏁 Stream complete");
                  break;

                case "error":
                  console.error("❌ Backend error:", data.message);
                  throw new Error(data.message || "Backend processing error");

                default:
                  console.log(`Unknown event type: ${data.type}`);
              }
            } catch (parseError) {
              // Skip malformed JSON (could be incomplete)
              console.warn("Failed to parse SSE data:", jsonStr);
            }
          }
        }
      }
    }

    if (!finalImage) {
      return NextResponse.json(
        { error: "No final image returned from backend" },
        { status: 500 }
      );
    }

    // Convert base64 to data URL format if needed
    const imageUrl = finalImage.startsWith("data:")
      ? finalImage
      : `data:image/jpeg;base64,${finalImage}`;

    // Handle QR code if present
    const qrCodeUrl = qrCodeImage
      ? qrCodeImage.startsWith("data:")
        ? qrCodeImage
        : `data:image/png;base64,${qrCodeImage}`
      : null;

    console.log("✅ Image generation successful");

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
