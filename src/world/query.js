import { BITTERROOT_WORLD } from "./bitterroot.js";

export function getPlace(placeId) {
  return BITTERROOT_WORLD.places.find((place) => place.id === placeId) ?? null;
}

export function getCharacter(characterId) {
  return BITTERROOT_WORLD.characters.find((character) => character.id === characterId) ?? null;
}

export function getScenario(scenarioId) {
  return BITTERROOT_WORLD.scenarios.find((scenario) => scenario.id === scenarioId) ?? null;
}

export function placeAncestry(placeId) {
  const result = [];
  const seen = new Set();
  let cursor = getPlace(placeId);
  while (cursor) {
    if (seen.has(cursor.id)) throw new Error(`Place cycle at ${cursor.id}`);
    seen.add(cursor.id);
    result.unshift(cursor);
    cursor = cursor.parentId ? getPlace(cursor.parentId) : null;
  }
  return result;
}

export function peopleForPlace(placeId, options = {}) {
  const scenario = options.scenarioId ? getScenario(options.scenarioId) : null;
  const scenarioCast = new Set(scenario?.castIds ?? []);
  const allowed = new Set(options.includeUnlikely ? ["likely", "possible", "unlikely"] : ["likely", "possible"]);

  return BITTERROOT_WORLD.placements.flatMap((placement) => {
    const availability = placement.availability.find((entry) => entry.placeId === placeId);
    if (!availability && !scenarioCast.has(placement.characterId)) return [];
    if (availability && !allowed.has(availability.likelihood) && !scenarioCast.has(placement.characterId)) return [];
    const character = getCharacter(placement.characterId);
    return character ? [{ character, availability: availability ?? { placeId, likelihood: "likely", note: "Required by scenario." } }] : [];
  });
}
