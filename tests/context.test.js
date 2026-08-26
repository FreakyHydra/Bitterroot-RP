import test from "node:test";
import assert from "node:assert/strict";
import { compileBitterrootContext } from "../src/context/compile.js";

const persona = { id: "arrax", name: "Arrax", description: "A wolf traveler." };

test("Ragna remains hard-edged at devoted relationship", () => {
  const result = compileBitterrootContext({
    persona,
    placeId: "brackenjaw-ranger-station",
    primaryCharacterId: "ragna-holt",
    relationship: { label: "devoted", score: 9000 },
  });
  assert.match(result.prompt, /does not make her generically soft/i);
  assert.match(result.prompt, /cannot overwrite temperament/i);
  assert.equal(result.manifest.relationshipKey, "ragna-holt::arrax");
});

test("relationship state is scoped by persona", () => {
  const one = compileBitterrootContext({ persona, placeId: "east-marker-trail", primaryCharacterId: "ragna-holt" });
  const two = compileBitterrootContext({ persona: { ...persona, id: "second-persona" }, placeId: "east-marker-trail", primaryCharacterId: "ragna-holt" });
  assert.notEqual(one.manifest.relationshipKey, two.manifest.relationshipKey);
});

test("minor primary character disables mature canon", () => {
  const result = compileBitterrootContext({
    persona,
    placeId: "brackenjaw-ranger-station",
    scenarioId: "borrowed-badge",
    matureContentRequested: true,
  });
  assert.equal(result.manifest.primaryCharacterId, "pip-holt");
  assert.equal(result.manifest.matureCanonEnabled, false);
  assert.match(result.prompt, /No sexual or romanticized adult content is permitted for Pip/i);
});

test("context hard-forbids humans", () => {
  const result = compileBitterrootContext({ persona, placeId: "east-marker-trail", primaryCharacterId: "ragna-holt" });
  assert.match(result.prompt, /humans do not exist/i);
  assert.match(result.prompt, /must not be introduced/i);
  assert.match(result.prompt, /intelligent, speaking feral/i);
  assert.match(result.prompt, /Body form: upright-feral/i);
});

test("context includes relevant place ancestry and bounded cast", () => {
  const result = compileBitterrootContext({
    persona,
    placeId: "east-marker-trail",
    scenarioId: "crossed-markers",
  });
  assert.deepEqual(result.manifest.placePath, ["bitterroot", "howling-hills", "splitpine-reach", "east-marker-trail"]);
  assert.deepEqual(result.manifest.castIds, ["ragna-holt"]);
  assert.ok(result.manifest.loreIds.includes("brackenjaw-culture"));
});

test("context enforces the pre-industrial era", () => {
  const result = compileBitterrootContext({ persona, placeId: "east-marker-trail", primaryCharacterId: "ragna-holt" });
  assert.ok(result.manifest.loreIds.includes("pre-industrial-era"));
  assert.match(result.prompt, /Bitterroot is pre-industrial/i);
  assert.match(result.prompt, /Do not introduce industrial or modern technology/i);
});
