import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katex = require("katex");
const { marked } = await import("marked");
const root = path.resolve(import.meta.dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const b64 = (p) => fs.readFileSync(p).toString("base64");
const katexRoot = path.dirname(require.resolve("katex/package.json"));
let css = fs
  .readFileSync(path.join(katexRoot, "dist/katex.min.css"), "utf8")
  .replace(/url\(([^)]+)\)/g, (_, url) => {
    const f = path.join(katexRoot, "dist", url.replace(/["']/g, ""));
    return `url(data:font/${path.extname(f).slice(1)};base64,${b64(f)})`;
  });
css +=
  `@font-face{font-family:Newsreader;src:url(data:font/woff2;base64,${b64(path.join(root, "assets/newsreader.woff2"))}) format('woff2');font-weight:200 800;font-style:normal;font-display:swap}` +
  read("book/style.css");
const macros = {
  "\\obs": "\\textcolor{#555e67}{\\mathbf{o}}",
  "\\lat": "\\textcolor{#326756}{\\mathbf{z}}",
  "\\pred": "\\textcolor{#315eb1}{\\hat{\\mathbf{z}}}",
  "\\act": "\\textcolor{#a04b27}{\\mathbf{a}}",
  "\\loss": "\\textcolor{#7653a2}{\\mathcal{L}}",
};
function colorSymbols(tex) {
  return tex
    .replace(/\\hat\s*\{?z\}?/g, "COLORPREDTOKEN")
    .replace(/(?<![A-Za-z\\])z(?![A-Za-z])/g, "{\\textcolor{#326756}{z}}")
    .replace(/(?<![A-Za-z\\])o(?![A-Za-z])/g, "{\\textcolor{#555e67}{o}}")
    .replaceAll("COLORPREDTOKEN", "{\\textcolor{#315eb1}{\\hat z}}");
}
const parts = read("book/manuscript.md")
  .split(/<!-- PAGE: (.*?) \| (.*?) -->/)
  .slice(1);
const pages = [];
let mathCount = 0;
for (let i = 0; i < parts.length; i += 3) {
  const [part, title, body] = parts.slice(i, i + 3);
  const math = [];
  let md = body.replace(
    /\$\$([\s\S]*?)\$\$|\$([^\n$]+)\$/g,
    (_, display, inline) => {
      const v = katex.renderToString(
        colorSymbols(
          (display ?? inline).replaceAll("&lt;", "<").replaceAll("&gt;", ">"),
        ),
        {
          displayMode: display !== undefined,
          throwOnError: true,
          macros,
          strict: "ignore",
          output: "htmlAndMathml",
        },
      );
      mathCount++;
      return `MATHPLACEHOLDER${math.push(v) - 1}END`;
    },
  );
  let html = marked.parse(md);
  html = html.replace(/MATHPLACEHOLDER(\d+)END/g, (_, n) => math[Number(n)]);
  const n = pages.length + 1;
  pages.push({ part, title, n, id: `page-${n}`, html });
}
const groups = Map.groupBy(pages, (p) => p.part);
let toc = "";
for (const [part, items] of groups)
  toc += `<details open><summary>${part}</summary>${items.map((p) => `<a href="#${p.id}" data-page="${p.n}"><span class="n">${String(p.n).padStart(2, "0")}</span>${p.title}</a>`).join("")}</details>`;
const cover = `<svg viewBox="0 0 680 230" role="img" aria-label="An observed puck, a learned description, and three possible futures"><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10" fill="none" stroke="#b0b8af"/></marker></defs><path d="M30 165H650" stroke="#d5dacf"/><circle cx="92" cy="165" r="20" fill="#326756"/><circle cx="92" cy="165" r="31" fill="none" stroke="#326756" opacity=".15"/><path d="M140 160C195 160 195 90 260 90" fill="none" stroke="#b0b8af" marker-end="url(#arrow)"/><rect x="275" y="51" width="90" height="78" rx="3" fill="#e7ebe0" stroke="#bbc8b8"/><circle cx="295" cy="106" r="3" fill="#326756"/><circle cx="315" cy="79" r="3" fill="#326756"/><circle cx="328" cy="100" r="3" fill="#326756"/><circle cx="346" cy="69" r="3" fill="#326756"/><circle cx="311" cy="98" r="3" fill="#326756"/><circle cx="337" cy="91" r="3" fill="#326756"/><path d="M382 89C445 89 451 38 570 40M382 89C460 89 475 90 590 90M382 89C430 89 470 141 570 143" fill="none" stroke="#315eb1" stroke-width="1.5" stroke-dasharray="3 5" opacity=".65"/><circle cx="570" cy="40" r="12" fill="none" stroke="#315eb1"/><circle cx="590" cy="90" r="12" fill="#315eb1" fill-opacity=".12" stroke="#315eb1"/><circle cx="570" cy="143" r="12" fill="none" stroke="#315eb1"/><circle cx="625" cy="90" r="20" fill="none" stroke="#a04b27" stroke-dasharray="3 4"/><g font-family="system-ui,sans-serif" font-size="10" fill="#69716c" letter-spacing="1"><text x="55" y="215">OBSERVE</text><text x="284" y="165">REMEMBER</text><text x="509" y="215">IMAGINE, THEN ACT</text></g></svg>`;
let content = pages
  .map(
    (p) =>
      `<section class="page ${p.n === 1 ? "cover-page" : ""}" id="${p.id}" data-number="${p.n}"><div class="page-meta"><span>${p.part}</span><span>${String(p.n).padStart(2, "0")} / 100</span></div>${p.html}</section>`,
  )
  .join("\n");
content = content.replace(
  '<div class="cover-art" data-figure="cover"></div>',
  `<div class="cover-art">${cover}</div>`,
);
let js = fs.existsSync(path.join(root, "book/labs.js"))
  ? read("book/labs.js")
  : "";
const status =
  pages.length < 100
    ? `Work in progress · ${pages.length} / 100 pages`
    : "First edition · 100 pages";
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="An illustrated, interactive course from first principles to LeWorldModel and SIGReg."><title>Before the Move — A book about world models</title><style>${css}</style></head><body><a class="skip" href="#page-1">Skip to the book</a><header class="topbar"><button class="menu-button" aria-label="Open contents" aria-expanded="false">☰</button><a class="brand" href="#page-1">Before the Move</a><div class="top-actions"><span class="status">${status}</span><button class="focus-button">Focus</button><button id="print">Print / PDF</button></div></header><div class="progress-track"><div class="progress-fill"></div></div><nav class="rail" aria-label="Book contents"><input type="search" id="search" placeholder="Find a lesson…" aria-label="Find a lesson">${toc}</nav><main>${content}${pages.length < 100 ? '<div class="draft-note">The manuscript continues here. Architecture, planning, evaluation, and the paper companion are being written next.</div>' : ""}<footer class="footer">Original educational prose and diagrams. References are credited in the manuscript. KaTeX (MIT) and Newsreader (SIL Open Font License) are embedded for offline reading.<details><summary>Third-party notices</summary><pre>${read("assets/katex-LICENSE.txt").replaceAll("<", "&lt;")}\n${read("assets/newsreader-LICENSE.txt").replaceAll("<", "&lt;")}</pre></details></footer></main><script>${js.replaceAll("</script", "<\\/script")}</script><script>if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){let stamp;setInterval(async()=>{try{const r=await fetch('/preview-stamp',{cache:'no-store'});const s=await r.text();if(stamp&&stamp!==s)location.reload();stamp=s}catch{}},2500)}</script></body></html>`;
fs.writeFileSync(path.join(root, "world-models.html"), html);
fs.writeFileSync(path.join(root, "preview-stamp"), String(Date.now()));
fs.writeFileSync(
  path.join(root, "research/build-report.json"),
  JSON.stringify(
    {
      pages: pages.length,
      formulas: mathCount,
      bytes: Buffer.byteLength(html),
      built: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log(
  `${pages.length} pages, ${mathCount} formulas, ${(Buffer.byteLength(html) / 1e6).toFixed(2)} MB`,
);
