import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { marked } from "marked";
import katex from "katex";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import { diagram } from "./figures.mjs";
import { renderFigure } from "../book/edition2/visuals/core.js";
import "../book/edition2/visuals/arm.js";
import "../book/edition2/visuals/foundations.js";
import "../book/edition2/visuals/learning.js";
import "../book/edition2/visuals/statistics.js";
import "../book/edition2/visuals/pipeline.js";
import "../book/edition2/visuals/evidence.js";
import "../book/edition2/visuals/research.js";
import "../book/edition2/visuals/plates.js";
import { armPlate } from "./arm-plates.mjs";
import { chapters } from "../book/edition2/curriculum.mjs";
import {
  macros,
  semanticLatex,
  mathTrust,
} from "../book/edition2/notation.mjs";
import { icon, decorateControls } from "./icons.mjs";
const root = path.resolve(import.meta.dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const require = createRequire(import.meta.url);
hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);
const esc = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const kroot = path.dirname(require.resolve("katex/package.json"));
let css = fs
  .readFileSync(path.join(kroot, "dist/katex.min.css"), "utf8")
  .replace(/url\(([^)]+)\)/g, (_, url) => {
    const p = path.join(kroot, "dist", url.replace(/["']/g, ""));
    return `url(data:font/${path.extname(p).slice(1)};base64,${fs.readFileSync(p).toString("base64")})`;
  });
css +=
  `@font-face{font-family:Newsreader;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(root, "assets/newsreader.woff2")).toString("base64")}) format('woff2');font-weight:200 800;font-display:swap}` +
  read("book/edition2/style.css") +
  read("book/edition2/polish.css") +
  read("book/edition2/reader.css") +
  read("book/edition2/visuals/style.css");
for (const [family, file] of [
  ["DM Sans", "dm-sans"],
  ["JetBrains Mono", "jetbrains-mono"],
])
  css += `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(root, "assets", file + ".woff2")).toString("base64")}) format('woff2');font-weight:100 900;font-display:swap}`;
for (const [id] of chapters) {
  if (!fs.existsSync(path.join(root, `book/edition2/${id}.md`))) {
    throw new Error(`Required book chapter is missing: ${id}`);
  }
}
let mathCount = 0,
  codeCount = 0;
const headings = [];
function render(body, id) {
  body = body.replace(
    "<!-- LEARNING_ROUTE -->",
    "| Stage | Read | Check before moving on |\n|---|---|---|\n" +
      chapters
        .filter((c) => c[0] !== "reference")
        .map(
          ([key, title, stage, , outcome]) =>
            `| ${stage} | [${title}](#${key}) | ${outcome} |`,
        )
        .join("\n"),
  );
  body = body.replace(
    /<!-- CODE: ([^ ]+) -->/g,
    (_, p) =>
      "```" +
      (p.endsWith(".py") ? "python" : "javascript") +
      "\n" +
      read(p) +
      "\n```",
  );
  const blocks = [];
  body = body.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    codeCount++;
    let html = hljs.getLanguage(lang)
      ? hljs.highlight(code.trimEnd(), { language: lang }).value
      : esc(code);
    // Clone open token spans across line wrappers so multiline strings remain valid HTML.
    let active = [];
    html = html
      .split("\n")
      .map((line, i) => {
        const opening = active.join("");
        for (const token of line.matchAll(/<span[^>]*>|<\/span>/g)) {
          if (token[0] === "</span>") active.pop();
          else active.push(token[0]);
        }
        return `<span class="code-line" data-line="${i + 1}">${opening}${line}${"</span>".repeat(active.length)}</span>`;
      })
      .join("\n");
    return `\n\nCODEBLOCK${
      blocks.push(
        `<div class="code-wrap"><div class="code-header"><span>${icon("code")}<span>${lang === "python" ? "Python" : "JavaScript"}<i>reference implementation</i></span></span><button class="copy-code" aria-label="Copy code">${icon("copy")}<span>Copy</span></button></div><div class="code-body"><pre class="line-numbers" aria-hidden="true">${code
          .trimEnd()
          .split("\n")
          .map((_, i) => i + 1)
          .join(
            "\n",
          )}</pre><pre class="source-code"><code class="language-${lang}">${html}</code></pre></div></div>`,
      ) - 1
    }END\n\n`;
  });
  const maths = [];
  body = body.replace(
    /\$\$([\s\S]*?)\$\$|\$([^\n$]+)\$/g,
    (_, display, inline) => {
      mathCount++;
      return `MATHBLOCK${maths.push(katex.renderToString(semanticLatex(display ?? inline, id), { trust: mathTrust, displayMode: display !== undefined, throwOnError: true, macros, strict: "ignore", output: "htmlAndMathml" })) - 1}END`;
    },
  );
  let html = marked
    .parse(body)
    .replace(/<p>CODEBLOCK(\d+)END<\/p>/g, (_, n) => blocks[+n])
    .replace(/CODEBLOCK(\d+)END/g, (_, n) => blocks[+n])
    .replace(/MATHBLOCK(\d+)END/g, (_, n) => maths[+n]);
  html = html.replace(/<h2>(.*?)<\/h2>/g, (_, t) => {
    const slug = `${id}-${headings.filter((h) => h.chapter === id).length + 1}`;
    headings.push({ chapter: id, id: slug, title: t });
    return `<h2 id="${slug}">${t}</h2>`;
  });
  html = html.replace(
    /<figure class="diagram" data-diagram="([^"]+)"><\/figure>/g,
    (_, name) => `<figure class="diagram">${diagram(name)}</figure>`,
  );
  html = html.replace(/<!-- VISUAL: (\w+) -->/g, (_, name) =>
    renderFigure(name),
  );
  html = html.replace(
    /<figure class="arm-plate" data-arm="([^"]+)"><\/figure>/g,
    (_, name) => `<figure class="arm-plate">${armPlate(name)}</figure>`,
  );
  html = html.replace(
    /<img src="(assets\/[^\"]+)"/g,
    (_, p) =>
      `<img src="data:image/${p.endsWith(".png") ? "png" : p.endsWith(".webp") ? "webp" : "svg+xml"};base64,${fs.readFileSync(path.join(root, p)).toString("base64")}"`,
  );
  html = html.replace(
    /<details(?: class="[^"]*")?><summary>Required[^<]*?· ([^<]+)<\/summary>([\s\S]*?)<\/details>/g,
    (_, title, body) =>
      `<section class="proof"><h3>Derivation · ${title}</h3>${body}</section>`,
  );
  return decorateControls(
    html.replace(
      /<table(\s[^>]*)?>([\s\S]*?)<\/table>/g,
      (_, attrs = "", body) =>
        `<div class="table-wrap"><table${attrs}>${body}</table></div>`,
    ),
  );
}
function themedMarkup(html) {
  const roles = {
    "245ca6": "blue",
    "7044ad": "violet",
    "13796f": "teal",
    986009: "amber",
    b34832: "red",
    394549: "ink",
    aab3b0: "plot-line",
    e3e5df: "line",
  };
  return html.replace(
    /#(245ca6|7044ad|13796f|986009|b34832|394549|aab3b0|e3e5df)([0-9a-f]{2})?\b/gi,
    (_, hex, alpha) =>
      alpha
        ? `color-mix(in srgb, var(--${roles[hex.toLowerCase()]}) ${Math.round((parseInt(alpha, 16) / 255) * 100)}%, transparent)`
        : `var(--${roles[hex.toLowerCase()]})`,
  );
}
const content = chapters
  .map(
    ([id, title, status, prerequisites, outcome], i) =>
      `<article id="${id}"><div class="chapter-meta"><span>${String(i + 1).padStart(2, "0")} / ${status}</span><span>World models, from first principles</span></div>${themedMarkup(render(read(`book/edition2/${id}.md`), id))}</article>`,
  )
  .join("\n");
