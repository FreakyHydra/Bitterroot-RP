const DEFAULT_BASE_URL = "http://127.0.0.1:11434";

export async function generateWithOllama(request, options = {}) {
  const model = String(request.model ?? process.env.OLLAMA_MODEL ?? "").trim();
  if (!model) throw Object.assign(new Error("An Ollama model is required"), { status: 400 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 180_000);
  try {
    const response = await (options.fetch ?? fetch)(`${options.baseUrl ?? process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: request.prompt,
        stream: false,
        options: {
          num_predict: boundedInteger(request.maxTokens, 32, 4096, 600),
          temperature: boundedNumber(request.temperature, 0, 2, 0.85),
          stop: Array.isArray(request.stop) ? request.stop.slice(0, 16).map(String) : [],
        },
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw Object.assign(new Error("Ollama could not generate a reply"), { status: 502 });
    const payload = await response.json();
    const text = typeof payload.response === "string" ? payload.response.trim().slice(0, 24_000) : "";
    if (!text) throw Object.assign(new Error("Ollama returned an empty reply"), { status: 502 });
    return { text, provider: "ollama", model };
  } catch (error) {
    if (error?.name === "AbortError") throw Object.assign(new Error("Ollama generation timed out"), { status: 504 });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function boundedInteger(value, min, max, fallback) {
  return Number.isFinite(value) ? Math.floor(Math.min(max, Math.max(min, value))) : fallback;
}

function boundedNumber(value, min, max, fallback) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
