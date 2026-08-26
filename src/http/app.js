import { compileBitterrootContext } from "../context/compile.js";
import { generate } from "../providers/index.js";
import { BITTERROOT_WORLD, publicWorldCatalog } from "../world/bitterroot.js";
import { getPlace, peopleForPlace, placeAncestry } from "../world/query.js";

const DEFAULT_BODY_LIMIT = 1024 * 1024;

export function createApp(options = {}) {
  const allowedOrigins = options.allowedOrigins ?? parseOrigins(process.env.BITTERROOT_ALLOWED_ORIGINS);

  return async function app(request, response) {
    setSecurityHeaders(response);
    const origin = request.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
    }
    if (request.method === "OPTIONS") {
      response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
      response.writeHead(origin && !allowedOrigins.has(origin) ? 403 : 204).end();
      return;
    }

    try {
      const url = new URL(request.url, "http://localhost");
      if (request.method === "GET" && url.pathname === "/health") {
        return sendJson(response, 200, { ok: true, service: "bitterroot-rp", worldRevision: BITTERROOT_WORLD.revision });
      }
      if (request.method === "GET" && url.pathname === "/v1/world") {
        return sendJson(response, 200, publicWorldCatalog());
      }

      const placeMatch = url.pathname.match(/^\/v1\/places\/([a-z0-9-]+)$/);
      if (request.method === "GET" && placeMatch) {
        const place = getPlace(placeMatch[1]);
        if (!place) return sendJson(response, 404, { error: "Place not found" });
        return sendJson(response, 200, { place, ancestry: placeAncestry(place.id) });
      }

      const peopleMatch = url.pathname.match(/^\/v1\/places\/([a-z0-9-]+)\/people$/);
      if (request.method === "GET" && peopleMatch) {
        const place = getPlace(peopleMatch[1]);
        if (!place) return sendJson(response, 404, { error: "Place not found" });
        const people = peopleForPlace(place.id, { scenarioId: url.searchParams.get("scenarioId") ?? undefined })
          .map(({ character, availability }) => ({
            character: publicCharacter(character),
            availability,
          }));
        return sendJson(response, 200, { placeId: place.id, people });
      }

      if (request.method === "POST" && url.pathname === "/v1/context/compile") {
        const body = await readJson(request, options.bodyLimit);
        return sendJson(response, 200, compileBitterrootContext(body));
      }

      if (request.method === "POST" && url.pathname === "/v1/generate") {
        const body = await readJson(request, options.bodyLimit);
        const compiled = compileBitterrootContext(body.context ?? {});
        const token = bearerToken(request.headers.authorization);
        const result = await (options.generate ?? generate)({
          provider: body.provider,
          model: body.model,
          prompt: compiled.prompt,
          maxTokens: body.maxTokens,
          temperature: body.temperature,
          stop: body.stop,
          token,
        });
        return sendJson(response, 200, { ...result, manifest: compiled.manifest });
      }

      return sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      const status = Number.isInteger(error?.status) ? error.status : 400;
      return sendJson(response, status, { error: status >= 500 ? "Generation service failed" : error.message });
    }
  };
}

function publicCharacter(character) {
  return {
    id: character.id,
    name: character.name,
    species: character.species,
    bodyForm: character.bodyForm,
    age: character.age,
    ageCategory: character.ageCategory,
    role: character.role,
    summary: character.summary,
  };
}

async function readJson(request, configuredLimit) {
  const limit = configuredLimit ?? parsePositiveInteger(process.env.REQUEST_BODY_LIMIT_BYTES, DEFAULT_BODY_LIMIT);
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error("Request body is too large"), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON"), { status: 400 });
  }
}

function bearerToken(value) {
  const match = typeof value === "string" ? value.match(/^Bearer\s+(.+)$/i) : null;
  return match?.[1]?.trim() ?? "";
}

function setSecurityHeaders(response) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
}

function sendJson(response, status, body) {
  response.writeHead(status);
  response.end(JSON.stringify(body));
}

function parseOrigins(value = "http://localhost:5173") {
  return new Set(value.split(",").map((origin) => origin.trim()).filter(Boolean));
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
