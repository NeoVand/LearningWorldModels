const { chromium } = await import(
  process.env.BOOK_PLAYWRIGHT_MODULE || "playwright"
);
import assert from "node:assert/strict";
import fs from "node:fs";
fs.mkdirSync("tmp/camera", { recursive: true });
const b = await chromium.launch({
  headless: true,
  args: [
    "--enable-unsafe-webgpu",
    "--enable-features=WebGPU",
    ...(process.platform === "darwin" ? ["--use-angle=metal"] : []),
  ],
});
const p = await b.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(
  process.env.BOOK_URL || new URL("../world-models.html", import.meta.url).href,
);
await p.evaluate(() => document.fonts.ready);
await p.locator("#control-lab").scrollIntoViewIfNeeded();
await p.waitForFunction(
  () => WorldWorkshop.snapshot().forecasts?.length === 3,
  null,
  { timeout: 120000 },
);
const snapshot = await p.evaluate(() => WorldWorkshop.snapshot());
assert.equal(snapshot.info.config.resolution, 64);
assert.equal(snapshot.info.parameters, 545680);
const sizes = await p
  .locator("canvas.sensor-image")
  .evaluateAll((es) => es.map((e) => [e.width, e.height]));
assert.ok(sizes.length >= 16);
assert.ok(sizes.every(([w, h]) => w === 64 && h === 64));
for (const width of [1440, 390])
  for (const theme of ["light", "dark"]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.evaluate((t) => {
      document.documentElement.dataset.theme = t;
      dispatchEvent(new Event("book-theme-change"));
    }, theme);
    for (const selector of [
      "#visual-O1 .camera-inset",
      "#visual-V1",
      "#control-lab .sensor-pair",
      "#future-choices",
    ]) {
      await p
        .locator(selector)
        .screenshot({
          path: `tmp/camera/${width}-${theme}-${selector.replace(/[^a-z0-9]/gi, "")}.png`,
        });
    }
    assert.equal(
      await p.evaluate(() => document.body.scrollWidth > innerWidth),
      false,
    );
  }
const camera = p.locator("#visual-O1 .camera-inset");
const before = await camera.innerHTML();
await p.locator('#visual-O1 input[data-key="time"]').evaluate((e) => {
  e.value = "120";
  e.dispatchEvent(new Event("input", { bubbles: true }));
});
assert.notEqual(await camera.innerHTML(), before);
assert.deepEqual(errors, []);
fs.writeFileSync(
  "research/edition2/camera-verification.json",
  JSON.stringify(
    {
      verified: new Date().toISOString(),
      resolution: 64,
      parameters: snapshot.info.parameters,
      sizes,
      widths: [1440, 390],
      themes: ["light", "dark"],
      animated: true,
      errors,
    },
    null,
    2,
  ),
);
await b.close();
console.log(
  "All 16 camera canvases are native 64 × 64; previews animate, both themes fit desktop and mobile.",
);
