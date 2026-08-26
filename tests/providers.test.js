import test from "node:test";
import assert from "node:assert/strict";
import { generateWithNovelAI } from "../src/providers/novelai.js";
import { generateWithOllama } from "../src/providers/ollama.js";

test("NovelAI adapter sends a bearer token without placing it in the body", async () => {
  let captured;
  const result = await generateWithNovelAI({ token: "secret-token", model: "xialong-v1", prompt: "hello" }, {
    fetch: async (url, init) => {
      captured = { url, init };
      return new Response(JSON.stringify({ choices: [{ text: "reply" }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });
  assert.equal(captured.init.headers.Authorization, "Bearer secret-token");
  assert.equal(captured.init.body.includes("secret-token"), false);
  assert.equal(result.text, "reply");
});

test("Ollama adapter uses the configured private endpoint", async () => {
  let capturedUrl;
  const result = await generateWithOllama({ model: "test-model", prompt: "hello" }, {
    baseUrl: "http://127.0.0.1:11434",
    fetch: async (url) => {
      capturedUrl = url;
      return new Response(JSON.stringify({ response: "local reply" }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });
  assert.equal(capturedUrl, "http://127.0.0.1:11434/api/generate");
  assert.equal(result.text, "local reply");
});
