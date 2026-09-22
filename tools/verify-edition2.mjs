import assert from "node:assert/strict";
import fs from "node:fs";
import { writeExperiment } from "./write-experiment.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as math from "../book/edition2/numerics.js";
const root = path.resolve(import.meta.dirname, "..");
const { chromium } = await import(
  process.env.BOOK_PLAYWRIGHT_MODULE || "playwright"
);
const numerics = {};
const points = [
    [-0.7, 0.2],
    [0.4, -0.9],
    [1.2, 0.3],
  ],
  g = math.sigreg(points, { gradient: true });
let maxError = 0;
for (let b = 0; b < points.length; b++)
  for (let j = 0; j < 2; j++) {
    const plus = points.map((p) => p.slice()),
      minus = points.map((p) => p.slice()),
      eps = 1e-5;
    plus[b][j] += eps;
    minus[b][j] -= eps;
    maxError = Math.max(
      maxError,
      Math.abs(
        (math.sigreg(plus) - math.sigreg(minus)) / (2 * eps) - g.gradient[b][j],
      ),
    );
  }
assert.ok(maxError < 1e-7);
numerics.gradientError = maxError;
const h = [-0.8, -0.1, 0.4, 1.2];
numerics.integralError = Math.abs(
  math.ep(h, { knots: 1001, limit: 8, scaled: false }) - math.closedEP(h),
);
assert.ok(numerics.integralError < 1e-10);
assert.equal(
  math
    .ep([0, 0], { gradient: true })
    .gradient.reduce((s, x) => s + Math.abs(x), 0),
  0,
);
assert.ok(math.ep([0, 0]) > 0);
numerics.trace = math.ep([-1, 1], { knots: 3, limit: 2 });
assert.ok(Math.abs(numerics.trace - 0.09296117038726485) < 1e-12);
const browser = await chromium.launch({
  headless: true,
  args: [
    "--enable-unsafe-webgpu",
    "--enable-features=WebGPU",
    ...(process.platform === "darwin" ? ["--use-angle=metal"] : []),
  ],
});
const errors = [],
  remote = [];
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url())) remote.push(r.url());
});
await page.goto(pathToFileURL(path.join(root, "second-edition.html")).href);
await page.evaluate(() => document.fonts.ready);
assert.equal(await page.locator("article").count(), 20);
assert.equal(await page.locator(".katex-error").count(), 0);
assert.ok((await page.locator(".hljs-keyword").count()) > 0);
assert.equal(await page.locator("figure img").count(), 7);
assert.equal(await page.locator("figure.diagram").count(), 15);
const layouts = [];
for (const width of [1400, 820, 390]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.locator("#phasor-lab").scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const data = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.body.scrollWidth,
    ratios: [...document.querySelectorAll("canvas.square")].map((c) => {
      const r = c.getBoundingClientRect();
      return r.width / r.height;
    }),
    formulaOverflow: [...document.querySelectorAll(".katex-display")].filter(
      (e) => e.scrollWidth > e.clientWidth + 2,
    ).length,
  }));
  assert.equal(data.width, data.scroll);
  assert.ok(data.ratios.every((r) => Math.abs(r - 1) < 0.001));
  if (width === 1400) assert.equal(data.formulaOverflow, 0);
  layouts.push(data);
  await page.screenshot({
    path: path.join(root, `tmp/edition2/layout-${width}.png`),
  });
}
await page.locator(".menu").click();
assert.equal(await page.locator(".menu").getAttribute("aria-expanded"), "true");
await page.locator("#search").fill("Differentiate");
assert.ok((await page.locator("nav a:not(.hidden)").count()) > 0);
await page.locator("#search").fill("");
await page.locator(".menu").click();
await page.locator("#sigreg-lab [data-gradient]").click();
assert.match(
  await page.locator("[data-check]").innerText(),
  /maximum absolute error/,
);
const before = await page.locator("#phasor-lab output").innerText();
await page.locator("#phasor-lab input").evaluate((e) => {
  e.value = "2.7";
  e.dispatchEvent(new Event("input"));
});
assert.notEqual(await page.locator("#phasor-lab output").innerText(), before);
await page.setViewportSize({ width: 1400, height: 1000 });
const trials = [];
if (process.env.BOOK_TRAINING_CHECK !== "0") {
  for (const seed of [17, 41, 73]) {
    const result = await page.evaluate(async (seed) => {
      const { info, backend } = await WorldWorkshop.init({ seed });
      if (info.config.resolution !== 64 || info.parameters !== 545680)
        throw Error("Expected the full 64 × 64 training model");
      const untrained = WorldWorkshop.snapshot().evaluation;
      const learned = await WorldWorkshop.train(5000);
      let comparison = null;
      if (seed === 17) {
        comparison = await WorldWorkshop.compare();
        await WorldWorkshop.forecasts();
      }
      const printRecord = seed === 17 ? WorldWorkshop.snapshot() : null;
      const controls = [];
      for (const goal of [0, 1, 2, 3]) {
        document.querySelector("#world-goal").value = String(goal);
        await WorldWorkshop.resetScene();
        const before = await WorldWorkshop.resetScene();
        const r = await WorldWorkshop.control(40);
        controls.push({
          goal,
          initial: before.error,
          errors: r.trajectory.map((t) => t.error),
          final: r.scene.error,
          minimum: Math.min(...r.trajectory.map((t) => t.error)),
        });
      }
      const trim = (v) => ({
        step: v.step,
        predictionLoss: v.predictionLoss,
        persistenceLoss: v.persistenceLoss,
        spread: v.spread,
        effectiveRank: v.effectiveRank,
        shuffledActionLoss: v.shuffledActionLoss,
        noHistoryLoss: v.noHistoryLoss,
      });
      return {
        seed,
        backend,
        parameters: info.parameters,
        config: info.config,
        printRecord,
        untrained: trim(untrained),
        learned: trim(learned.evaluation),
        training: learned.metrics,
        comparison: comparison
          ? {
              regularized: trim(comparison.regularized),
              unregularized: trim(comparison.unregularized),
              complete: comparison.complete,
            }
          : null,
        controls,
      };
    }, seed);
    assert.ok(
      result.learned.predictionLoss / result.learned.persistenceLoss < 0.3,
    );
    assert.ok(result.learned.spread > 0.5);
    if (result.comparison)
      assert.ok(result.comparison.unregularized.spread < 0.001);
    if (result.printRecord) {
      writeExperiment(
        path.join(root, "research/edition2/first-training-run.json"),
        result.printRecord,
      );
      delete result.printRecord;
    }
    trials.push(result);
    console.log(
      JSON.stringify({
        seed,
        backend: result.backend,
        ratio: result.learned.predictionLoss / result.learned.persistenceLoss,
        spread: result.learned.spread,
        controls: result.controls.map((x) => ({
          goal: x.goal,
          min: x.minimum,
          final: x.final,
        })),
      }),
    );
  }
  // Stop must interrupt a real long run; resuming must preserve the update count.
  const paused = await page.evaluate(async () => {
    await WorldWorkshop.init({ seed: 17 });
    const run = WorldWorkshop.train(100000);
    setTimeout(() => WorldWorkshop.stop(), 150);
    const a = await run;
    const b = await WorldWorkshop.train(25);
    return { paused: a.metrics.step, resumed: b.metrics.step };
  });
  assert.ok(paused.paused < 100000);
  assert.equal(paused.resumed, paused.paused + 25);
  trials.push({ pauseResume: paused });
  // Exercise the non-GPU path with an explicitly small real model.
  const fallback = await page.evaluate(async () => {
    const r = await WorldWorkshop.init(
      {
        resolution: 8,
        hidden: 16,
        predictorHidden: 16,
        latent: 4,
        batch: 8,
        trainEpisodes: 4,
        stepsPerEpisode: 16,
      },
      "wasm",
    );
    const a = await WorldWorkshop.train(3);
    return { backend: r.backend, step: a.metrics.step, loss: a.metrics.loss };
  });
  assert.equal(fallback.backend, "wasm");
  assert.equal(fallback.step, 3);
  assert.ok(Number.isFinite(fallback.loss));
  trials.push({ fallback });
}
assert.deepEqual(errors, []);
assert.deepEqual(remote, []);
const report = {
  verified: new Date().toISOString(),
  numerics,
  layouts,
  trials,
  errors,
  remote,
};
fs.writeFileSync(
  path.join(
    root,
    process.env.BOOK_TRAINING_CHECK === "0"
      ? "research/edition2/visual-verification.json"
      : "research/edition2/verification.json",
  ),
  JSON.stringify(report, null, 2),
);
await browser.close();
console.log("Edition 2 checks passed.");
