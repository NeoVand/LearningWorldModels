import { icon } from "../../../tools/icons.mjs";
import katex from "katex";
import { macros, semanticLatex } from "../notation.mjs";
export const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
let mathScope = "";
const scopes = {
  O: "opening",
  P: "philosophy",
  G: "geometry",
  B: "probability",
  C: "clouds",
  D: "calculus",
  N: "learning",
  J: "jepa",
  T: "testing",
  S: "sigreg",
  I: "implementation",
  L: "laboratory",
  A: "planning",
  E: "evaluation",
  R: "theory",
  V: "transformers",
  H: "lineage",
  W: "paper",
  K: "capstone",
  X: "reference",
};
export const tex = (s, display = false) =>
  katex.renderToString(semanticLatex(s, mathScope), {
    macros,
    displayMode: display,
    throwOnError: true,
    strict: "ignore",
    trust: (c) => c.command === "\\htmlClass",
  });
export const f = (n, d = 2) => Number(n).toFixed(d);
export const role = (name) => `var(--${name})`;
export const line = (x, y, a, b, c = "plot-line", dash = "") =>
  `<path d="M${x} ${y}L${a} ${b}" fill="none" stroke="${role(c)}" stroke-width="1.5" ${dash ? 'stroke-dasharray="' + dash + '"' : ""}/>`;
export const dot = (x, y, r = 3, c = "violet", opacity = 1) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${role(c)}" opacity="${opacity}"/>`;
export const text = (x, y, s, c = "muted", anchor = "start") =>
  `<text x="${x}" y="${y}" fill="${role(c)}" text-anchor="${anchor}" class="visual-label">${esc(s)}</text>`;
export const formula = (x, y, w, s) =>
  `<foreignObject x="${x}" y="${y}" width="${w}" height="48"><div xmlns="http://www.w3.org/1999/xhtml" class="visual-math">${tex(s)}</div></foreignObject>`;
