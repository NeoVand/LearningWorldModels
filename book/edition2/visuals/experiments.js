// Interactive experiments adapted from Jaxverse's circuit and landscape lessons.
// Pure numerical functions are shared with the verification script.
import {
  row,
  panel,
  svg,
  text,
  dot,
  line,
  path,
  formula,
  plot,
  range,
  choices,
  button,
  tex,
  f,
  number,
} from "./core.js";
import { cdf } from "../normality.js";
const eq = (s) => `<div class="visual-equation">${tex(s, true)}</div>`;
const legend = (items) =>
  `<div class="plot-legend">${items.map(([name, color]) => `<span><i style="background:var(--${color})"></i>${name}</span>`).join("")}</div>`;
const clip = (v, a, b) => Math.max(a, Math.min(b, v));
const samples = (fn, a, b, n = 401) =>
  Array.from({ length: n }, (_, i) => {
    const x = a + ((b - a) * i) / (n - 1);
    return [x, fn(x)];
  });

export const neuronActivations = {
  Linear: { fn: (x) => x, df: () => 1, tex: "z" },
  Sigmoid: {
    fn: (x) => 1 / (1 + Math.exp(-x)),
    df: (x) => {
      const v = 1 / (1 + Math.exp(-x));
      return v * (1 - v);
    },
    tex: "1/(1+e^{-z})",
    levels: [0, 1],
  },
  tanh: {
    fn: Math.tanh,
    df: (x) => 1 - Math.tanh(x) ** 2,
    tex: "\\tanh z",
    levels: [-1, 1],
  },
  ReLU: {
    fn: (x) => Math.max(0, x),
    df: (x) => (x > 0 ? 1 : 0),
    tex: "\\max(0,z)",
  },
  "Leaky ReLU": {
    fn: (x) => Math.max(0.1 * x, x),
    df: (x) => (x > 0 ? 1 : 0.1),
    tex: "\\max(0.1z,z)",
  },
  Softplus: {
    fn: (x) => Math.max(x, 0) + Math.log1p(Math.exp(-Math.abs(x))),
    df: (x) => 1 / (1 + Math.exp(-x)),
    tex: "\\log(1+e^z)",
  },
  GELU: {
    fn: (x) => x * cdf(x),
    df: (x) => cdf(x) + (x * Math.exp((-x * x) / 2)) / Math.sqrt(2 * Math.PI),
    tex: "z\\Phi(z)",
  },
  SiLU: {
    fn: (x) => x / (1 + Math.exp(-x)),
    df: (x) => {
      const v = 1 / (1 + Math.exp(-x));
      return v + x * v * (1 - v);
    },
    tex: "z/(1+e^{-z})",
  },
};
function arrow(x, y, X, Y, color, width = 1.5, dashed = false) {
  const a = Math.atan2(Y - y, X - x),
    t = 5;
  return `<path d="M${x} ${y}L${X} ${Y}" stroke="var(--${color})" stroke-width="${width}" fill="none" ${dashed ? 'stroke-dasharray="4 3"' : ""}/><path d="M${X - t * Math.cos(a - 0.45)} ${Y - t * Math.sin(a - 0.45)}L${X} ${Y}L${X - t * Math.cos(a + 0.45)} ${Y - t * Math.sin(a + 0.45)}" fill="none" stroke="var(--${color})" stroke-width="1.5"/>`;
}
export const neuronSpec = {
  title: "One neuron: follow a number through the circuit",
  question:
    "Choose an activation. Change its weight, bias and amplitude, then move across the curve to trace one input.",
  controls: [
    choices("activation", "Activation", Object.keys(neuronActivations), "tanh"),
    range("w", "Input weight w", -4, 4, 0.05, 2),
    range("b", "Bias b", -2, 2, 0.05, 0),
    range("v", "Output weight v", -2, 2, 0.05, 1),
    range("probe", "Input probe", -2, 2, 0.02, 0.4),
    choices("tangent", "Local slope", ["Hidden", "Shown"]),
  ],
  pointer(s, p) {
    if (p.target === "neuron" && p.kind === "move")
      s.probe = Math.round(clip(-2 + ((p.x - 35) / 290) * 4, -2, 2) * 50) / 50;
  },
  draw(s) {
    const a = neuronActivations[s.activation],
      z = s.w * s.probe + s.b,
      h = a.fn(z),
      y = s.v * h,
      slope = s.v * s.w * a.df(z);
    let circuit = "";
    // All edges end at node rims; the output leaves the activation disk itself.
    circuit +=
      arrow(63, 65, 151, 109, "blue", 1 + Math.abs(s.w) * 0.5, s.w < 0) +
      arrow(62, 177, 151, 130, "violet", 1 + Math.abs(s.b) * 0.6, s.b < 0) +
      arrow(195, 120, 237, 120, "muted") +
      arrow(299, 120, 352, 120, "teal", 1 + Math.abs(s.v), s.v < 0);
    for (const [x, Y, r] of [
      [45, 55, 20],
      [45, 185, 17],
      [173, 120, 22],
      [268, 120, 29],
    ])
      circuit += `<circle cx="${x}" cy="${Y}" r="${r}" fill="var(--surface)" stroke="var(--line)"/>`;
    circuit +=
      formula(26, 37, 38, "x") +
      formula(29, 169, 32, "1") +
      formula(151, 102, 44, "\\Sigma") +
      formula(75, 52, 83, `w=${f(s.w, 1)}`) +
      formula(78, 180, 82, `b=${f(s.b, 1)}`) +
      formula(297, 77, 67, `v=${f(s.v, 1)}`);
    const mini = samples(a.fn, -3, 3, 201),
      max = Math.max(1, ...mini.map((p) => Math.abs(p[1])));
    circuit += path(
      mini.map(([x, Y]) => [268 + x * 7, 120 - (Y / max) * 20]),
      "teal",
      1.5,
    );
    if (Math.abs(z) <= 3)
      circuit += dot(268 + z * 7, 120 - (h / max) * 20, 3, "amber");
    circuit +=
      formula(218, 161, 100, "\\sigma(z)") +
      text(45, 94, f(s.probe), "blue", "middle") +
      text(173, 161, f(z), "violet", "middle") +
      text(347, 151, f(y), "teal", "end");
    const curves = [{ fn: (x) => s.v * a.fn(s.w * x + s.b), color: "teal" }];
    if (s.tangent === "Shown")
      curves.push({ fn: (x) => y + slope * (x - s.probe), color: "amber" });
    const extra = (a.levels ?? [])
      .filter((l) => Math.abs(l * s.v) < 3)
      .map((l) =>
        line(
          35,
          235 - ((l * s.v + 3) / 6) * 200,
          325,
          235 - ((l * s.v + 3) / 6) * 200,
          "teal",
          "3 5",
        ),
      )
      .join("");
    const graph = plot({
      xmin: -2,
      xmax: 2,
      ymin: -3,
      ymax: 3,
      curves,
      points: [[s.probe, y, "amber", 4]],
      ylabel: "output y",
      extra,
    }).replace("<svg ", '<svg data-interactive="neuron" ');
    return (
      row(
        panel(
          "Scale → add → bend → scale",
          svg(
            circuit,
            "A connected neuron circuit with input, bias, sum, activation and output",
            380,
            240,
          ),
        ),
        panel("The same computation, for every input", graph),
      ) +
      `<div class="signal-strip">${[
        ["Input", tex(`x=${f(s.probe)}`)],
        ["Preactivation", tex(`z=wx+b=${f(z)}`)],
        ["Activation", tex(`\\sigma(z)=${f(h)}`)],
        ["Output", tex(`y=v\\sigma(z)=${f(y)}`)],
      ]
        .map(([l, v]) => `<div><span>${l}</span>${v}</div>`)
        .join("")}</div>` +
      `<p class="visual-note">${tex(`\\sigma(z)=${a.tex}`)}. ${s.tangent === "Shown" ? `Local slope ${f(slope, 3)}; the amber tangent predicts small output changes.` : "Dashed levels mark saturation, where this activation has a finite limit."} Negative weights use dashed circuit edges.</p>`
    );
  },
  caption:
    "The curve, activation disk and numerical trace use the same function. The input slider also supports touch and keyboard. ReLU and leaky ReLU have a corner at zero; a displayed zero-point slope uses a convention, not an ordinary derivative.",
};

