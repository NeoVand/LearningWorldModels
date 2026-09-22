import fs from "node:fs";
import assert from "node:assert/strict";
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
await page.addStyleTag({
  content: "header,.progress{visibility:hidden!important}",
});
const layouts = [];
for (const [width, media, theme] of [
  [1440, "screen", "light"],
  [800, "screen", "dark"],
  [390, "screen", "light"],
  [390, "screen", "dark"],
  [615, "print", "light"],
]) {
  await page.setViewportSize({ width, height: 1100 });
  await page.emulateMedia({ media });
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    dispatchEvent(new Event("book-theme-change"));
  }, theme);
  const report = await page.evaluate(() => {
    const figures = [...document.querySelectorAll(".teaching-visual")];
    const orphanPlots = [
      ...document.querySelectorAll(".teaching-visual .visual-panels"),
    ]
      .filter((row) => {
        const plots = [...row.children].filter((p) =>
          p.querySelector(':scope > svg[role="img"]'),
        );
        return (
          new Set(plots.map((p) => Math.round(p.getBoundingClientRect().top)))
            .size > 1
        );
      })
      .map((row) => row.closest("[data-visual]").dataset.visual);
    const textOutside = figures.flatMap((fig) =>
      [...fig.querySelectorAll("svg text")]
        .filter((e) => {
          const b = e.getBBox(),
            v = e.ownerSVGElement.viewBox.baseVal;
          return (
            b.x < -2 ||
            b.x + b.width > v.width + 2 ||
            b.y < -2 ||
            b.y + b.height > v.height + 2
          );
        })
        .map((e) => ({ id: fig.dataset.visual, text: e.textContent })),
    );
    const legibilityTargets = new Set([
      "B1",
      "B7",
      "C4",
      "D6",
      "L6",
      "N2",
      "R5",
      "S4",
      "S5",
    ]);
    const tooSmallPlots = figures.flatMap((fig) =>
      legibilityTargets.has(fig.dataset.visual)
        ? [...fig.querySelectorAll('svg[role="img"]')]
            .filter(
              (svg) =>
                svg
                  .getAttribute("aria-label")
                  ?.includes(" as a function of ") &&
                svg.getBoundingClientRect().width < 220,
            )
            .map((svg) => ({
              id: fig.dataset.visual,
              width: Math.round(svg.getBoundingClientRect().width),
            }))
        : [],
    );
    const mathOverflow = [
      ...document.querySelectorAll(".teaching-visual .katex-display"),
    ]
      .filter((e) => e.scrollWidth > e.clientWidth + 3)
      .map((e) => e.closest("[data-visual]").dataset.visual);
    const distorted = [
      ...document.querySelectorAll(".teaching-visual svg circle"),
    ].filter((e) => {
      const m = e.getScreenCTM();
      if (!m) return false;
      return Math.abs(Math.hypot(m.a, m.b) - Math.hypot(m.c, m.d)) > 0.01;
    }).length;
    return {
      width: innerWidth,
      pageWidth: document.body.scrollWidth,
      figures: figures.length,
      orphanPlots,
      tooSmallPlots,
      textOutside,
      mathOverflow,
      distorted,
    };
  });
  layouts.push({ media, theme, ...report });
  fs.mkdirSync("tmp/layout-review", { recursive: true });
  for (const id of [
    "B1",
    "B2",
    "B4",
    "D6",
    "S5",
    "L6",
    "N2",
    "E2",
    "W3",
    "R1",
    "H2",
  ])
    await page.locator(`#visual-${id}`).screenshot({
      path: `tmp/layout-review/final-${id}-${width}-${media}-${theme}.png`,
    });
}
assert.deepEqual(errors, []);
for (const r of layouts) {
  const intentionalPhoneStacks = new Set([
    "B1",
    "B7",
    "C4",
    "D6",
    "O1",
    "R5",
    "S4",
    "S5",
  ]);
  assert.deepEqual(
    r.orphanPlots.filter(
      (id) =>
        !(
          r.media === "screen" &&
          r.width <= 620 &&
          intentionalPhoneStacks.has(id)
        ),
    ),
    [],
    `${r.width}/${r.media}: comparison plots wrapped without an intentional readable layout`,
  );
  assert.deepEqual(
    r.textOutside,
    [],
    `${r.width}/${r.media}: SVG labels clipped`,
  );
  if (r.media === "screen" && r.width <= 620)
    assert.deepEqual(
      r.tooSmallPlots,
      [],
      `${r.width}: teaching plots are too small to read`,
    );
  assert.equal(r.distorted, 0);
  assert.deepEqual(
    r.mathOverflow,
    [],
    `${r.width}/${r.media}: figure equations overflow`,
  );
  if (r.media === "screen")
    assert.ok(r.pageWidth <= r.width, `${r.width}: page overflow`);
}
fs.mkdirSync("research/layout-review", { recursive: true });
fs.writeFileSync(
  "research/layout-review/verification.json",
  JSON.stringify({ date: "2026-09-22", layouts, errors }, null, 2) + "\n",
);
console.log(JSON.stringify(layouts));
await browser.close();
