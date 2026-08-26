const DEFAULT_BASE_URL = "https://text.novelai.net/oa/v1";
const ALLOWED_MODELS = new Set(["xialong-v1", "glm-4-6"]);

export async function generateWithNovelAI(request, options = {}) {
  const token = String(request.token ?? "").trim();
  if (!token) throw providerError("NovelAI token is required", 401);
  if (!ALLOWED_MODELS.has(request.model)) throw providerError("Unsupported NovelAI model", 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 120_000);
  try {
    const response = await (options.fetch ?? fetch)(`${options.baseUrl ?? process.env.NOVELAI_BASE_URL ?? DEFAULT_BASE_URL}/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        prompt: request.prompt,
        max_tokens: boundedInteger(request.maxTokens, 32, 4096, 600),
        temperature: boundedNumber(request.temperature, 0, 2, 0.85),
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false,
        stop: Array.isArray(request.stop) ? request.stop.slice(0, 16).map(String) : [],
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw providerError(novelAIStatusMessage(response.status), 502);
    const payload = await response.json();
    const text = extractOpenAIStyleReply(payload);
    if (!text) throw providerError("NovelAI returned an empty reply", 502);
    return { text: cleanGeneratedText(text), provider: "novelai", model: request.model };
  } catch (error) {
    if (error?.name === "AbortError") throw providerError("NovelAI generation timed out", 504);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function extractOpenAIStyleReply(value) {
  const first = value?.choices?.[0];
  if (typeof first?.text === "string") return first.text;
  if (typeof first?.message?.content === "string") return first.message.content;
  return "";
}

function novelAIStatusMessage(status) {
  if (status === 401) return "NovelAI rejected the access token";
  if (status === 402 || status === 403) return "NovelAI did not authorize this generation";
  if (status === 404) return "The requested NovelAI model is unavailable";
  if (status === 429) return "NovelAI is receiving too many requests";
  if (status >= 500) return "NovelAI is temporarily unavailable";
  return "NovelAI could not generate a reply";
}

function cleanGeneratedText(value) {
  return value
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<\|(?:user|assistant)\|>/gi, "")
    .trim()
    .slice(0, 24_000);
}

function providerError(message, status) {
  return Object.assign(new Error(message), { status });
}

function boundedInteger(value, min, max, fallback) {
  return Number.isFinite(value) ? Math.floor(Math.min(max, Math.max(min, value))) : fallback;
}

function boundedNumber(value, min, max, fallback) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
