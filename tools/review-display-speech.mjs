// Optional editorial pass. Reads an untracked local .env, calls OpenAI, and
// stores reviewed speech as checked-in content. The book build itself is offline.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildVoiceIndex } from "./build-voice-index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "book/voice/equation-speech.json");
const env = fs.readFileSync(path.join(root, ".env"), "utf8");
const apiKey = env
  .match(/^OPENAI_API_KEY=(.*)$/m)?.[1]
  ?.trim()
  .replace(/^['"]|['"]$/g, "");
if (!apiKey)
  throw new Error("OPENAI_API_KEY is missing from the local .env file");
const model = "gpt-5.5";
const index = buildVoiceIndex();
const saved = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
  : { schemaVersion: 1, model, items: {} };
if (saved.schemaVersion !== 1 || !saved.items)
  throw new Error("Unexpected equation speech file format");
const itemById = new Map(index.items.map((item) => [item.id, item]));
const sectionById = new Map(
  index.sections.map((section) => [section.id, section]),
);
const candidates = index.items.filter(
  (item) =>
    item.kind === "equation" &&
    item.display &&
    item.speechSource === "heuristic" &&
    !saved.items[item.id],
);
const limit = Number(
  process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ??
    Infinity,
);
const todo = candidates.slice(0, limit);

function context(item) {
  const section = sectionById.get(item.sectionId);
  const at = section.itemIds.indexOf(item.id);
  const neighbors = (direction, count = 2) => {
    const result = [];
    for (
      let i = at + direction;
      i >= 0 && i < section.itemIds.length && result.length < count;
      i += direction
    ) {
      const other = itemById.get(section.itemIds[i]);
      if (other.kind === "paragraph") result.push(other.text.slice(0, 620));
    }
    return direction < 0 ? result.reverse() : result;
  };
  return {
    id: item.id,
    chapter: index.chapters.find((chapter) => chapter.id === item.chapterId)
      ?.title,
    section: section.title,
    latex: item.latex,
    before: neighbors(-1),
    after: neighbors(1),
  };
}

const schema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string" }, speech: { type: "string" } },
        required: ["id", "speech"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};
const instructions = `You are the editorial mathematician for a beginner-friendly world-model course. Write spoken explanations for the supplied DISPLAY equations. Your output will be narrated by a humanlike voice when a reader clicks an equation. For each equation:
- Explain what the equation calculates or asserts and why this step matters in this section. Name quantities and operations in plain language. For a multi-line derivation, follow the sequence of steps and key algebra, including any assumptions that make an equality valid.
- Use the surrounding chapter prose as factual context. Preserve the book's notation and distinction between observations, learned embeddings, predictions, batch statistics, and physical actions. Do not infer an experiment, theorem, or causal claim that the context does not support.
- Write one to three concise, connected sentences, usually 30–85 words. This is teaching, not a character-by-character recitation. Avoid raw LaTeX, dollar signs, backslashes, and unexplained letter names; when a symbol matters, introduce its role.
- Do not say "the equation above" or "as shown"; each item must make sense when heard alone. Avoid jargon without a brief explanation.
Return one item for each input ID and no extra IDs.`;

async function request(batch) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        reasoning: { effort: "medium" },
        input: [
          { role: "system", content: instructions },
          {
            role: "user",
            content: JSON.stringify({ equations: batch.map(context) }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "equation_narration",
            schema,
            strict: true,
          },
        },
        max_output_tokens: 7000,
      }),
      signal: AbortSignal.timeout(180000),
    });
    if (response.ok) {
      const result = await response.json();
      if (result.status !== "completed")
        throw new Error(`Incomplete response: ${result.status}`);
      const output = result.output
        ?.flatMap((entry) => entry.content ?? [])
        .find((entry) => entry.type === "output_text")?.text;
      if (!output) throw new Error("Response contained no output text");
      return JSON.parse(output).items;
    }
    const error = await response.json().catch(() => ({}));
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 3)
      throw new Error(
        `OpenAI response ${response.status}: ${String(error.error?.message ?? "request failed").slice(0, 250)}`,
      );
    await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** attempt));
  }
}

function validate(batch, result) {
  const ids = new Set(batch.map((item) => item.id));
  if (result.length !== batch.length)
    throw new Error(
      `Expected ${batch.length} narrations, got ${result.length}`,
    );
  for (const entry of result) {
    if (!ids.has(entry.id) || typeof entry.speech !== "string")
      throw new Error(`Unexpected narration ID: ${entry.id}`);
    if (/\\[A-Za-z]|\$|<[^>]+>/.test(entry.speech))
      throw new Error(`Raw markup in ${entry.id}`);
    if (entry.speech.trim().split(/\s+/).length < 15)
      throw new Error(`Narration too short for ${entry.id}`);
  }
}

for (let start = 0; start < todo.length; start += 8) {
  const batch = todo.slice(start, start + 8);
  const result = await request(batch);
  validate(batch, result);
  for (const entry of result) saved.items[entry.id] = entry.speech.trim();
  fs.writeFileSync(outputPath + ".tmp", JSON.stringify(saved, null, 2) + "\n");
  fs.renameSync(outputPath + ".tmp", outputPath);
  console.log(
    `Reviewed ${Object.keys(saved.items).length} display equations; ${Math.max(0, candidates.length - start - batch.length)} remain in this run.`,
  );
}
if (!todo.length)
  console.log(
    "All candidate display equations already have reviewed narration.",
  );
