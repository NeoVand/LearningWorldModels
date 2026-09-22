import fs from "node:fs";
const { chromium } = await import(
  process.env.BOOK_PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ headless: true });
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
const reports = [];
for (const [width, theme] of [
  [1440, "light"],
  [1440, "dark"],
  [390, "light"],
  [390, "dark"],
]) {
  await page.setViewportSize({ width, height: 1100 });
  await page.evaluate((theme) => {
    document.documentElement.dataset.theme = theme;
    dispatchEvent(new Event("book-theme-change"));
  }, theme);
  const folder = `tmp/implementation/visuals-${width}-${theme}`;
  fs.mkdirSync(folder, { recursive: true });
  for (const el of await page.locator(".teaching-visual").all()) {
    const id = await el.getAttribute("data-visual");
    await el.screenshot({ path: `${folder}/${id}.png`, timeout: 20000 });
  }
  const layout = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.body.scrollWidth,
    mathOverflow: [...document.querySelectorAll(".katex-display")]
      .filter((e) => e.scrollWidth > e.clientWidth + 3)
      .map((e) => ({
        id:
          e.closest("[data-visual]")?.dataset.visual ?? e.closest("article").id,
        text: e.textContent.slice(0, 100),
        width: e.clientWidth,
        scroll: e.scrollWidth,
      })),
    badText: [...document.querySelectorAll(".teaching-visual svg text")]
      .filter((e) => {
        let b = e.getBBox(),
          svg = e.ownerSVGElement.viewBox.baseVal;
        return (
          b.x < -2 ||
          b.x + b.width > svg.width + 2 ||
          b.y < -2 ||
          b.y + b.height > svg.height + 2
        );
      })
      .map((e) => ({
        id: e.closest("[data-visual]").dataset.visual,
        text: e.textContent,
      })),
    code: [...document.querySelectorAll("p code,li code,td code")].map((e) => ({
      color: getComputedStyle(e).color,
      background: getComputedStyle(e).backgroundColor,
    })),
    katexErrors: document.querySelectorAll(".katex-error").length,
  }));
  reports.push({ theme, ...layout });
}
const states = await page.evaluate(() => {
  const failures = [];
  let count = 0;
  for (const instance of BookVisuals) {
    const ranges = instance.el.querySelectorAll("input[type=range]");
    for (const input of ranges) {
      for (const value of [input.min, input.max]) {
        try {
          input.value = value;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          if (
            [
              ...instance.el.querySelectorAll(
                "svg [d],svg [cx],svg [cy],svg [x],svg [y]",
              ),
            ].some((e) =>
              [...e.attributes].some((a) =>
                /NaN|undefined|Infinity/.test(a.value),
              ),
            )
          )
            failures.push({
              id: instance.el.dataset.visual,
              key: input.dataset.key,
              value,
              reason: "non-finite output",
            });
          count++;
        } catch (e) {
          failures.push({ id: instance.el.dataset.visual, error: e.message });
        }
      }
    }
  }
  return { count, failures };
});
fs.writeFileSync(
  "research/implementation/visual-audit.json",
  JSON.stringify({ reports, states, errors }, null, 2),
);
console.log(
  JSON.stringify({
    reports: reports.map((r) => ({
      width: r.width,
      theme: r.theme,
      scroll: r.scroll,
      mathOverflow: r.mathOverflow.length,
      badText: r.badText,
    })),
    states,
    errors,
  }),
);
await browser.close();
