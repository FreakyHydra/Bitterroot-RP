import test from "node:test";
import assert from "node:assert/strict";
import { BITTERROOT_WORLD } from "../src/world/bitterroot.js";
import { peopleForPlace, placeAncestry } from "../src/world/query.js";

test("Bitterroot hierarchy includes the authored regions and first enclave", () => {
  const ids = new Set(BITTERROOT_WORLD.places.map((place) => place.id));
  for (const id of ["whispering-woods", "bitterroot-bluffs", "bitterroot-orphanage", "bitterroot-peak", "howling-hills", "brackenjaw-enclave"]) {
    assert.ok(ids.has(id), id);
  }
  assert.deepEqual(
    placeAncestry("brackenjaw-ranger-station").map((place) => place.id),
    ["bitterroot", "howling-hills", "splitpine-reach", "brackenjaw-enclave", "brackenjaw-ranger-station"],
  );
});

test("the new ranger area has no Whiteclaw identity or lore", () => {
  const serialized = JSON.stringify(BITTERROOT_WORLD).toLowerCase();
  for (const forbidden of ["heather whiteclaw", "valerie", "whiteclaw"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("all inhabitants are speaking ferals with valid mixed body forms and humans are forbidden", () => {
  const identity = BITTERROOT_WORLD.lore.find((entry) => entry.id === "world-identity");
  assert.match(identity.content, /intelligent, speaking feral/i);
  assert.match(identity.content, /fully quadrupedal, semi-upright, or upright half-beast/i);
  assert.match(identity.content, /Humans do not exist/i);
  assert.ok(BITTERROOT_WORLD.characters.every((character) => character.species && character.species !== "human"));
  assert.ok(BITTERROOT_WORLD.characters.every((character) => /^(quadrupedal|semi-upright|upright)-feral$/.test(character.bodyForm)));
});

test("place availability does not dump the whole world into cast", () => {
  const station = peopleForPlace("brackenjaw-ranger-station").map(({ character }) => character.id);
  const trail = peopleForPlace("east-marker-trail").map(({ character }) => character.id);
  assert.deepEqual(station.sort(), ["pip-holt", "ragna-holt"]);
  assert.deepEqual(trail, ["ragna-holt"]);
});

test("Pip is a correctly gated minor", () => {
  const pip = BITTERROOT_WORLD.characters.find((character) => character.id === "pip-holt");
  assert.equal(pip.age, 12);
  assert.equal(pip.ageCategory, "minor");
  assert.equal(pip.contentRating, "general");
  assert.ok(pip.invariants.some((line) => /No sexual or romanticized adult content/i.test(line)));
});

test("Bitterroot is explicitly pre-industrial", () => {
  const era = BITTERROOT_WORLD.lore.find((entry) => entry.id === "pre-industrial-era");
  assert.equal(era.constant, true);
  assert.match(era.content, /pre-industrial/i);
  assert.match(era.content, /Do not introduce electricity/i);
});
