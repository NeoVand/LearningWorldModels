import assert from "node:assert/strict";
import fs from "node:fs";
const { chromium } = await import(
  process.env.BOOK_PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  headless: true,
  args: [
    "--enable-unsafe-webgpu",
    "--enable-features=WebGPU",
    ...(process.platform === "darwin" ? ["--use-angle=metal"] : []),
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(
  process.env.BOOK_URL || new URL("../world-models.html", import.meta.url).href,
);
await page.evaluate(() => document.fonts.ready);
await page.locator("#world-lab").scrollIntoViewIfNeeded();
await page.waitForFunction(
  () => WorldWorkshop.snapshot().forecasts?.length === 3,
  { timeout: 120000 },
);
const before = await page.evaluate(() => WorldWorkshop.snapshot());
assert.equal(before.evaluation.step, 0);
assert.equal(await page.locator("#future-choices canvas").count(), 14);
await page.locator("#forecast-lab").scrollIntoViewIfNeeded();
await page.locator("[data-forecast-play]").click();
await page.waitForTimeout(900);
assert.ok(+(await page.locator("#world-forecasts output").innerText()) > 0);
await page.locator("#world-forecasts input").fill("12");
assert.equal(await page.locator("#world-forecasts .arm-mechanism").count(), 6);
await page
  .locator("#forecast-lab")
  .screenshot({ path: "tmp/implementation/forecast-untrained-final.png" });
await page.locator("#world-train").click();
await page.waitForFunction(
  () =>
    +document.querySelector("#world-step").textContent.replaceAll(",", "") >=
    50,
  { timeout: 120000 },
);
await page.locator("#world-stop").click();
await page.waitForFunction(
  () => !document.querySelector("#world-train").disabled,
  { timeout: 120000 },
);
const paused = await page.evaluate(() => WorldWorkshop.snapshot());
await page.evaluate(() => WorldWorkshop.train(5));
const resumed = await page.evaluate(() => WorldWorkshop.snapshot());
assert.equal(resumed.evaluation.step, paused.evaluation.step + 5);
assert.equal(resumed.forecastStep, 0);
const trace = [];
for (const stage of ["Projection", "Phase", "Average", "Discrepancy"]) {
  await page.locator(`#visual-I3 [data-value="${stage}"]`).click();
  const lines = await page
    .locator("#visual-I3 .trace-active-line")
    .allTextContents();
  assert.ok(lines.length > 0);
  trace.push({ stage, lines });
}
const layout = [];
for (const theme of ["light", "dark"]) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    dispatchEvent(new Event("book-theme-change"));
  }, theme);
  for (const [id, selector] of [
    ["code", "#implementation .code-wrap"],
    ["attention", "#attention-lab"],
    ["S7", "#visual-S7"],
    ["N1", "#visual-N1"],
    ["D4", "#visual-D4"],
    ["D6", "#visual-D6"],
    ["O1", "#visual-O1"],
    ["forecast", "#forecast-lab"],
  ]) {
    await page
      .locator(selector)
      .first()
      .screenshot({ path: `tmp/implementation/final-${id}-${theme}.png` });
  }
  const report = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    scroll: document.body.scrollWidth,
    width: innerWidth,
    mathOverflow: [...document.querySelectorAll(".katex-display")]
      .filter((e) => e.scrollWidth > e.clientWidth + 3)
      .map((e) => e.closest("[data-visual]")?.id || e.closest("article")?.id),
    inlineCode: [...document.querySelectorAll("p code,li code,td code")].map(
      (e) => ({
        text: e.textContent,
        bg: getComputedStyle(e).backgroundColor,
        color: getComputedStyle(e).color,
      }),
    ),
    mathFragments: document.querySelectorAll(".katex").length,
    coloredFragments: [...document.querySelectorAll(".katex")].filter((e) =>
      e.querySelector('[class*="math-"]'),
    ).length,
    distortedCircles: [
      ...document.querySelectorAll("[data-visual] circle"),
    ].filter((e) => {
      let m = e.getScreenCTM();
      return Math.abs(Math.hypot(m.a, m.b) - Math.hypot(m.c, m.d)) > 0.01;
    }).length,
  }));
  assert.equal(report.width, report.scroll);
  assert.equal(report.distortedCircles, 0);
  assert.deepEqual(report.mathOverflow, []);
  layout.push(report);
}
assert.notEqual(layout[0].inlineCode[0].bg, layout[1].inlineCode[0].bg);
const choiceStates = await page.evaluate(() => {
  let count = 0;
  const failures = [];
  for (const v of BookVisuals) {
    for (const button of v.el.querySelectorAll("[data-value]")) {
      try {
        button.click();
        count++;
        if (
          [...v.el.querySelectorAll("svg [d],svg [cx],svg [x]")].some((e) =>
            [...e.attributes].some((a) =>
              /NaN|undefined|Infinity/.test(a.value),
            ),
          )
        )
          failures.push(v.el.dataset.visual);
      } catch (e) {
        failures.push(v.el.dataset.visual + ": " + e.message);
      }
    }
  }
  return { count, failures };
});
assert.deepEqual(choiceStates.failures, []);
await page.emulateMedia({ reducedMotion: "reduce" });
await page.locator("#visual-O2").scrollIntoViewIfNeeded();
const t = await page.locator("#visual-O2 input").inputValue();
await page.locator("#visual-O2 [data-action=play]").click();
assert.notEqual(await page.locator("#visual-O2 input").inputValue(), t);
assert.deepEqual(errors, []);
fs.writeFileSync(
  "research/implementation/completion-check.json",
  JSON.stringify(
    {
      initialStep: before.evaluation.step,
      paused: paused.evaluation.step,
      resumed: resumed.evaluation.step,
      forecastsRemainAtStep: resumed.forecastStep,
      trace,
      choiceStates,
      layout,
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
console.log(
  "Completed-book interaction, theme and numerical-display checks passed.",
);
