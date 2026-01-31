// src/app/api/generate-image-stream/route.ts
import { NextRequest } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  console.log(`[Stream] Using backend URL: ${BACKEND_URL}`);

  try {
    const { image, option } = await request.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!option) {
      return new Response(JSON.stringify({ error: "No option provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[Stream] Forwarding to backend with option: ${option}`);

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
      console.error("[Stream] Backend error response:", errorText);
      return new Response(
        JSON.stringify({
          error: `Backend error: ${response.status} - ${errorText}`,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!response.body) {
      return new Response(
        JSON.stringify({ error: "No response body received from backend" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a TransformStream to pass SSE events through
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // Process the stream in the background
    (async () => {
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Process any remaining buffer
            if (buffer.trim()) {
              await processEvents(buffer, writer, encoder);
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (separated by double newlines)
          const events = buffer.split("\n\n");
          buffer = events.pop() || ""; // Keep incomplete event in buffer

          for (const event of events) {
            if (!event.trim()) continue;
            await processEvents(event, writer, encoder);
          }
        }
      } catch (error) {
        console.error("[Stream] Error processing stream:", error);
        const errorEvent = `data: ${JSON.stringify({
          type: "error",
          message: error instanceof Error ? error.message : "Stream error",
        })}\n\n`;
        await writer.write(encoder.encode(errorEvent));
      } finally {
        await writer.close();
      }
    })();

    // Return the readable stream as SSE response
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("[Stream] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Stream setup failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function processEvents(
  event: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder
) {
  const lines = event.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const jsonStr = line.slice(6); // Remove "data: " prefix
      try {
        const data = JSON.parse(jsonStr);

        // Add data URL prefix to base64 images if not already present
        if (data.image && !data.image.startsWith("data:")) {
          if (data.type === "qrcode") {
            data.image = `data:image/png;base64,${data.image}`;
          } else {
            data.image = `data:image/jpeg;base64,${data.image}`;
          }
        }

        // Forward the event
        const outputLine = `data: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(outputLine));

        console.log(`[Stream] Forwarded event: ${data.type}`);
      } catch (parseError) {
        // Forward unparseable data as-is
        console.warn("[Stream] Failed to parse SSE data:", jsonStr);
        await writer.write(encoder.encode(`${line}\n\n`));
      }
    }
  }
}
