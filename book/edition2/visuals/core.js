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
} = {}) {
  const bottom = height - 45,
    graphHeight = height - 80;
  const X = (x) => 35 + ((x - xmin) * 290) / (xmax - xmin),
    Y = (y) => bottom - ((y - ymin) * graphHeight) / (ymax - ymin);
  const clipId = clipPrefix + "-plot-" + ++plotSerial;
  let s =
    `<defs><clipPath id="${clipId}"><rect x="35" y="35" width="290" height="${graphHeight}"/></clipPath></defs>` +
    line(35, bottom, 325, bottom) +
    line(35, 35, 35, bottom);
  if (xmin < 0 && xmax > 0) s += line(X(0), 35, X(0), bottom);
  if (ymin < 0 && ymax > 0) s += line(35, Y(0), 325, Y(0));
  const tick = (v, span) =>
    Number.isInteger(v) ? String(v) : f(v, span < 0.1 ? 3 : span < 1 ? 2 : 1);
  for (let i = 0; i <= 4; i++) {
    let x = xmin + ((xmax - xmin) * i) / 4,
      y = ymin + ((ymax - ymin) * i) / 4;
    s +=
      text(X(x), bottom + 20, tick(x, xmax - xmin), "muted", "middle") +
      text(29, Y(y) + 4, tick(y, ymax - ymin), "muted", "end");
  }
  s += text(326, height - 4, xlabel, "muted", "end") + text(36, 20, ylabel);
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
    "Computed graph: " + xlabel + " against " + ylabel,
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
  `<div class="visual-panel"><h4>${title}</h4>${body}${note ? '<div class="visual-note">' + note + "</div>" : ""}</div>`;
export const row = (...p) => `<div class="visual-panels">${p.join("")}</div>`;
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
  return `<figure class="teaching-visual" id="visual-${id}" data-visual="${id}"><div class="visual-heading"><span class="eyebrow">${s.kind ?? "Explore the idea"}</span><h3>${s.title}</h3></div><p class="visual-question">${s.question}</p><div class="visual-body">${s.draw(state)}</div>${s.controls?.length ? `<div class="visual-controls">${controlsHTML(s.controls, state)}</div>` : ""}<figcaption>${s.caption}</figcaption></figure>`;
}
