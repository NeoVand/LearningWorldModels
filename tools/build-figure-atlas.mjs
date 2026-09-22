import fs from "node:fs";
import { registry } from "../book/edition2/visuals/core.js";
import "../book/edition2/visuals/arm.js";
import "../book/edition2/visuals/foundations.js";
import "../book/edition2/visuals/learning.js";
import "../book/edition2/visuals/statistics.js";
import "../book/edition2/visuals/pipeline.js";
import "../book/edition2/visuals/evidence.js";
import "../book/edition2/visuals/research.js";
import "../book/edition2/visuals/plates.js";
import { chapters } from "../book/edition2/curriculum.mjs";
const ledger = JSON.parse(
  fs.readFileSync(new URL("../book/figure-plan.json", import.meta.url), "utf8"),
);
const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const book = fs.readFileSync(
  new URL("../world-models.html", import.meta.url),
  "utf8",
);
const content = chapters
  .map(
    ([chapter, title]) =>
      `<section><h2>${esc(title)}</h2><div class="grid">${ledger.items
        .filter((i) => i.chapter === chapter)
        .sort(
          (a, b) =>
            book.indexOf(`id="${a.anchor}"`) - book.indexOf(`id="${b.anchor}"`),
        )
        .map((i) => {
          const spec = registry[i.id];
          return `<a class="card" href="world-models.html#${i.anchor}"><span>${i.id}</span><h3>${esc(spec?.title ?? i.title)}</h3><p>${esc(spec?.question ?? i.brief)}</p></a>`;
        })
        .join("")}</div></section>`,
  )
  .join("");
fs.writeFileSync(
  new URL("../figure-atlas.html", import.meta.url),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>World models — figure atlas</title><style>body{max-width:1080px;margin:60px auto;padding:0 24px;background:#edf1f7;color:#29364b;font:16px/1.6 system-ui}h1,h2{font-family:Georgia,serif;font-weight:400}h1{font-size:44px}h2{margin-top:42px}a{color:#237487;text-underline-offset:4px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px}.card{display:block;color:inherit;text-decoration:none;background:#fafcff;border:1px solid #d6deeb;border-radius:10px;padding:16px}.card:hover{border-color:#237487}.card span{font-size:12px;color:#775ba8}.card h3{font-size:16px;font-weight:500;margin:.4rem 0}.card p{font-size:13px;color:#5d6c83;margin-bottom:0}@media(prefers-color-scheme:dark){body{background:#141719;color:#e1e7f2}.card{background:#1b222d;border-color:#394556}.card p{color:#a9b8cd}a{color:#87c4d7}.card span{color:#b7a5de}}</style><h1>A figure for every step</h1><p>Explore the questions behind the course’s 93 teaching figures and five live-laboratory integrations.</p><p><a href="world-models.html">Read the course</a> · <a href="illustration-gallery.html">Illustration choices</a></p>${content}</html>`,
);
