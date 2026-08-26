import { compileBitterrootContext } from "../../../src/context/compile.js";
import { generate } from "../../../src/providers/index.js";

const MAX_BODY_BYTES = 1_048_576;

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return Response.json({ error: "Request body is too large" }, { status: 413 });
    }

    const body = JSON.parse(raw || "{}");
    const compiled = compileBitterrootContext(body.context ?? {});
    const token = bearerToken(request.headers.get("authorization"));
    const result = await generate({
      provider: body.provider,
      model: body.model,
      prompt: compiled.prompt,
      maxTokens: body.maxTokens,
      temperature: body.temperature,
      stop: body.stop,
      token,
    });

    return Response.json({ ...result, manifest: compiled.manifest }, {
      headers: securityHeaders(),
    });
  } catch (error) {
    const candidate = error as {
      status?: unknown;
      message?: unknown;
      diagnostics?: unknown;
      stack?: unknown;
    };
    const status = Number.isInteger(candidate.status) ? Number(candidate.status) : 400;

    if (status >= 500) {
      console.error("[Bitterroot /api/generate] generation failed", {
        status,
        message: String(candidate.message || "Unknown generation error"),
        diagnostics: candidate.diagnostics ?? null,
        stack: typeof candidate.stack === "string" ? candidate.stack : undefined,
      });
    }

    const message = status >= 500
      ? "The generation service could not complete this turn."
      : String(candidate.message || "The request could not be completed.");
    return Response.json({ error: message }, { status, headers: securityHeaders() });
  }
}

function bearerToken(value: string | null) {
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

function securityHeaders() {
  return {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
}