export const landscapes = {
  Bowl: {
    f: (x, y) => x * x + 4 * y * y,
    g: (x, y) => [2 * x, 8 * y],
    start: [2, 1.3],
    formula: "L(x,y)=x^2+4y^2",
  },
  Ravine: {
    f: (x, y) => 0.03 * (1 - x) ** 2 + 1.2 * (y - x * x) ** 2,
    g: (x, y) => [-0.06 * (1 - x) - 4.8 * x * (y - x * x), 2.4 * (y - x * x)],
    start: [-1.5, 1.6],
    formula: "L(x,y)=0.03(1-x)^2+1.2(y-x^2)^2",
  },
  "Two basins": {
    f: (x, y) =>
      1.7 * (y - 0.45 * x * x + 0.9) ** 2 +
      0.035 * (x * x - 2.4) ** 2 +
      0.18 * x +
      0.25 * Math.sin(2.1 * x) * Math.cos(1.7 * y) +
      0.35,
    g: (x, y) => [
      -3.06 * x * (y - 0.45 * x * x + 0.9) +
        0.14 * x * (x * x - 2.4) +
        0.18 +
        0.525 * Math.cos(2.1 * x) * Math.cos(1.7 * y),
      3.4 * (y - 0.45 * x * x + 0.9) -
        0.425 * Math.sin(2.1 * x) * Math.sin(1.7 * y),
    ],
    start: [-2.7, 1.7],
    formula:
      "L=1.7(y-0.45x^2+0.9)^2+0.035(x^2-2.4)^2+0.18x+0.25\\sin(2.1x)\\cos(1.7y)+0.35",
  },
};
export function optimize(name, start, eta, n, id = "SGD") {
  const landscape = landscapes[name];
  let p = [...start],
    m = [0, 0],
    v = [0, 0],
    trail = [[...p]],
    loss = [landscape.f(...p)],
    diverged = false;
  for (let k = 1; k <= n; k++) {
    const g = landscape.g(...p);
    p = p.map((x, j) => {
      m[j] = 0.9 * m[j] + 0.1 * g[j];
      v[j] = 0.999 * v[j] + 0.001 * g[j] ** 2;
      return (
        x -
        eta *
          (id === "SGD"
            ? g[j]
            : id === "Momentum"
              ? m[j]
              : m[j] /
                (1 - 0.9 ** k) /
                (Math.sqrt(v[j] / (1 - 0.999 ** k)) + 1e-8))
      );
    });
    if (!p.every(Number.isFinite) || Math.hypot(...p) > 1e4) {
      diverged = true;
      break;
    }
    trail.push([...p]);
    loss.push(landscape.f(...p));
  }
  return { trail, loss, diverged, m, v };
}
const terrainCache = new Map();
const terrainMap = ([x, y]) => [300 + x * 70, 190 - y * 70];
function terrain(name) {
  if (terrainCache.has(name)) return terrainCache.get(name);
  const F = landscapes[name].f,
    nx = 80,
    ny = 48;
  let values = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) values.push(F(-4 + i * 0.1, -2.4 + j * 0.1));
  const low = Math.min(...values),
    high = Math.max(...values);
  let out = '<g shape-rendering="crispEdges">';
  values.forEach((v, k) => {
    const x = k % nx,
      j = Math.floor(k / nx),
      t = Math.log1p(Math.max(0, v - low)) / Math.log1p(high - low);
    out += `<rect x="${20 + x * 7}" y="${22 + (ny - 1 - j) * 7}" width="7" height="7" fill="var(--teal)" opacity="${(0.035 + 0.24 * t).toFixed(3)}"/>`;
  });
  out += "</g>";
  // Marching squares: interpolate crossings rather than drawing a coarse polyline grid.
  for (let level = 1; level <= 12; level++) {
    const threshold = low + Math.expm1((Math.log1p(high - low) * level) / 13);
    let d = "";
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        const pts = [
            [i, j],
            [i + 1, j],
            [i + 1, j + 1],
            [i, j + 1],
          ],
          vs = pts.map(([x, y]) => values[y * nx + x]),
          hits = [];
        for (let e = 0; e < 4; e++) {
          const q = (e + 1) % 4;
          if (vs[e] < threshold !== vs[q] < threshold) {
            const t = (threshold - vs[e]) / (vs[q] - vs[e]);
            hits.push([
              20 + (pts[e][0] + t * (pts[q][0] - pts[e][0])) * 7,
              358 - (pts[e][1] + t * (pts[q][1] - pts[e][1])) * 7,
            ]);
          }
        }
        for (let k = 0; k + 1 < hits.length; k += 2)
          d += `M${hits[k].join(" ")}L${hits[k + 1].join(" ")}`;
      }
    out += `<path d="${d}" fill="none" stroke="var(--teal)" stroke-opacity=".21" stroke-width=".65" stroke-linecap="round"/>`;
  }
  out +=
    line(20, 190, 580, 190, "plot-line") +
    line(300, 22, 300, 358, "plot-line") +
    text(577, 379, "x", "muted", "end") +
    text(305, 17, "y");
  terrainCache.set(name, out);
  return out;
}
function landscapeGraph(name, runs, start, gradient = false) {
  let body = terrain(name);
  for (const [id, r, c] of runs) {
    body += path(r.trail.map(terrainMap), c, 2);
    const p = r.trail.at(-1),
      q = terrainMap(p);
    if (q[0] >= 20 && q[0] <= 580 && q[1] >= 22 && q[1] <= 358)
      body += dot(...q, 4, c);
  }
  const q = terrainMap(start);
  body += `<circle cx="${q[0]}" cy="${q[1]}" r="5" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/>`;
  if (gradient) {
    const g = landscapes[name].g(...start),
      norm = Math.hypot(...g) || 1;
    body += arrow(
      q[0],
      q[1],
      q[0] - (35 * g[0]) / norm,
      q[1] + (35 * g[1]) / norm,
      "rose",
      2,
    );
  }
  return svg(
    `<defs><clipPath id="terrain-${gradient ? "d" : "n"}"><rect x="20" y="22" width="560" height="336" rx="8"/></clipPath></defs><g clip-path="url(#terrain-${gradient ? "d" : "n"})">${body}</g>` +
      text(22, 379, "Click a new starting point"),
    "Loss landscape with optimization trajectories",
    600,
    390,
  ).replace("<svg ", '<svg data-interactive="landscape" ');
}
function changeLandscape(s, key) {
  if (key === "landscape") {
    [s.x, s.y] = landscapes[s.landscape].start;
  }
  if (key !== "time") s.time = 0;
}
function landscapePointer(s, p) {
  if (p.kind !== "click" || p.target !== "landscape") return;
  s.x = clip((p.x - 300) / 70, -3.8, 3.8);
  s.y = clip((190 - p.y) / 70, -2.2, 2.2);
  s.time = 0;
}
const playControls = [
  button("play", "Play"),
  button("step", "One update"),
  button("reset", "Reset"),
  range("time", "Updates", 0, 160, 1, 20),
  range("eta", "Step size η", 0.005, 0.18, 0.005, 0.05),
];
export const descentSpec = {
  title: "Follow the slope across a landscape",
  question:
    "Click a starting point, then take one update or play the descent. Raise the step size to see overshoot.",
  animate: true,
  maxTime: 160,
  fps: 12,
  controls: [
    ...playControls,
    range("x", "Start x", -3.5, 3.5, 0.05, 2),
    range("y", "Start y", -2, 2, 0.05, 1.3),
  ],
  change: changeLandscape,
  pointer: landscapePointer,
  action(s, a) {
    if (a === "step") s.time = Math.min(160, s.time + 1);
  },
  draw(s) {
    const r = optimize("Bowl", [s.x, s.y], s.eta, s.time),
      p = r.trail.at(-1),
      g = landscapes.Bowl.g(...p);
    return `<div class="landscape-layout">${landscapeGraph("Bowl", [["SGD", r, "blue"]], [s.x, s.y], true)}<div class="landscape-readout">${eq("L(x,y)=x^2+4y^2")}${eq("(x,y)\\leftarrow(x,y)-\\eta\\nabla L")}${number("Current loss", r.diverged ? "Diverged" : f(r.loss.at(-1), 4))}<p>${tex(`\\nabla L=(${f(g[0])},${f(g[1])})^\\top`)}</p><p class="visual-note">Each contour has a constant loss. The rose arrow shows the initial downhill direction. The blue trail records actual updates; the steeper vertical direction explains its initial turn.</p></div></div>`;
  },
  caption:
    "The two coordinates are adjustable parameters. This quadratic has four times more curvature in y. A large finite step can increase the loss even when the initial direction is downhill. Each slider change starts a fresh trajectory.",
};
export const optimizerSpec = {
  title: "Three optimizers, one starting point",
  question:
    "Watch the actual paths. Memory changes the direction of motion; Adam also rescales each coordinate.",
  animate: true,
  maxTime: 160,
  fps: 12,
  controls: [
    choices("landscape", "Landscape", Object.keys(landscapes), "Bowl"),
    ...playControls,
    range("x", "Start x", -3.5, 3.5, 0.05, 2),
    range("y", "Start y", -2, 2, 0.05, 1.3),
  ],
  change: changeLandscape,
  pointer: landscapePointer,
  action(s, a) {
    if (a === "step") s.time = Math.min(160, s.time + 1);
  },
  draw(s) {
    const runs = [
      ["SGD", "blue"],
      ["Momentum", "violet"],
      ["Adam", "teal"],
    ].map(([id, c]) => [
      id,
      optimize(s.landscape, [s.x, s.y], s.eta, s.time, id),
      c,
    ]);
    return (
      `<div class="landscape-layout">${landscapeGraph(s.landscape, runs, [s.x, s.y])}<div class="landscape-readout">${legend(runs.map(([id, , c]) => [id, c]))}${runs.map(([id, r, c]) => `<div class="race-result"><span style="color:var(--${c})">${id}</span><strong>${r.diverged ? "Diverged" : f(r.loss.at(-1), 4)}</strong><small>loss after ${r.trail.length - 1} updates</small></div>`).join("")}</div></div>` +
      row(
        panel(
          "Loss along each path",
          plot({
            height: 160,
            xmin: 0,
            xmax: Math.max(20, s.time),
            ymin: 0,
            ymax:
              Math.max(0.1, ...runs.map((r) => Math.log1p(r[1].loss[0]))) *
              1.15,
            curves: runs.map(([, r, c]) => ({
              data: r.loss.map((v, i) => [i, Math.log1p(Math.max(0, v))]),
              color: c,
            })),
            xlabel: "update",
            ylabel: "log(1 + loss)",
          }),
        ),
        panel(
          "What is carried into the next step?",
          `<p class="visual-note">${tex("m_k=0.9m_{k-1}+0.1g_k")}</p><p class="visual-note">${tex("\\Delta\\theta_{\\mathrm{momentum}}=-\\eta m_k")}</p><p class="visual-note">${tex("\\Delta\\theta_{\\mathrm{Adam}}=-\\eta\\hat m_k/(\\sqrt{\\hat v_k}+10^{-8})")}</p>`,
          "SGD uses the present gradient. Momentum remembers a weighted average. Adam remembers squared gradients as well and corrects the initial bias.",
        ),
      )
    );
  },
  caption:
    "Each method recomputes gradients at its own current location; these are not responses to a prescribed signal. All use the displayed learning rate. This momentum uses an exponential average (including the factor 0.1), matching the formula here. Adam uses β₁ = 0.9 and β₂ = 0.999. The landscapes are explicit teaching functions, not the world-model objective.",
};

