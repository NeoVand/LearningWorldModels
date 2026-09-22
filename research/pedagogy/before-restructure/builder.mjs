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
import { macros } from "../book/edition2/notation.mjs";
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
  read("book/edition2/polish.css");
for (const [family, file] of [
  ["DM Sans", "dm-sans"],
  ["JetBrains Mono", "jetbrains-mono"],
])
  css += `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(root, "assets", file + ".woff2")).toString("base64")}) format('woff2');font-weight:100 900;font-display:swap}`;
const chapters = [
  ["opening", "Begin with the world", "The idea"],
  ["philosophy", "Learning before labels", "Purpose"],
  ["geometry", "A world in coordinates", "Foundations"],
  ["probability", "Prediction under uncertainty", "Foundations"],
  ["learning", "How errors change a model", "Foundations"],
  ["jepa", "Agreement without collapse", "Architectures"],
  ["lineage", "The papers as a conversation", "Research lineage"],
  ["transformers", "Inside the vision transformer", "Architecture"],
  ["sigreg", "SIGReg, from the ground up", "The mathematics"],
  ["theory", "What Gaussian geometry can promise", "Theory"],
  ["implementation", "From equations to a learner", "Implementation"],
  ["laboratory", "A world model you can train", "Learning laboratory"],
  ["planning", "From imagination to action", "Planning"],
  ["paper", "Read LeWorldModel closely", "The destination"],
  ["evaluation", "What counts as understanding?", "Evidence"],
  ["capstone", "Build, challenge, explain", "Capstone"],
  ["reference", "Keep the whole argument in view", "Reference"],
];
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
    const html = hljs.getLanguage(lang)
      ? hljs.highlight(code.trimEnd(), { language: lang }).value
      : esc(code);
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
      return `MATHBLOCK${maths.push(katex.renderToString(display ?? inline, { displayMode: display !== undefined, throwOnError: true, macros, strict: "ignore", output: "htmlAndMathml" })) - 1}END`;
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
  html = html.replace(
    /<img src="(assets\/[^\"]+)"/g,
    (_, p) =>
      `<img src="data:image/${p.endsWith(".png") ? "png" : "svg+xml"};base64,${fs.readFileSync(path.join(root, p)).toString("base64")}"`,
  );
  return decorateControls(
    html
      .replace(/<table>/g, '<div class="table-wrap"><table>')
      .replace(/<\/table>/g, "</table></div>"),
  );
}
const content = chapters
  .map(
    ([id, title, status], i) =>
      `<article id="${id}"><div class="chapter-meta"><span>${String(i + 1).padStart(2, "0")} / ${status}</span><span>World models, from first principles</span></div>${render(read(`book/edition2/${id}.md`), id)}</article>`,
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
    ([id, title]) =>
      `<div class="nav-label">${title}</div><a href="#${id}">Start here</a>${headings
        .filter((h) => h.chapter === id)
        .map((h) => `<a href="#${h.id}">${h.title}</a>`)
        .join("")}`,
  )
  .join("");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Before the Move — World models, from first principles</title><meta name="description" content="World models and SIGReg explained from first principles, with a real trainable model."><style>${css}</style></head><body><a class="skip" href="#opening">Skip to the book</a><header><button class="menu" aria-label="Open contents" aria-expanded="false">${icon("menu")}</button><a class="brand" href="#opening">Before the Move</a><div class="header-right"><span class="edition">A FIELD GUIDE TO WORLD MODELS</span><button id="print" aria-label="Print the book">${icon("print")}<span>Print</span></button></div></header><div class="progress"></div><nav aria-label="Contents"><div class="nav-search">${icon("search")}<input id="search" type="search" placeholder="Find a section" aria-label="Find a section"></div>${nav}</nav><main>${content}<footer>Before the Move. An illustrated exploration of predictive representations and learning to act. Mathematical typesetting by KaTeX; icons by HugeIcons. The learning laboratory builds on Jaxverse.<details><summary>Open-source notices</summary><pre>${esc(read("assets/katex-LICENSE.txt") + "\n" + read("assets/newsreader-LICENSE.txt") + "\n" + read("node_modules/@jax-js/jax/LICENSE") + "\n" + read("node_modules/highlight.js/LICENSE") + "\n" + read("assets/hugeicons-NOTICE.txt") + "\n" + read("assets/dm-sans-LICENSE.txt") + "\n" + read("assets/jetbrains-mono-LICENSE.txt"))}</pre></details></footer></main><script type="application/octet-stream" id="world-worker">${worker}</script><script>${js.replaceAll("</script", "<\\/script")}</script><script>if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){let stamp;setInterval(async()=>{try{const r=await fetch('revision-stamp',{cache:'no-store'});if(!r.ok)return;const s=await r.text();if(stamp&&stamp!==s){if(!window.BookHasExperiment?.())location.reload();else if(!document.querySelector('#reload-revision')){const b=document.createElement('button');b.id='reload-revision';b.textContent='New revision';b.title='Reload the updated book; resets this local experiment';b.onclick=()=>location.reload();document.querySelector('.header-right').prepend(b)}}stamp=s}catch{}},3000)}</script></body></html>`;
fs.writeFileSync(path.join(root, "second-edition.html"), html);
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
