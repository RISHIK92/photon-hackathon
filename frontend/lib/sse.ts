/**
 * sse.ts — Server-Sent Events stream helpers.
 *
 * Wraps fetch-based SSE reading with async iterators so React components
 * can consume token streams without manual ReadableStream wiring.
 */

export interface SSEEvent {
  type: string;
  [key: string]: unknown;
}

/**
 * Async-iterate over Server-Sent Events from a fetch Response.
 * Parses JSON payloads and yields typed event objects.
 *
 * @example
 * const res = await api.query.stream({ repo_id, question });
 * for await (const event of readSSE(res)) {
 *   if (event.type === "token") setAnswer(a => a + event.text);
 * }
 */
export async function* readSSE(response: Response): AsyncGenerator<SSEEvent> {
  if (!response.body) throw new Error("SSE response has no body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep incomplete last line

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data:")) {
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") return;
          try {
            yield JSON.parse(payload) as SSEEvent;
          } catch {
            // Ignore non-JSON data lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Subscribe to a job progress SSE stream.
 * Calls onEvent for every event until phase is "done" or "failed".
 *
 * @param streamUrl  URL of the SSE endpoint (from api.jobs.streamUrl)
 * @param onEvent    Callback invoked with each parsed event
 * @returns          An AbortController — call `.abort()` to cancel
 */
export function subscribeJobStream(
  streamUrl: string,
  onEvent: (event: SSEEvent) => void
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(streamUrl, { signal: controller.signal });
      for await (const event of readSSE(res)) {
        onEvent(event);
        if (event.phase === "done" || event.phase === "failed") break;
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("[SSE] stream error:", err);
      }
    }
  })();

  return controller;
}
