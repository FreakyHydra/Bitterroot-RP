import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../src/http/app.js";

async function withServer(run, options = {}) {
  const server = createServer(createApp(options));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("health and curated world endpoints respond", async () => {
  await withServer(async (base) => {
    const health = await fetch(`${base}/health`).then((response) => response.json());
    const world = await fetch(`${base}/v1/world`).then((response) => response.json());
    assert.equal(health.ok, true);
    assert.equal(world.id, "bitterroot");
    assert.ok(world.places.some((place) => place.id === "brackenjaw-enclave"));
  });
});

test("generation compiles server-owned canon before calling a provider", async () => {
  let providerRequest;
  await withServer(async (base) => {
    const response = await fetch(`${base}/v1/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer temporary" },
      body: JSON.stringify({
        provider: "novelai",
        model: "xialong-v1",
        context: {
          persona: { id: "arrax", name: "Arrax" },
          placeId: "east-marker-trail",
          scenarioId: "crossed-markers",
        },
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.text, "generated");
    assert.equal(body.manifest.primaryCharacterId, "ragna-holt");
  }, {
    generate: async (request) => {
      providerRequest = request;
      assert.match(request.prompt, /Humans do not exist/i);
      assert.match(request.prompt, /Ragna Holt/);
      return { text: "generated", provider: request.provider, model: request.model };
    },
  });
  assert.equal(providerRequest.token, "temporary");
});