export const svg = (body, label, w = 360, h = 280) =>
  `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
export const path = (pts, c = "teal", width = 2) => {
  let pen = false;
  const d = pts
    .map((p) => {
      if (!p.every(Number.isFinite)) {
        pen = false;
        return "";
      }
      const command = pen ? "L" : "M";
      pen = true;
      return command + p.map((v) => f(v, 3)).join(" ");
    })
    .join("");
  return `<path d="${d}" fill="none" stroke="${role(c)}" stroke-width="${width}" stroke-linejoin="round"/>`;
};
// Round ticks without changing sampled data. Explicit ticks support angles and logs.
export function niceTicks(min, max, count = 4) {
  const raw = (max - min) / Math.max(1, count);
  if (!(raw > 0) || !Number.isFinite(raw)) return [min];
  const power = 10 ** Math.floor(Math.log10(raw));
  const n = raw / power;
  const step = (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * power;
  const values = [];
  for (
    let i = Math.ceil(min / step - 1e-9);
    i <= Math.floor(max / step + 1e-9);
    i++
  )
    values.push(Number((i * step).toPrecision(12)));
  return values;
}
export const powerLabel = (exponent) =>
  "10" +
  String(Math.round(exponent)).replace(
    /[-0-9]/g,
    (c) =>
      ({
        "-": "⁻",
        0: "⁰",
        1: "¹",
        2: "²",
        3: "³",
        4: "⁴",
        5: "⁵",
        6: "⁶",
        7: "⁷",
        8: "⁸",
        9: "⁹",
      })[c],
  );
let plotSerial = 0;
const clipPrefix = typeof window === "undefined" ? "static" : "live";
export function plot({
  curves = [],
  points = [],
  xmin = -3,
  xmax = 3,
  ymin = -1.5,
  ymax = 1.5,
  xlabel = "x",
  ylabel = "y",
  extra = "",
  height = 280,
  ticks = 4,
  yTickFormat,
  xTickFormat,
  xTicks,
  yTicks,
  snapDomain = !extra,
} = {}) {
  const snap = (lo, hi) => {
    const raw = (hi - lo) / Math.max(1, ticks),
      p = 10 ** Math.floor(Math.log10(raw));
    const n = raw / p;
    const step = (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
    const min = Math.floor(lo / step) * step,
      max = Math.ceil(hi / step) * step;
    const values = Array.from(
      { length: Math.round((max - min) / step) + 1 },
      (_, i) => Number((min + i * step).toPrecision(12)),
    );
    return [min, max, values];
  };
  if (snapDomain) {
    if (!xTicks) [xmin, xmax, xTicks] = snap(xmin, xmax);
    if (!yTicks) [ymin, ymax, yTicks] = snap(ymin, ymax);
  }
  const bottom = height - 45,
    graphHeight = height - 80;
  const X = (x) => 55 + ((x - xmin) * 270) / (xmax - xmin),
    Y = (y) => bottom - ((y - ymin) * graphHeight) / (ymax - ymin);
  const clipId = clipPrefix + "-plot-" + ++plotSerial;
  let s =
    `<defs><clipPath id="${clipId}"><rect x="55" y="35" width="270" height="${graphHeight}"/></clipPath></defs>` +
    line(55, bottom, 325, bottom) +
    line(55, 35, 55, bottom);
  if (xmin < 0 && xmax > 0) s += line(X(0), 35, X(0), bottom);
  if (ymin < 0 && ymax > 0) s += line(55, Y(0), 325, Y(0));
  const tick = (v) => String(Number(v.toPrecision(5))).replace("-", "−");
  for (const x of xTicks ?? niceTicks(xmin, xmax, ticks))
    s += text(
      X(x),
      bottom + 20,
      xTickFormat ? xTickFormat(x) : tick(x),
      "muted",
      "middle",
    );
  for (const y of yTicks ?? niceTicks(ymin, ymax, ticks))
    s += text(
      49,
      Y(y) + 4,
      yTickFormat ? yTickFormat(y) : tick(y),
      "muted",
      "end",
    );
  s += text(326, height - 8, xlabel, "muted", "end") + text(56, 20, ylabel);
  s += `<g clip-path="url(#${clipId})">`;
  curves.forEach(({ fn, color = "teal", data, area }) => {
    const pts =
      data ??
      Array.from({ length: 401 }, (_, i) => {
        let x = xmin + ((xmax - xmin) * i) / 400;
        return [x, fn(x)];
      });
    if (area) {
      const fillId = clipId + "-area-" + color;
      s += `<defs><linearGradient id="${fillId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${role(color)}" stop-opacity=".4"/><stop offset="1" stop-color="${role(color)}" stop-opacity=".025"/></linearGradient></defs>`;
      s += `<path d="M${X(pts[0][0])} ${Y(0)}${pts.map(([x, y]) => "L" + X(x) + " " + Y(y)).join("")}L${X(pts.at(-1)[0])} ${Y(0)}Z" fill="url(#${fillId})"/>`;
    }
    s += path(
      pts.map(([x, y]) => [X(x), Y(y)]),
      color,
    );
  });
  points.forEach(
    (p) => (s += dot(X(p[0]), Y(p[1]), p[3] ?? 3, p[2] ?? "violet", 0.8)),
  );
  s += "</g>";
  return svg(
    s + extra,
    "Graph: " + ylabel + " as a function of " + xlabel,
    360,
    height,
  );
}
export function scatter(points, { limit = 3, angle = null } = {}) {
  const M = (x) => 180 + x * 39;
  let s = line(43, 140, 317, 140) + line(180, 3, 180, 277);
  if (angle !== null)
    s += line(
      180 - 130 * Math.cos(angle),
      140 + 130 * Math.sin(angle),
      180 + 130 * Math.cos(angle),
      140 - 130 * Math.sin(angle),
      "amber",
    );
  s += points
    .map((p) => dot(M(p[0]), 140 - p[1] * 39, 2.7, p[2] ?? "violet", 0.7))
    .join("");
  return svg(s, "Point cloud with equal horizontal and vertical units");
}
export const panel = (title, body, note = "") =>
  `<div class="visual-panel"${/<svg\b[^>]*role="img"/.test(body) ? "" : ' data-detail="true"'}><h4>${title}</h4>${body.replace(/aria-label="Graph: /g, `aria-label="${esc(title)}. `)}${note ? '<!--panel-note--><div class="visual-note">' + note + "</div><!--/panel-note-->" : ""}</div>`;
export const row = (...panels) => {
  const notes = [];
  const columns = panels.map((p) =>
    p.replace(
      /<!--panel-note--><div class="visual-note">([\s\S]*?)<\/div><!--\/panel-note-->/,
      (_, note) => {
        const title = p.match(/<h4>([\s\S]*?)<\/h4>/)?.[1] ?? "";
        notes.push(`<div><strong>${title}.</strong> ${note}</div>`);
        return "";
      },
    ),
  );
  const graphics = panels.filter((p) => /<svg\b[^>]*role="img"/.test(p)).length;
  return `<div class="visual-panels" data-panels="${panels.length}" style="--panel-count:${panels.length};--graphic-count:${Math.max(1, graphics)}">${columns.join("")}</div>${notes.length ? `<div class="visual-explanations">${notes.join("")}</div>` : ""}`;
};
export const takeaway = (content) =>
  `<div class="visual-takeaway">${content}</div>`;
export const results = (...items) =>
  `<div class="visual-results">${items.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}</div>`;
export const number = (label, value, unit = "") =>
  `<div class="visual-number"><strong>${value}</strong><span>${label}${unit ? " · " + unit : ""}</span></div>`;
export const range = (key, label, min, max, step, value) => ({
  key,
  label,
  min,
  max,
  step,
  value,
  type: "range",
});
export const choices = (key, label, options, value = options[0]) => ({
  key,
  label,
  options,
  value,
  type: "choices",
});
export const button = (key, label) => ({ key, label, type: "button" });
export function controlsHTML(controls, state) {
  return controls
    .map((c) =>
      c.type === "range"
        ? `<label class="visual-range"><span>${c.label}<output>${f(state[c.key], Number.isInteger(c.step) ? 0 : 2)}</output></span><input type="range" data-key="${c.key}" aria-label="${c.label}" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[c.key]}"></label>`
        : c.type === "choices"
          ? `<div class="visual-choice" role="group" aria-label="${c.label}"><span>${c.label}</span>${c.options.map((o) => `<button data-key="${c.key}" data-value="${o}" aria-pressed="${state[c.key] === o}">${o}</button>`).join("")}</div>`
          : `<button data-action="${c.key}">${icon(c.key === "play" ? "play" : c.key.startsWith("reset") ? "reset" : "science")}<span>${c.label}</span></button>`,
    )
    .join("");
}
export function stateFor(spec) {
  return Object.fromEntries(
    (spec.controls ?? [])
      .filter((c) => c.type !== "button")
      .map((c) => [c.key, c.value]),
  );
}
export const registry = {};
export function register(id, spec) {
  const original = spec.draw;
  registry[id] = {
    ...spec,
    id,
    draw(state) {
      const previous = mathScope;
      mathScope = scopes[id[0]] ?? "";
      try {
        return original(state);
      } finally {
        mathScope = previous;
      }
    },
  };
}
export function renderFigure(id) {
  const s = registry[id];
  if (!s) throw Error("Missing visual " + id);
  const state = stateFor(s);
  return `<figure class="teaching-visual" id="visual-${id}" data-visual="${id}"><div class="visual-heading">${s.kind ? `<span class="eyebrow">${s.kind}</span>` : ""}<h3>${s.title}</h3></div><p class="visual-question">${s.question}</p><div class="visual-body">${s.draw(state)}</div>${s.controls?.length ? `<div class="visual-controls">${controlsHTML(s.controls, state)}</div>` : ""}<figcaption>${s.caption}</figcaption></figure>`;
}
