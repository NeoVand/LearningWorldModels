const { chromium } = await import(
  process.env.BOOK_PLAYWRIGHT_MODULE || "playwright"
);
import fs from "node:fs";
const b = await chromium.launch({
  headless: true,
  args: [
    "--enable-unsafe-webgpu",
    "--enable-features=WebGPU",
    ...(process.platform === "darwin" ? ["--use-angle=metal"] : []),
  ],
});
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(
  process.env.BOOK_URL || new URL("../world-models.html", import.meta.url).href,
);
await p.locator("#world-lab").scrollIntoViewIfNeeded();
await p.waitForFunction(() => window.WorldWorkshop?.snapshot().evaluation, {
  timeout: 120000,
});
const initial = await p.evaluate(() => WorldWorkshop.snapshot());
await p.locator("#world-train").click();
await p.waitForFunction(
  () =>
    +document.querySelector("#world-step").textContent.replaceAll(",", "") >
    5050,
  { timeout: 3600000 },
);
await p.locator("#world-stop").click();
await p.waitForFunction(
  () => !document.querySelector("#world-train").disabled,
  { timeout: 120000 },
);
const paused = await p.evaluate(() => WorldWorkshop.snapshot());
await p.evaluate(() => WorldWorkshop.train(20));
const resumed = await p.evaluate(() => WorldWorkshop.snapshot());
const forecasts = await p.evaluate(() => WorldWorkshop.forecasts());
await p
  .locator("#forecast-lab")
  .screenshot({ path: "tmp/implementation/forecast-trained.png" });
await p
  .locator("#world-lab")
  .screenshot({ path: "tmp/implementation/continuous-trained.png" });
const result = { initial, paused, resumed, forecasts, errors };
fs.writeFileSync(
  "research/implementation/continuous-training.json",
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify({
    initial: initial.evaluation.step,
    paused: paused.evaluation.step,
    resumed: resumed.evaluation.step,
    forecasts: forecasts.length,
    errors,
  }),
);
if (
  paused.evaluation.step <= 5000 ||
  resumed.evaluation.step !== paused.evaluation.step + 20 ||
  errors.length
)
  throw Error("Continuous training failed");
await b.close();
