import { generateWithNovelAI } from "./novelai.js";
import { generateWithOllama } from "./ollama.js";

export async function generate(request, options = {}) {
  if (request.provider === "novelai") return generateWithNovelAI(request, options.novelai);
  if (request.provider === "ollama") return generateWithOllama(request, options.ollama);
  throw Object.assign(new Error("Unsupported generation provider"), { status: 400 });
}
