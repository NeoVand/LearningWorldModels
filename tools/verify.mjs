import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const root = path.resolve(import.meta.dirname, "..");
const pw = process.env.BOOK_PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(pw);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [],
  remote = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/^https?:/.test(r.url())) remote.push(r.url());
});
const url = pathToFileURL(path.join(root, "world-models.html")).href;
await page.goto(url);
await page.evaluate(() => document.fonts.ready);
assert.equal(await page.locator(".page").count(), 100);
assert.equal(await page.locator(".lab canvas").count(), 10);
assert.equal(await page.locator(".katex-error").count(), 0);
assert.equal(await page.locator("text=being built").count(), 0);
const numerics = await page.evaluate(() => {
  const m = window.BookMath,
    h = [-0.8, -0.1, 0.4, 1.2],
    g = m.ep(h, true),
    epsilon = 1e-5;
  const fd = h.map((_, i) => {
    const a = h.slice(),
      b = h.slice();
    a[i] += epsilon;
    b[i] -= epsilon;
    return (m.ep(a) - m.ep(b)) / (2 * epsilon);
  });
  const gradientError = Math.max(...fd.map((v, i) => Math.abs(v - g.grad[i])));
  // A distinct pairwise closed-form integral checks the frequency-grid calculation.
  const quadratureError = Math.abs(m.ep(h) / h.length - m.closedEP(h));
  const gaussian = m.sigreg(m.cloud("gaussian")),
    collapsed = m.sigreg(m.cloud("zero"));
  const shifted = m.sigreg(m.cloud("shift")),
    thin = m.sigreg(m.cloud("thin"));
  const permuted = m.ep(h.slice().reverse()),
    unchanged = m.ep(h);
  const zeroGrad = Math.max(...m.ep([0, 0, 0, 0], true).grad.map(Math.abs));
  return {
    gradientError,
    quadratureError,
    gaussian,
    collapsed,
    shifted,
    thin,
    permutationError: Math.abs(permuted - unchanged),
    zeroGrad,
  };
});
assert.ok(numerics.gradientError < 1e-7);
assert.ok(numerics.quadratureError < 0.001);
assert.ok(numerics.collapsed > numerics.gaussian * 10);
assert.ok(numerics.shifted > numerics.gaussian * 10);
assert.ok(numerics.thin > numerics.gaussian * 3);
assert.ok(numerics.permutationError < 1e-12);
assert.equal(numerics.zeroGrad, 0);
await page.locator("[data-lab=training] [data-run]").click();
const trained = await page.locator("[data-lab=training] output").innerText();
const scales = [...trained.matchAll(/w=([-\d.]+)/g)].map((m) => +m[1]);
assert.ok(scales[0] < 0.1 && scales[1] > 0.5);
await page.locator("[data-lab=planner] [data-run]").click();
const plan = await page.locator("[data-lab=planner] output").innerText();
assert.ok(+plan.match(/goal error=([\d.]+)/)[1] < 0.2);
const interactionChecks = [];
for (const name of [
  "history",
  "projection",
  "mean",
  "collapse",
  "covariance",
  "moments",
  "directions",
  "sigreg",
]) {
  const el = page.locator(`[data-lab=${name}]`),
    before = await el.locator("output").innerText();
  if (name === "history" || name === "sigreg")
    await el.locator("button").click();
  else
    await el.locator("input").evaluate((e) => {
      e.value = e.value === e.max ? e.min : e.max;
      e.dispatchEvent(new Event("input", { bubbles: true }));
    });
  assert.notEqual(
    await el.locator("output").innerText(),
    before,
    name + " is interactive",
  );
  interactionChecks.push(name);
}
await page.locator("#search").fill("Cramér");
assert.equal(await page.locator(".rail a:not(.toc-hidden)").count(), 1);
await page.locator("#search").fill("");
await page.setViewportSize({ width: 390, height: 844 });
await page.locator(".menu-button").click();
assert.equal(
  await page.locator(".menu-button").getAttribute("aria-expanded"),
  "true",
);
const mobile = await page.evaluate(() => ({
  width: innerWidth,
  scrollWidth: document.body.scrollWidth,
}));
assert.equal(mobile.scrollWidth, mobile.width);
await page.locator(".menu-button").click();
await page.locator("#page-60").scrollIntoViewIfNeeded();
await page.screenshot({ path: path.join(root, "tmp/mobile-verified.png") });
// Fresh load yields reproducible printed diagrams. Run the learning example for
// the static edition so its plotted result is informative without a button.
await page.goto(url);
await page.evaluate(() => document.fonts.ready);
await page.locator("[data-lab=training] [data-run]").click();
await page.setViewportSize({ width: 598, height: 858 });
await page.emulateMedia({ media: "print" });
await page.evaluate(() =>
  document.querySelectorAll("main details").forEach((d) => (d.open = true)),
);
const layout = await page.evaluate(() => ({
  overflow: [...document.querySelectorAll(".katex-display")]
    .filter((e) => e.scrollWidth > e.clientWidth + 3)
    .map((e) => e.closest(".page").dataset.number),
  heights: [...document.querySelectorAll(".page")].map((e) => ({
    page: +e.dataset.number,
    height: e.getBoundingClientRect().height,
  })),
}));
assert.deepEqual(layout.overflow, []);
assert.ok(
  layout.heights.every((x) => x.height < 858),
  "Every lesson fits the print content box",
);
await page.pdf({
  path: path.join(root, "output/pdf/before-the-move.pdf"),
  preferCSSPageSize: true,
  printBackground: true,
  tagged: true,
  outline: true,
});
assert.deepEqual(errors, []);
assert.deepEqual(remote, []);
await browser.close();
const report = {
  checked: new Date().toISOString(),
  pages: 100,
  labs: 10,
  numerics,
  training: trained,
  planning: plan,
  interactionChecks,
  mobile,
  printMaxHeight: Math.max(...layout.heights.map((x) => x.height)),
  browserErrors: errors,
  remoteRequests: remote,
};
fs.writeFileSync(
  path.join(root, "research/verification.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
