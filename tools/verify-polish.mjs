import assert from "node:assert/strict";
import fs from "node:fs";
import {
  optimize,
  landscapes,
  normalization,
  rolloutData,
  neuronActivations,
} from "../book/edition2/visuals/experiments.js";
import { semanticLatex } from "../book/edition2/notation.mjs";
const report = {};
for (const [name, land] of Object.entries(landscapes))
  for (const [x, y] of [
    [0.3, 0.8],
    [-1.4, 0.5],
    [2, -1],
  ]) {
    const h = 1e-5,
      g = land.g(x, y),
      fd = [
        (land.f(x + h, y) - land.f(x - h, y)) / (2 * h),
        (land.f(x, y + h) - land.f(x, y - h)) / (2 * h),
      ];
    assert.ok(Math.max(...g.map((v, i) => Math.abs(v - fd[i]))) < 1e-6, name);
  }
for (const id of ["SGD", "Momentum", "Adam"]) {
  const r = optimize("Bowl", [2, 1.3], 0.05, 160, id);
  assert.ok(r.loss.at(-1) < r.loss[0] * 0.01);
  report[id] = { initial: r.loss[0], final: r.loss.at(-1) };
}
assert.equal(
  normalization({ mode: "LayerNorm", shift: 0 }).out[0][1],
  normalization({ mode: "LayerNorm", shift: 3 }).out[0][1],
);
assert.notEqual(
  normalization({ mode: "BatchNorm", shift: 0 }).out[0][1],
  normalization({ mode: "BatchNorm", shift: 3 }).out[0][1],
);
assert.equal(
  normalization({ mode: "Stored statistics", shift: 0 }).out[0][1],
  normalization({ mode: "Stored statistics", shift: 3 }).out[0][1],
);
const r = rolloutData(20);
assert.equal(r.free[1], r.forced[1]);
assert.ok(
  Math.abs(r.free[20] - r.truth[20]) > Math.abs(r.forced[20] - r.truth[20]),
);
for (const [name, a] of Object.entries(neuronActivations))
  for (const x of [-2, -0.4, 0.7, 2])
    assert.ok(
      Math.abs(a.df(x) - (a.fn(x + 1e-5) - a.fn(x - 1e-5)) / 2e-5) < 1e-5,
      name,
    );
assert.ok(
  semanticLatex(String.raw`\theta_{\rm momentum}`).includes(
    String.raw`\mathrm{momentum}`,
  ),
);
const { chromium } = await import(
  process.env.BOOK_PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  headless: true,
  args:
    process.platform === "darwin"
      ? ["--enable-unsafe-webgpu", "--use-angle=metal"]
      : ["--enable-unsafe-webgpu"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(
  process.env.BOOK_URL || new URL("../world-models.html", import.meta.url).href,
);
await page.evaluate(() => document.fonts.ready);
fs.mkdirSync("tmp/polish", { recursive: true });
fs.mkdirSync("research/polish", { recursive: true });
report.layouts = [];
const ids = [
  "visual-D2",
  "visual-D4",
  "visual-N1",
  "visual-N3",
  "visual-N5",
  "visual-N7",
  "visual-A3",
  "visual-V1",
  "uncertainty-lab",
];
for (const width of [1440, 390])
  for (const theme of ["light", "dark"]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t;
      dispatchEvent(new Event("book-theme-change"));
    }, theme);
    for (const id of ids) {
      await page.locator("#" + id).scrollIntoViewIfNeeded();
      await page
        .locator("#" + id)
        .screenshot({ path: `tmp/polish/${id}-${width}-${theme}.png` });
    }
    const layout = await page.evaluate(
      (ids) => ({
        width: innerWidth,
        scroll: document.body.scrollWidth,
        bad: ids.flatMap((id) =>
          [...document.querySelectorAll(`#${id} .katex-display`)]
            .filter((e) => e.scrollWidth > e.clientWidth + 3)
            .map(() => id),
        ),
        distorted: [
          ...document.querySelectorAll("[data-visual] circle"),
        ].filter((e) => {
          const m = e.getScreenCTM();
          return (
            m && Math.abs(Math.hypot(m.a, m.b) - Math.hypot(m.c, m.d)) > 0.02
          );
        }).length,
      }),
      ids,
    );
    assert.equal(layout.scroll, layout.width);
    assert.deepEqual(layout.bad, []);
    assert.equal(layout.distorted, 0);
    report.layouts.push({ theme, ...layout });
  }
await page.setViewportSize({ width: 1440, height: 1100 });
for (const id of ["D2", "N5"]) {
  await page.locator(`#visual-${id} [data-action=reset]`).click();
  await page.locator(`#visual-${id} [data-action=step]`).click();
  assert.equal(
    await page.locator(`#visual-${id} input[data-key=time]`).inputValue(),
    "1",
  );
  await page.locator(`#visual-${id} [data-action=reset]`).click();
  assert.equal(
    await page.locator(`#visual-${id} input[data-key=time]`).inputValue(),
    "0",
  );
  await page
    .locator(`#visual-${id} svg[data-interactive]`)
    .click({ position: { x: 180, y: 140 } });
  const state = await page.evaluate(
    (id) => BookVisuals.find((v) => v.el.dataset.visual === id).state,
    id,
  );
  assert.equal(state.time, 0);
}
await page.locator("#visual-N1").scrollIntoViewIfNeeded();
const box = await page
  .locator("#visual-N1 svg[data-interactive]")
  .boundingBox();
await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.45);
await page.waitForTimeout(150);
report.probe = await page
  .locator("#visual-N1 input[data-key=probe]")
  .inputValue();
assert.notEqual(report.probe, "0.4");
await page.locator("#visual-N3 [data-action=train]").click();
assert.equal(
  await page.evaluate(
    () => BookVisuals.find((v) => v.el.dataset.visual === "N3").state.fit.steps,
  ),
  200,
);
await page.locator("#visual-N3 [data-action=play]").click();
assert.equal(
  await page.evaluate(
    () => BookVisuals.find((v) => v.el.dataset.visual === "N3").state.fit.steps,
  ),
  225,
);
await page.locator('#visual-N3 [data-key=units][data-value="4"]').click();
assert.equal(
  await page.evaluate(
    () =>
      BookVisuals.find((v) => v.el.dataset.visual === "N3").state.fit.w.length,
  ),
  4,
);
await page
  .locator("#visual-N3 [data-key=contributions][data-value=Shown]")
  .click();
await page
  .locator("#visual-N3")
  .screenshot({ path: "tmp/polish/network-contributions.png" });
// Real camera display: inversion is only a presentation transform, never a sensor mutation.
await page.locator("#world-lab").scrollIntoViewIfNeeded();
await page.waitForFunction(() => WorldWorkshop.snapshot().evaluation, {
  timeout: 120000,
});
report.sensor = await page
  .locator("#world-current")
  .evaluate((e) => ({
    filter: getComputedStyle(e).filter,
    className: e.className,
  }));
assert.equal(report.sensor.filter, "invert(1)");
assert.deepEqual(errors, []);
report.errors = errors;
fs.writeFileSync(
  "research/polish/verification.json",
  JSON.stringify(report, null, 2),
);
await browser.close();
console.log("Polished experiments: numerical and browser checks passed.");