let js = "";
if (fs.existsSync(path.join(root, "book/edition2/ui.js"))) {
  const r = await build({
    entryPoints: [path.join(root, "book/edition2/ui.js")],
    bundle: true,
    write: false,
    format: "iife",
    target: "es2022",
    minify: true,
  });
  js = r.outputFiles[0].text;
}
let worker = "";
if (fs.existsSync(path.join(root, "book/world/book-worker.ts"))) {
  const r = await build({
    entryPoints: [path.join(root, "book/world/book-worker.ts")],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    target: "es2022",
    minify: true,
  });
  worker = Buffer.from(r.outputFiles[0].text).toString("base64");
}
const nav = chapters
  .map(
    ([id, title], i) =>
      `<section class="nav-chapter" data-chapter="${id}"><a class="chapter-link" href="#${id}"><span class="chapter-number">${String(i + 1).padStart(2, "0")}</span><span>${title}</span></a><div class="chapter-sections">${headings
        .filter((h) => h.chapter === id)
        .map((h) => `<a class="section-link" href="#${h.id}">${h.title}</a>`)
        .join("")}</div></section>`,
  )
  .join("");
const boot = `try{document.documentElement.dataset.theme=localStorage.getItem('world-models-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{document.documentElement.dataset.theme='light'}`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Before the Move — World models, from first principles</title><meta name="description" content="World models and SIGReg explained from first principles, with a real trainable model."><script>${boot}</script><style>${css}</style></head><body><a class="skip" href="#opening">Skip to the book</a><header><div class="header-left"><button class="menu" aria-label="Open contents" aria-controls="contents" aria-expanded="false">${icon("menu")}</button><a class="brand" href="#opening">Before the Move</a></div><div class="header-right"><span class="edition">AN INTERACTIVE COURSE ON WORLD MODELS</span><button id="theme-toggle" aria-label="Switch to night mode"><span class="day-icon">${icon("sun")}</span><span class="night-icon">${icon("moon")}</span></button><button id="print" aria-label="Print the book">${icon("print")}<span>Print</span></button></div></header><div class="progress"></div><button id="contents-scrim" tabindex="-1" aria-hidden="true"></button><nav id="contents" aria-label="Contents" inert><div class="contents-heading"><span>Contents</span><button id="close-contents" aria-label="Close contents">${icon("close")}</button></div><div class="nav-search">${icon("search")}<input id="search" type="search" placeholder="Find a section" aria-label="Find a section"></div><p id="search-empty" hidden>No matching sections.</p>${nav}</nav><main>${content}<footer>Before the Move. An illustrated exploration of predictive representations and learning to act. Mathematical typesetting by KaTeX; icons by HugeIcons. The learning laboratory builds on Jaxverse.<details><summary>Open-source notices</summary><pre>${esc(read("assets/katex-LICENSE.txt") + "\n" + read("assets/newsreader-LICENSE.txt") + "\n" + read("node_modules/@jax-js/jax/LICENSE") + "\n" + read("node_modules/highlight.js/LICENSE") + "\n" + read("assets/hugeicons-NOTICE.txt") + "\n" + read("assets/dm-sans-LICENSE.txt") + "\n" + read("assets/jetbrains-mono-LICENSE.txt"))}</pre></details></footer></main><script type="application/octet-stream" id="world-worker">${worker}</script><script>${js.replaceAll("</script", "<\\/script")}</script><script>if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){let stamp;setInterval(async()=>{try{const r=await fetch('revision-stamp',{cache:'no-store'});if(!r.ok)return;const s=await r.text();if(stamp&&stamp!==s){if(!window.BookHasExperiment?.())location.reload();else if(!document.querySelector('#reload-revision')){const b=document.createElement('button');b.id='reload-revision';b.textContent='New revision';b.title='Reload the updated book; resets this local experiment';b.onclick=()=>location.reload();document.querySelector('.header-right').prepend(b)}}stamp=s}catch{}},3000)}</script></body></html>`;
fs.writeFileSync(path.join(root, "second-edition.html"), html);
fs.writeFileSync(path.join(root, "world-models.html"), html);
fs.writeFileSync(path.join(root, "revision-stamp"), String(Date.now()));
fs.writeFileSync(
  path.join(root, "research/edition2/build.json"),
  JSON.stringify(
    {
      built: new Date().toISOString(),
      chapters: chapters.length,
      formulas: mathCount,
      codeBlocks: codeCount,
      bytes: Buffer.byteLength(html),
    },
    null,
    2,
  ),
);
console.log(
  `Second edition: ${chapters.length} chapters, ${mathCount} formulas, ${codeCount} code blocks, ${(Buffer.byteLength(html) / 1e6).toFixed(2)} MB`,
);

await import("./build-figure-atlas.mjs");
