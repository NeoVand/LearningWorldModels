import assert from "node:assert/strict";
import fs from "node:fs";
import { chapters } from "../book/edition2/curriculum.mjs";
import { findEquationForQuery, searchCourseIndex } from "../book/voice/query.mjs";
import { buildVoiceIndex } from "./build-voice-index.mjs";

const index = buildVoiceIndex();
const stored = JSON.parse(
  fs.readFileSync(
    new URL("../book/voice/course-index.json", import.meta.url),
    "utf8",
  ),
);
assert.deepEqual(
  stored,
  JSON.parse(JSON.stringify(index)),
  "voice index must be rebuilt after source changes",
);
assert.equal(index.chapters.length, chapters.length);
assert.equal(
  new Set(index.items.map((item) => item.id)).size,
  index.items.length,
);
assert.equal(index.counts.widget, 93);
assert.equal(index.counts.lab, 10);
const displayEquations = index.items.filter(
  (item) => item.kind === "equation" && item.display,
);
assert.equal(
  displayEquations.filter((item) =>
    ["authored", "reviewed"].includes(item.speechSource),
  ).length,
  displayEquations.length,
  "every display equation needs an editorially reviewed narration",
);
assert.equal(
  index.items.filter(
    (item) => item.kind === "widget" && item.speechSource === "authored",
  ).length,
  93,
);
let sourceEquations = 0;
for (const [chapterId] of chapters) {
  const source = fs.readFileSync(
    new URL(`../book/edition2/${chapterId}.md`, import.meta.url),
    "utf8",
  );
  sourceEquations += [...source.matchAll(/\$\$([\s\S]*?)\$\$|\$([^\n$]+)\$/g)]
    .length;
}
assert.equal(
  index.counts.equation,
  sourceEquations,
  "every source equation must be indexed",
);
for (const item of index.items) {
  assert.ok(item.speech?.trim(), `${item.id} lacks spoken text`);
  assert.ok(!/\\[A-Za-z]|\$\$/.test(item.speech), `${item.id} leaks raw TeX`);
  assert.ok(
    index.sections.some((section) => section.id === item.sectionId),
    `${item.id} has no section`,
  );
}
assert.match(
  index.items.find(
    (item) => item.kind === "equation" && /P\(A\\mid B\)/.test(item.latex),
  ).speech,
  /Bayes' rule/,
);
assert.match(
  index.items.find((item) => item.kind === "widget" && item.figureId === "O1")
    .speech,
  /camera panel/,
);
for (const number of [2, 3, 4, 5, 6]) {
  const item = findEquationForQuery(index, `LeWorldModel equation ${number}`);
  assert.equal(item?.chapterId, "paper", `paper Equation ${number} is missing`);
  assert.equal(item?.display, true, `paper Equation ${number} must be visible`);
  assert.equal(item?.speechSource, "reviewed");
  assert.ok(item?.teachingGuide?.steps?.length >= 3);
  assert.ok(item?.equationContext?.setup);
  assert.ok(item?.equationContext?.nextStep);
  assert.equal(findEquationForQuery(index, `Equation ${number}`)?.id, item.id);
}
assert.equal(findEquationForQuery(index, "Equation 42"), null);
assert.deepEqual(searchCourseIndex(index, "Equation 42"), []);
for (const [query, expected] of [
  ["why does a Gaussian batch have nonzero SIGReg score", "sigreg-equation-d78765b4c7"],
  ["derive the Gaussian characteristic function", "sigreg-equation-288cbca33e"],
  ["why can the SIGReg gradient vanish at exact collapse", "sigreg-equation-76ea4f9030"],
]) {
  assert.equal(searchCourseIndex(index, query, { limit: 1 })[0]?.id, expected);
  assert.equal(findEquationForQuery(index, query)?.id, expected);
}
assert.equal(
  findEquationForQuery(index, "this equation", {
    focusId: "paper-equation-cf1682b537",
  })?.id,
  "paper-equation-cf1682b537",
);

if (process.argv.includes("--dom")) {
  const { build } = await import("esbuild");
  const { chromium } = await import(
    process.env.BOOK_PLAYWRIGHT_MODULE || "playwright"
  );
  const source = (
    await build({
      entryPoints: [
        new URL("../book/voice/dom-binding.mjs", import.meta.url).pathname,
      ],
      bundle: true,
      format: "iife",
      globalName: "VoiceBinder",
      write: false,
    })
  ).outputFiles[0].text;
  const systemChrome = process.env.BOOK_CHROME_PATH || [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({
    headless: true,
    ...(systemChrome ? { executablePath: systemChrome } : {}),
  });
  try {
    const page = await browser.newPage();
    await page.goto(new URL("../world-models.html", import.meta.url).href);
    await page.addScriptTag({ content: source });
    const result = await page.evaluate((data) => {
      const bound = VoiceBinder.attachVoiceIndex(data);
      return {
        total: bound.size,
        missing: data.items
          .filter((item) => !bound.has(item.id))
          .map((item) => item.id),
      };
    }, index);
    assert.deepEqual(
      result.missing,
      [],
      `unbound voice items: ${result.missing.slice(0, 10).join(", ")}`,
    );
    assert.equal(result.total, index.items.length);
  } finally {
    await browser.close();
  }
}
console.log(
  `Voice index verified: ${index.chapters.length} chapters, ${index.counts.equation} equations (${displayEquations.length} reviewed displays), ${index.counts.widget} authored widgets, ${index.counts.lab} labs, ${index.items.length} listenable items${process.argv.includes("--dom") ? "; all DOM anchors bound" : ""}.`,
);
