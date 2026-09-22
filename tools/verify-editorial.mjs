import assert from "node:assert/strict";
import fs from "node:fs";
import katex from "katex";
import {
  macros,
  semanticLatex,
  mathTrust,
} from "../book/edition2/notation.mjs";
import { niceTicks, powerLabel } from "../book/edition2/visuals/core.js";
const render = (s) =>
  katex.renderToString(semanticLatex(s), {
    macros,
    trust: mathTrust,
    throwOnError: true,
    strict: "ignore",
  });
for (const s of [
  String.raw`(uv)(x+h)`,
  String.raw`\lambda h u p Q K V`,
  String.raw`\theta_{\rm momentum}`,
])
  assert.ok(
    !render(s).includes('class="enclosing math-'),
    "Bare letters must not acquire semantic colors",
  );
for (const [s, role] of [
  [String.raw`\action{a}_t`, "act"],
  [String.raw`\predicted{\hat z}`, "pred"],
  [String.raw`\uvec`, "aux-one"],
  [String.raw`\freq`, "aux-two"],
])
  assert.ok(render(s).includes("math-" + role));
assert.deepEqual(niceTicks(-4, 5), [-4, -2, 0, 2, 4]);
assert.deepEqual(niceTicks(0, 0.006, 3), [0, 0.002, 0.004, 0.006]);
assert.equal(powerLabel(-4), "10⁻⁴");
const { chromium } = await import(
  process.env.BOOK_PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(
  process.env.BOOK_URL || new URL("../world-models.html", import.meta.url).href,
);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() =>
  document.querySelectorAll("article details").forEach((d) => (d.open = true)),
);
const report = { layouts: [] };
for (const width of [375, 390, 800, 1440]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (t) => (document.documentElement.dataset.theme = t),
      theme,
    );
    const result = await page.evaluate(() => ({
      overflow: [...document.querySelectorAll("article .katex-display")]
        .filter(
          (e) => !e.closest("figure") && e.scrollWidth > e.clientWidth + 2,
        )
        .map((e) => ({
          chapter: e.closest("article").id,
          ratio: e.scrollWidth / e.clientWidth,
          tex: e.querySelector("annotation")?.textContent,
        })),
      brokenLinks: [...document.querySelectorAll('a[href^="#"]')]
        .filter((a) => !document.getElementById(a.hash.slice(1)))
        .map((a) => a.hash),
      images: [...document.images].filter(
        (i) => !i.hasAttribute("width") || !i.hasAttribute("height"),
      ).length,
      outcomes: document.querySelectorAll(".chapter-outcome").length,
      mathErrors: document.querySelectorAll(".katex-error").length,
      pageOverflow: document.body.scrollWidth > innerWidth + 2,
    }));
    report.layouts.push({ width, theme, ...result });
    assert.deepEqual(
      result.overflow,
      [],
      `Equation width at ${width} ${theme}`,
    );
    assert.deepEqual(result.brokenLinks, []);
    assert.equal(result.images, 0);
    assert.equal(result.outcomes, 20);
    assert.equal(result.mathErrors, 0);
    assert.equal(result.pageOverflow, false);
  }
}
// WCAG ratios for small semantic and analytical text on both reading surfaces.
report.contrast = await page.evaluate(() => {
  const linear = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = (hex) => {
    const c = hex.match(/[a-f\d]{2}/gi).map((x) => linear(parseInt(x, 16)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const rows = [];
  for (const theme of ["light", "dark"]) {
    document.documentElement.dataset.theme = theme;
    const css = getComputedStyle(document.documentElement);
    for (const name of [
      "blue",
      "violet",
      "teal",
      "amber",
      "red",
      "muted",
      "math-aux-one",
      "math-aux-two",
      "math-aux-three",
    ])
      for (const bg of ["paper", "surface"]) {
        const a = lum(css.getPropertyValue("--" + name).trim()),
          b = lum(css.getPropertyValue("--" + bg).trim());
        rows.push({
          theme,
          name,
          bg,
          ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        });
      }
  }
  return rows;
});
assert.ok(
  report.contrast.every((r) => r.ratio >= 4.5),
  JSON.stringify(report.contrast.filter((r) => r.ratio < 4.5)),
);
assert.deepEqual(errors, []);
await browser.close();
fs.mkdirSync("research/editorial-review", { recursive: true });
fs.writeFileSync(
  "research/editorial-review/verification.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    layouts: report.layouts.length,
    overflow: 0,
    minimumContrast: Math.min(...report.contrast.map((x) => x.ratio)),
  }),
);