function gridPicture(s, linear) {
  const J = [
      [2 * s.x, 1],
      [s.y, s.x],
    ],
    radius = s.radius,
    extent =
      radius *
        Math.max(1, Math.abs(2 * s.x) + 1, Math.abs(s.y) + Math.abs(s.x)) +
      radius * radius,
    scale = 124 / extent,
    M = ([a, b]) => [150 + a * scale, 132 - b * scale];
  let b = line(25, 132, 275, 132) + line(150, 15, 150, 249);
  const transform = (a, c) =>
    linear
      ? [J[0][0] * a + c, J[1][0] * a + J[1][1] * c]
      : [
          (s.x + a) ** 2 + s.y + c - s.x * s.x - s.y,
          (s.x + a) * (s.y + c) - s.x * s.y,
        ];
  for (let i = -3; i <= 3; i++)
    for (const axis of [0, 1]) {
      const v = (i * radius) / 3,
        pts = Array.from({ length: 101 }, (_, j) => {
          let t = -radius + (2 * radius * j) / 100;
          return M(transform(...(axis ? [v, t] : [t, v])));
        });
      b += path(pts, linear ? "teal" : "blue", i === 0 ? 1.8 : 0.8);
    }
  const dx = s.axis === "x" ? s.h * s.radius : 0,
    dy = s.axis === "y" ? s.h * s.radius : 0,
    p = M(transform(dx, dy));
  b += arrow(150, 132, p[0], p[1], "amber", 2) + dot(...p, 3, "amber");
  return svg(
    b,
    linear
      ? "Jacobian approximation of a local grid"
      : "Nonlinear image of the same local grid",
    300,
    264,
  );
}
export const jacobianSpec = {
  title: "The Jacobian is a local map",
  question:
    "Compare the same neighborhood in two separate views. Shrink it to see the linear approximation improve.",
  controls: [
    range("x", "Base x", -0.8, 1.5, 0.02, 0.8),
    range("y", "Base y", -0.8, 1.5, 0.02, -0.6),
    range("radius", "Neighborhood radius", 0.05, 0.7, 0.01, 0.4),
    range("h", "Step / neighborhood radius", -1, 1, 0.05, 0.5),
    choices("axis", "Change one input", ["x", "y"]),
  ],
  draw(s) {
    const dx = s.axis === "x" ? s.h * s.radius : 0,
      dy = s.axis === "y" ? s.h * s.radius : 0,
      actual = [2 * s.x * dx + dx * dx + dy, s.y * dx + s.x * dy + dx * dy],
      pred = [2 * s.x * dx + dy, s.y * dx + s.x * dy];
    return (
      row(
        panel("Exact nonlinear map · blue", gridPicture(s, false)),
        panel("Jacobian approximation · teal", gridPicture(s, true)),
      ) +
      `<div class="jacobian-strip">${eq("f(x,y)=(x^2+y,xy)^\\top")}${eq(`J=\\begin{pmatrix}${f(2 * s.x)}&1\\\\${f(s.y)}&${f(s.x)}\\end{pmatrix}`)}<div class="visual-note">${tex(`\\Delta f=(${actual.map((v) => f(v, 3)).join(",")})^\\top`)}<br>${tex(`J\\Delta x=(${pred.map((v) => f(v, 3)).join(",")})^\\top`)}<br>Approximation error: ${f(Math.hypot(...actual.map((v, i) => v - pred[i])), 4)}</div></div>`
    );
  },
  caption:
    "Both panels use the same magnification and equal horizontal/vertical units. The center represents f at the base point; the grid shows output displacements. The step slider specifies a fraction of the neighborhood radius. The amber vector changes only the selected input, so its linear prediction follows the corresponding Jacobian column. Magnification adjusts together when the neighborhood changes.",
};
export function normalization(s) {
  const a = [
      [1, 2, 6],
      [3 + s.shift, 4 + s.shift, 2 + s.shift],
      [5, 1, 3],
    ],
    r = 0,
    c = 1,
    values = s.mode === "LayerNorm" ? a[r] : a.map((row) => row[c]),
    mu =
      s.mode === "Stored statistics"
        ? 2
        : values.reduce((a, b) => a + b) / values.length,
    variance =
      s.mode === "Stored statistics"
        ? 4
        : values.reduce((sum, v) => sum + (v - mu) ** 2, 0) / values.length;
  const out = a.map((row, i) =>
    row.map((v, j) => {
      const group = s.mode === "LayerNorm" ? row : a.map((row) => row[j]),
        m =
          s.mode === "Stored statistics"
            ? 2
            : group.reduce((a, b) => a + b) / group.length,
        vr =
          s.mode === "Stored statistics"
            ? 4
            : group.reduce((s, x) => s + (x - m) ** 2, 0) / group.length;
      return (v - m) / Math.sqrt(vr + 1e-5);
    }),
  );
  return { a, out, mu, variance, values };
}
export const normalizationSpec = {
  title: "Normalize across features—or across examples?",
  question:
    "Track feature 2 of example A. Change example B and see whether A’s normalized value changes.",
  controls: [
    choices("mode", "Statistics come from", [
      "LayerNorm",
      "BatchNorm",
      "Stored statistics",
    ]),
    range("shift", "Change example B", -2, 4, 0.1, 0),
  ],
  draw(s) {
    const { a, out, mu, variance, values } = normalization(s);
    const table = (data, output) =>
      `<table class="norm-table"><caption>${output ? "After normalization" : "Before normalization"}</caption><thead><tr><th scope="col">Example</th>${[1, 2, 3].map((v) => `<th scope="col">Feature ${v}</th>`).join("")}</tr></thead><tbody>${data.map((row, i) => `<tr><th scope="row">${["A", "B", "C"][i]}${i === 1 ? " <small>adjustable</small>" : ""}</th>${row.map((v, j) => `<td class="${i === 0 && j === 1 ? "norm-target " : ""}${(s.mode === "LayerNorm" && i === 0) || (s.mode === "BatchNorm" && j === 1) ? "norm-group" : ""}">${f(v, output ? 2 : 1)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    return `<div class="norm-comparison">${table(a, false)}${table(out, true)}</div><div class="norm-explanation"><div><span class="eyebrow">Statistics for the marked value</span><p>${s.mode === "LayerNorm" ? "Read across example A: its three features." : s.mode === "BatchNorm" ? "Read down feature 2: values from all three examples." : "Read neither row nor column: reuse previously stored moments."}</p><p class="visual-note">${s.mode === "Stored statistics" ? "Illustrative stored mean 2 and variance 4. These are held fixed." : `The highlighted group contains ${values.map((v) => f(v, 1)).join(", ")}.`}</p></div><div>${eq(`\\mu=${f(mu)},\\quad\\sigma^2=${f(variance)}`)}${eq(`\\frac{2-${f(mu)}}{\\sqrt{${f(variance)}+10^{-5}}}=${f(out[0][1], 3)}`)}</div></div>`;
  },
  caption:
    "Each row is one example’s representation; each column is the same learned feature across examples. LayerNorm uses a row. Training-time BatchNorm uses a column. Evaluation-time BatchNorm uses stored training statistics. Gain is 1 and offset is 0 here, so the effect of the statistics is isolated.",
};
export function rolloutData(n) {
  let truth = [1],
    free = [1],
    forced = [1];
  for (let i = 1; i <= n; i++) {
    truth.push(0.98 * truth[i - 1] + 0.1);
    forced.push(1.04 * truth[i - 1] + 0.03);
    free.push(1.04 * free[i - 1] + 0.03);
  }
  return { truth, free, forced };
}
function forecastPlot(truth, pred, color) {
  const X = (i) => 55 + i * 13.5,
    Y = (v) => 235 - v * (200 / 3.5);
  const area = `M${truth.map((v, i) => `${i ? "L" : ""}${X(i)} ${Y(v)}`).join("")}L${pred
    .map((_, i) => {
      const k = pred.length - i - 1;
      return `${X(k)} ${Y(pred[k])}`;
    })
    .join("L")}Z`;
  return plot({
    xmin: 0,
    xmax: 20,
    ymin: 0,
    ymax: 3.5,
    curves: [
      { data: truth.map((v, i) => [i, v]), color: "blue" },
      { data: pred.map((v, i) => [i, v]), color },
    ],
    points: pred.map((v, i) => [i, v, color, 2]),
    xlabel: "prediction step",
    ylabel: "position",
    extra: `<path d="${area}" fill="var(--${color})" opacity=".12"/>`,
  });
}
export const rolloutSpec = {
  title: "One good step does not guarantee a good rollout",
  question:
    "The model is the same on both sides. Only the source of its next input changes.",
  controls: [range("horizon", "Prediction steps", 1, 20, 1, 20)],
  draw(s) {
    const { truth, forced, free } = rolloutData(s.horizon),
      rmse = (a) =>
        Math.sqrt(
          a.slice(1).reduce((sum, v, i) => sum + (v - truth[i + 1]) ** 2, 0) /
            s.horizon,
        );
    return (
      row(
        panel(
          "Fresh observation at every step",
          forecastPlot(truth, forced, "amber"),
          `${legend([
            ["True position", "blue"],
            ["One-step prediction", "amber"],
          ])}At each step, feed the model the true previous position. RMSE ${f(rmse(forced), 3)}.`,
        ),
        panel(
          "Predictions become the next inputs",
          forecastPlot(truth, free, "teal"),
          `${legend([
            ["True position", "blue"],
            ["Free rollout", "teal"],
          ])}After the first observation, feed each prediction back. RMSE ${f(rmse(free), 3)}.`,
        ),
      ) +
      `<div class="signal-strip"><div><span>Environment</span>${tex("x_{t+1}=0.98x_t+0.10")}</div><div><span>Same model on both sides</span>${tex("\\hat f(u)=1.04u+0.03")}</div></div>`
    );
  },
  caption:
    "Dots are discrete time steps; connecting lines guide the eye. Shaded gaps show prediction error on identical axes. These are computed trajectories of the stated scalar rules, not measurements of the neural model. A small mismatch changes the contexts encountered during free rollout.",
};
