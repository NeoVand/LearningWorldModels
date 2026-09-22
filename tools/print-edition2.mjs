import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
const root = path.resolve(import.meta.dirname, "..");
const { chromium } = await import(
  process.env.BOOK_PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 615, height: 900 } });
await page.goto(pathToFileURL(path.join(root, "second-edition.html")).href);
await page.evaluate(() => document.fonts.ready);
await page.emulateMedia({ media: "print" });
await page.evaluate(() =>
  document.querySelectorAll("article details").forEach((d) => (d.open = true)),
);
const recorded = JSON.parse(
  fs.readFileSync(
    path.join(root, "research/edition2/first-training-run.json"),
    "utf8",
  ),
);
if (recorded.info.config.resolution !== 64 || !recorded.forecasts?.length)
  throw Error(
    "Print requires a trained 64 × 64 snapshot with matching forecasts.",
  );
await page.evaluate(
  (record) => window.WorldWorkshop.renderPrintSnapshot(record),
  recorded,
);
await page.waitForTimeout(150);
const overflow = await page.evaluate(() =>
  [...document.querySelectorAll(".katex-display")]
    .filter((e) => e.scrollWidth > e.clientWidth + 2)
    .map((e) => e.innerText.slice(0, 80)),
);
if (overflow.length)
  throw Error("Print equations exceed column: " + JSON.stringify(overflow));
await page.pdf({
  path: path.join(root, "output/pdf/before-the-move-complete.pdf"),
  preferCSSPageSize: true,
  printBackground: true,
  tagged: true,
  outline: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate:
    '<div style="font-family:Georgia,serif;font-size:8px;color:#89948b;width:100%;margin:0 40px;display:flex;justify-content:space-between"><span style="font-style:italic">Before the Move</span><span class="pageNumber"></span></div>',
});
await browser.close();
console.log(
  "Printed the complete book with a labeled recorded training example.",
);
