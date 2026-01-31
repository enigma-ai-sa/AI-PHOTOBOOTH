import { useState, useCallback, useRef } from "react";

export type ImageType = "partial" | "final" | null;

interface ImageStreamState {
  currentImage: string | null;
  imageType: ImageType;
  qrCode: string | null;
  isLoading: boolean;
  isComplete: boolean;
  error: string | null;
  progress: number;
}

interface UseImageStreamReturn extends ImageStreamState {
  startStream: (imageData: string, option: string) => Promise<void>;
  cancelStream: () => void;
  reset: () => void;
}

const STREAM_TIMEOUT = 90000; // 90 seconds
const MAX_RETRIES = 3;

export function useImageStream(): UseImageStreamReturn {
  const [state, setState] = useState<ImageStreamState>({
    currentImage: null,
    imageType: null,
    qrCode: null,
    isLoading: false,
    isComplete: false,
    error: null,
    progress: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  const reset = useCallback(() => {
    setState({
      currentImage: null,
      imageType: null,
      qrCode: null,
      isLoading: false,
      isComplete: false,
      error: null,
      progress: 0,
    });
    retryCountRef.current = 0;
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: "Stream cancelled",
    }));
  }, []);

  const startStream = useCallback(
    async (imageData: string, option: string): Promise<void> => {
      // Cancel any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller with timeout
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, STREAM_TIMEOUT);

      setState((prev) => ({
        ...prev,
        isLoading: true,
        isComplete: false,
        error: null,
        progress: 5,
      }));

      try {
        const response = await fetch("/api/generate-image-stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: imageData,
            option: option,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Server error: ${response.status}`
          );
        }

        if (!response.body) {
          throw new Error("No response body received");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        setState((prev) => ({ ...prev, progress: 10 }));

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("[useImageStream] Stream ended");
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (separated by double newlines)
          const events = buffer.split("\n\n");
          buffer = events.pop() || ""; // Keep incomplete event in buffer

          for (const event of events) {
            if (!event.trim()) continue;

            const lines = event.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6); // Remove "data: " prefix
                try {
                  const data = JSON.parse(jsonStr);
                  console.log("[useImageStream] Received:", data.type);

                  switch (data.type) {
                    case "partial":
                      setState((prev) => ({
                        ...prev,
                        currentImage: data.image,
                        imageType: "partial",
                        progress: Math.min(prev.progress + 15, 70),
                      }));
                      break;

                    case "final":
                      setState((prev) => ({
                        ...prev,
                        currentImage: data.image,
                        imageType: "final",
                        progress: 85,
                      }));
                      break;

                    case "qrcode":
                      setState((prev) => ({
                        ...prev,
                        qrCode: data.image,
                        progress: 95,
                      }));
                      break;

                    case "done":
                      setState((prev) => ({
                        ...prev,
                        isLoading: false,
                        isComplete: true,
                        progress: 100,
                      }));
                      retryCountRef.current = 0;
                      break;

                    case "error":
                      throw new Error(
                        data.message || "Backend processing error"
                      );

                    default:
                      console.log(
                        `[useImageStream] Unknown event type: ${data.type}`
                      );
                  }
                } catch (parseError) {
                  // Skip malformed JSON (could be incomplete)
                  if (
                    parseError instanceof Error &&
                    parseError.message !== "Backend processing error"
                  ) {
                    console.warn(
                      "[useImageStream] Failed to parse SSE data:",
                      jsonStr
                    );
                  } else {
                    throw parseError;
                  }
                }
              }
            }
          }
        }

        // If we finished reading but didn't get a "done" event, mark as complete
        setState((prev) => {
          if (prev.isLoading && prev.currentImage) {
            return {
              ...prev,
              isLoading: false,
              isComplete: true,
              progress: 100,
            };
          }
          return prev;
        });
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof Error) {
          if (err.name === "AbortError") {
            // Check if it was a timeout vs manual cancel
            if (retryCountRef.current < MAX_RETRIES - 1) {
              retryCountRef.current++;
              setState((prev) => ({
                ...prev,
                error: `Request timed out. Retrying... (${retryCountRef.current}/${MAX_RETRIES})`,
              }));
              // Retry after a short delay
              setTimeout(() => {
                startStream(imageData, option);
              }, 2000);
              return;
            } else {
              setState((prev) => ({
                ...prev,
                isLoading: false,
                error: `Request timed out after ${MAX_RETRIES} attempts. Please try again.`,
              }));
            }
          } else {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: err.message,
            }));
          }
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "Something went wrong",
          }));
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    []
  );

  return {
    ...state,
    startStream,
    cancelStream,
    reset,
  };
}
