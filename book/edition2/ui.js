import "./visuals/runtime.js";
import { icon } from "../../tools/icons.mjs";
import "./foundation-labs.js";
import { initialArm, poseError } from "../world/simulator.ts";
import { renderSensor } from "../world/sensor.ts";
import * as math from "./numerics.js";
import { armGeometry, armDrawing } from "../../tools/arm-plates.mjs";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
import "./reader.js";
import { palette as colors } from "./palette.js";
$("#print").onclick = () => window.print();
let printDetails = [];
addEventListener("beforeprint", () => {
  printDetails = $$("article details").map((d) => [d, d.open]);
  printDetails.forEach(([d]) => (d.open = true));
});
addEventListener("afterprint", () =>
  printDetails.forEach(([d, o]) => (d.open = o)),
);
$$(".copy-code").forEach(
  (b) =>
    (b.onclick = async () => {
      const label = b.querySelector("span");
      try {
        await navigator.clipboard.writeText(
          b.closest(".code-wrap").querySelector("code").textContent,
        );
        label.textContent = "Copied";
        setTimeout(() => (label.textContent = "Copy"), 1500);
      } catch {
        label.textContent = "Select to copy";
      }
    }),
);
const syncChoices = () =>
  $$("[data-select]").forEach((b) => {
    const select = document.getElementById(b.dataset.select);
    b.setAttribute("aria-pressed", String(select.value === b.dataset.value));
    b.disabled = select.disabled;
  });
$$("[data-select]").forEach(
  (b) =>
    (b.onclick = () => {
      const select = document.getElementById(b.dataset.select);
      select.value = b.dataset.value;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncChoices();
    }),
);
$$("select.select-state").forEach((select) =>
  select.addEventListener("change", syncChoices),
);
$$(".controls input[type=range]").forEach((input) => {
  input.parentElement.classList.add("range-field");
  const value = document.createElement("span");
  value.className = "range-value";
  input.after(value);
  const update = () => {
    value.textContent =
      input.dataset.valueFormat === "power2"
        ? String(2 ** Number(input.value))
        : Number(input.value).toFixed(2);
    input.style.setProperty(
      "--fill",
      (100 * (input.value - input.min)) / (input.max - input.min) + "%",
    );
  };
  input.addEventListener("input", update);
  update();
});
addEventListener(
  "scroll",
  () =>
    ($(".progress").style.width =
      (100 * scrollY) /
        Math.max(1, document.documentElement.scrollHeight - innerHeight) +
      "%"),
  { passive: true },
);

// All scientific panels use fixed geometric coordinates and a matching CSS ratio.
// ResizeObserver redraws the backing store at the actual device pixel density.
const redraws = new Map();
addEventListener("book-theme-change", () =>
  redraws.forEach((_, canvas) => paint(canvas)),
);
function surface(canvas, fn) {
  if (!canvas) return;
  redraws.set(canvas, fn);
  new ResizeObserver(() => paint(canvas)).observe(canvas);
  paint(canvas);
}
function paint(canvas) {
  if (canvas instanceof SVGElement) {
    redraws.get(canvas)?.();
    return;
  }
  const box = canvas.getBoundingClientRect(),
    w = box.width;
  if (!w) return;
  const logical = canvas.classList.contains("square") ? [360, 360] : [720, 360],
    dpr = Math.min(devicePixelRatio || 1, 3),
    h = (w * logical[1]) / logical[0];
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const c = canvas.getContext("2d");
  c.setTransform(
    canvas.width / logical[0],
    0,
    0,
    canvas.height / logical[1],
    0,
    0,
  );
  c.clearRect(0, 0, ...logical);
  c.font = "12px system-ui";
  c.lineWidth = 1;
  redraws.get(canvas)(c, ...logical);
}
function line(c, pts, color = colors.line, width = 1, dash = []) {
  c.beginPath();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dash);
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
  c.setLineDash([]);
}
function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
}
function txt(c, x, y, s, color = colors.muted, align = "left") {
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(s, x, y);
}
function squareAxes(c, limit = 3.5) {
  const scale = 140 / limit;
  line(c, [
    [20, 180],
    [340, 180],
  ]);
  line(c, [
    [180, 20],
    [180, 340],
  ]);
  for (let v = -3; v <= 3; v++) {
    if (!v) continue;
    txt(c, 180 + v * scale, 195, String(v), colors.muted, "center");
    txt(c, 166, 184 - v * scale, String(v), colors.muted, "right");
  }
  return (p) => [180 + p[0] * scale, 180 - p[1] * scale];
}

const cf = $("#phasor-lab");
if (cf) {
  const samples = [-1, -0.5, 0.5, 1],
    range = cf.querySelector("input");
  let omega = +range.value;
  const a = cf.querySelector("[data-plot=phasors]"),
    b = cf.querySelector("[data-plot=cf]");
  surface(a, (c) => {
    line(c, [
      [20, 180],
      [340, 180],
    ]);
    line(c, [
      [180, 20],
      [180, 340],
    ]);
    c.beginPath();
    c.arc(180, 180, 126, 0, Math.PI * 2);
    c.strokeStyle = colors.line;
    c.stroke();
    samples.forEach((x, i) => {
      const px = 180 + 126 * Math.cos(omega * x),
        py = 180 - 126 * Math.sin(omega * x);
      line(
        c,
        [
          [180, 180],
          [px, py],
        ],
        colors.lat,
        1.5,
      );
      dot(c, px, py, 4, colors.lat);
      txt(c, px, py - 12, String(x), colors.lat, "center");
    });
    const { c: re, s: im, q } = math.ecf(samples, omega);
    line(
      c,
      [
        [180, 180],
        [180 + 126 * re, 180 - 126 * im],
      ],
      colors.pred,
      3,
    );
    dot(c, 180 + 126 * re, 180 - 126 * im, 5, colors.pred);
    dot(c, 180 + 126 * q, 180, 4, colors.obs);
    txt(c, 330, 170, "Re", colors.muted, "right");
    txt(c, 190, 30, "Im");
  });
  surface(b, (c) => {
    const x = (w) => 35 + (290 * w) / 6,
      y = (v) => 180 - 130 * v;
    line(c, [
      [35, 30],
      [35, 315],
    ]);
    line(c, [
      [35, 180],
      [330, 180],
    ]);
    for (const [key, color] of [
      ["c", colors.pred],
      ["s", colors.lat],
      ["q", colors.obs],
    ])
      line(
        c,
        Array.from({ length: 150 }, (_, i) => {
          const w = (6 * i) / 149;
          return [x(w), y(math.ecf(samples, w)[key])];
        }),
        color,
        2,
        key === "s" ? [3, 4] : [],
      );
    line(
      c,
      [
        [x(omega), 30],
        [x(omega), 315],
      ],
      colors.act,
      1,
      [4, 4],
    );
    txt(c, 330, 337, "frequency ω", colors.muted, "right");
    txt(c, 43, 28, "1");
    txt(c, 43, 312, "−1");
    for (let w = 0; w <= 6; w++) {
      txt(c, x(w), 198, String(w), colors.muted, "center");
    }
    txt(c, 43, 177, "0");
  });
  const update = () => {
    omega = +range.value;
    const v = math.ecf(samples, omega);
    cf.querySelector("output").textContent =
      `ω = ${omega.toFixed(2)}   mean cosine = ${v.c.toFixed(4)}   mean sine = ${v.s.toFixed(4)}\nGaussian target = ${v.q.toFixed(4)}   squared discrepancy = ${((v.c - v.q) ** 2 + v.s ** 2).toFixed(5)}`;
    paint(a);
    paint(b);
  };
  range.oninput = update;
  update();
}

const sl = $("#sigreg-lab");
if (sl) {
  let points = [];
  const select = sl.querySelector("select"),
    range = sl.querySelector("input[type=range]"),
    nsel = sl.querySelector("[data-batch]"),
    msel = sl.querySelector("[data-directions]"),
    ksel = sl.querySelector("[data-knots]"),
    a = sl.querySelector("[data-plot=cloud]"),
    b = sl.querySelector("[data-plot=spectrum]");
  surface(a, (c) => {
    const map = squareAxes(c);
    for (const p of points) {
      const [x, y] = map(p);
      if (x >= 15 && x <= 345 && y >= 15 && y <= 345)
        dot(c, x, y, 2.2, colors.lat);
    }
    txt(c, 20, 25, "equal units on both axes");
  });
  surface(b, (c) => {
    const h = points.map((p) => p[0]),
      samples = Array.from({ length: 101 }, (_, i) => {
        const w = (3 * i) / 100,
          v = math.ecf(h, w);
        return [w, (v.c - v.q) ** 2 + v.s ** 2];
      }),
      top = Math.max(
        0.02,
        Math.ceil(Math.max(...samples.map((x) => x[1])) * 100) / 100,
      ),
      x = (w) => 48 + (282 * w) / 3,
      y = (v) => 305 - (250 * v) / top;
    line(c, [
      [48, 55],
      [48, 305],
      [335, 305],
    ]);
    for (let k = 0; k <= 4; k++) {
      const v = (top * k) / 4;
      line(
        c,
        [
          [48, y(v)],
          [335, y(v)],
        ],
        colors.line,
      );
      txt(c, 42, y(v) + 4, v.toFixed(top < 0.1 ? 3 : 2), colors.muted, "right");
    }
    line(
      c,
      samples.map(([w, v]) => [x(w), y(v)]),
      colors.loss,
      2,
    );
    for (let w = 0; w <= 3; w++)
      txt(c, x(w), 324, String(w), colors.muted, "center");
    txt(c, 48, 25, "squared CF error · horizontal projection", colors.loss);
    txt(
      c,
      330,
      346,
      "frequency ω · vertical scale adapts",
      colors.muted,
      "right",
    );
  });
  const update = () => {
    const scale = +range.value;
    points = math
      .cloud(select.value, +nsel.value)
      .map((p) => p.map((v) => v * scale));
    const opts = { m: +msel.value, knots: +ksel.value },
      v = math.sigreg(points, opts),
      s = math.covariance(points),
      h = points.map((p) => p[0]);
    sl.querySelector("output").textContent =
      `scale = ${scale.toFixed(2)}   T = ${v.toFixed(4)}   unscaled D ≈ ${(v / points.length).toFixed(5)}\nmean = (${s.mu.map((x) => x.toFixed(3)).join(", ")})   covariance eigenvalues = ${s.eigenvalues.map((x) => x.toFixed(3)).join(", ")}\nHorizontal projection: finite grid D = ${math.ep(h, { knots: +ksel.value, scaled: false }).toFixed(6)}; full-line closed form = ${math.closedEP(h).toFixed(6)}.`;
    paint(a);
    paint(b);
  };
  [select, nsel, msel, ksel, range].forEach((e) => (e.oninput = update));
  sl.querySelector("[data-gradient]").onclick = () => {
    const pts = [
        [-0.7, 0.2],
        [0.4, -0.9],
        [1.2, 0.3],
      ],
      g = math.sigreg(pts, { gradient: true }),
      eps = 1e-5;
    let error = 0;
    pts.forEach((p, i) =>
      p.forEach((_, d) => {
        const plus = pts.map((p) => p.slice()),
          minus = pts.map((p) => p.slice());
        plus[i][d] += eps;
        minus[i][d] -= eps;
        error = Math.max(
          error,
          Math.abs(
            (math.sigreg(plus) - math.sigreg(minus)) / (2 * eps) -
              g.gradient[i][d],
          ),
        );
      }),
    );
    sl.querySelector("[data-check]").textContent =
      `Analytic versus central finite-difference gradient: maximum absolute error ${error.toExponential(2)}. This checks the implemented finite sum, not all population claims.`;
  };
  update();
}

let worker = null,
  requestId = 0;
const pending = new Map();
let continuous = false,
  pauseRequested = false;
let forecastRecord = null,
  forecastStep = null,
  forecastAnimation = 0,
  printSnapshot = false;
let busy = false,
  info = null,
  backend = "",
  history = [],
  evaluation = null,
  comparison = null,
  scene = null,
  controlHistory = [],
  lastMetrics = null;
const exportState = () => ({
  recorded: new Date().toISOString(),
  info,
  backend,
  history,
  evaluation,
  comparison,
  controlHistory,
  forecasts: forecastRecord,
  forecastStep,
});
function request(op, args = {}) {
  if (!worker) throw Error("Prepare the model first");
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, op, ...args });
  });
}
function createWorker() {
  worker?.terminate();
  for (const p of pending.values()) p.reject(Error("Experiment reset"));
  pending.clear();
  const source = atob($("#world-worker").textContent.trim()),
    url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  worker = new Worker(url);
  URL.revokeObjectURL(url);
  worker.onerror = (e) => {
    for (const p of pending.values()) p.reject(Error(e.message));
    pending.clear();
    status("Worker failed: " + e.message, true);
    setBusy(false);
  };
  worker.onmessage = ({ data: m }) => {
    if (m.event === "metrics") {
      if (m.phase === "regularized") {
        lastMetrics = m.metrics;
        history.push(m.metrics);
        if (history.length > 1200)
          history = history.filter((_, i) => i % 2 === 0);
        $("#world-step").textContent = m.metrics.step.toLocaleString();
        paint($("#world-curves"));
      }
      status(
        `${m.phase === "regularized" ? "Training" : "Prediction-only comparison"} · update ${m.metrics.step.toLocaleString()} · ${m.metrics.stepMs.toFixed(1)} ms for this update`,
      );
      return;
    }
    if (m.event === "control") {
      scene = m.scene;
      controlHistory.push({
        step: scene.step,
        error: scene.error,
        action: scene.action,
        cost: scene.cost,
      });
      drawScene();
      return;
    }
    const p = pending.get(m.id);
    if (p) {
      pending.delete(m.id);
      m.ok ? p.resolve(m.result) : p.reject(Error(m.error));
    }
  };
}
function status(text, error = false) {
  $("#world-status").textContent = text;
  $("#world-status").classList.toggle("bad", error);
}
function setBusy(value) {
  busy = value;
  ["world-init", "world-seed", "world-budget", "world-goal"].forEach(
    (id) => ($("#" + id).disabled = value),
  );
  [
    "world-train",
    "world-evaluate",
    "world-control",
    "world-control-reset",
    "world-forecast",
  ].forEach((id) => ($("#" + id).disabled = value || !info));
  $("#world-compare").disabled = value || !evaluation || evaluation.step === 0;
  $("#world-export").disabled = value || !evaluation;
  $("#world-stop").disabled = !value;
  syncChoices();
}
function evaluateView(v) {
  evaluation = v;
  drawFutureChoices(v.futureMatching);
  updateReport();
  $("#world-step").textContent = v.step.toLocaleString();
  $("#world-ratio").textContent =
    v.persistenceLoss > 1e-15
      ? (v.predictionLoss / v.persistenceLoss).toFixed(3)
      : "near zero";
  $("#world-spread").textContent = v.spread.toFixed(4);
  $("#world-evaluation").textContent =
    `Held out · prediction ${v.predictionLoss.toExponential(3)} · persistence ${v.persistenceLoss.toExponential(3)}\nShuffled action / prediction ${(v.shuffledActionLoss / Math.max(1e-15, v.predictionLoss)).toFixed(2)} · removed history / prediction ${(v.noHistoryLoss / Math.max(1e-15, v.predictionLoss)).toFixed(2)}\nEffective rank ${v.effectiveRank.toFixed(2)} / ${info.config.latent} · minimum coordinate standard deviation ${v.minimumStd.toFixed(4)}\nFuture-image matching ${v.futureMatching.correct}/${v.futureMatching.total} · persistence ${v.futureMatching.persistenceCorrect}/${v.futureMatching.total}. Fixed candidate set; inspect other diagnostics too.`;
}
function comparisonView(r) {
  comparison = r;
  const fmt = (x) => x.toExponential(3);
  $("#world-comparison").innerHTML =
    `<div class="table-wrap"><table><thead><tr><th>Objective</th><th>Updates</th><th>Prediction MSE</th><th>Spread</th><th>Effective rank</th><th>Future choices</th></tr></thead><tbody>${[
      ["Prediction + SIGReg", r.regularized],
      ["Prediction only", r.unregularized],
    ]
      .map(
        ([name, v]) =>
          `<tr><td>${name}</td><td>${v.step}</td><td>${fmt(v.predictionLoss)}</td><td>${fmt(v.spread)}</td><td>${v.effectiveRank.toFixed(2)}</td><td>${v.futureMatching.correct}/${v.futureMatching.total}</td></tr>`,
      )
      .join(
        "",
      )}</tbody></table></div><p class="lab-note">${r.complete ? "Matched update counts." : "Comparison paused early: update counts differ."} Training data and parameter initialization are matched; resulting latent coordinate systems differ.</p>`;
}
function sensor(canvas, values) {
  canvas.classList.add("sensor-image");
  values =
    Array.isArray(values) || ArrayBuffer.isView(values)
      ? values
      : Object.values(values);
  const c = canvas.getContext("2d"),
    r = Math.sqrt(values.length);
  canvas.width = r;
  canvas.height = r;
  const image = c.createImageData(r, r);
  values.forEach((v, i) => {
    image.data[4 * i] =
      image.data[4 * i + 1] =
      image.data[4 * i + 2] =
        Math.round(v * 255);
    image.data[4 * i + 3] = 255;
  });
  c.putImageData(image, 0, 0);
}
function drawScene() {
  if (!scene) return;
  updateReport();
  sensor($("#world-current"), scene.frame);
  sensor($("#world-goal-image"), scene.goalFrame);
  paint($("#world-control-plot"));
  $("#world-control-output").textContent =
    `Action ${scene.step} · physical joint RMS error ${scene.error.toFixed(3)} rad${scene.action ? " · normalized action = [" + scene.action.map((x) => x.toFixed(3)).join(", ") + "]" : ""}\n${scene.readoutError !== undefined ? "Separate drawing-readout RMS error " + scene.readoutError.toFixed(3) + " rad. " : ""}Physical error is evaluation only; the planner scores predicted latent distance.`;
}
async function guarded(fn) {
  if (busy) return;
  setBusy(true);
  try {
    return await fn();
  } catch (e) {
    status(e.message, true);
    throw e;
  } finally {
    setBusy(false);
  }
}
const api = {
  renderPrintSnapshot(record) {
    if (!matchMedia("print").matches)
      throw Error("Recorded snapshots are only for the static print edition.");
    printSnapshot = true;
    info = record.info;
    history = record.history;
    evaluation = record.evaluation;
    comparison = record.comparison;
    evaluateView(evaluation);
    if (comparison) comparisonView(comparison);
    if (record.forecasts) drawForecasts(record.forecasts, record.forecastStep);
    else
      $("#world-forecasts").innerHTML =
        '<p class="lab-note">The interactive edition compares three commands from one frozen context. This recorded training run did not save those forecasts; no trajectories are inferred from its summary statistics.</p>';
    updateReport();
    paint($("#world-curves"));
    status(
      `Recorded worked example · seed ${info.seed} · ${evaluation.step.toLocaleString()} updates · WebGPU run. These are saved measurements, not live training in the PDF.`,
    );
    $("#control-lab").classList.add("screen-only");
  },
  async init(options = {}, requestedBackend) {
    return guarded(async () => {
      status("Generating observations and preparing the numerical backend…");
      printSnapshot = false;
      info = null;
      history = [];
      comparison = null;
      evaluation = null;
      controlHistory = [];
      $("#world-comparison").innerHTML = "";
      createWorker();
      const r = await request("init", {
        options: { seed: +$("#world-seed").value, ...options },
        backend: requestedBackend,
      });
      info = r.info;
      backend = r.backend;
      scene = r.scene;
      drawScene();
      const initialEvaluation = await request("evaluate");
      evaluateView(initialEvaluation);
      history.push({
        step: 0,
        predictionLoss: initialEvaluation.predictionLoss,
        regularizer: initialEvaluation.regularizer ?? 0,
      });
      paint($("#world-curves"));
      status(
        `${backend.toUpperCase()} · ${info.parameters.toLocaleString()} parameters · ${info.transitions.toLocaleString()} training transitions · random weights, ready to train.`,
      );
      drawForecasts(await request("forecasts"));
      return r;
    });
  },
  async train(steps = +$("#world-budget").value) {
    return guarded(async () => {
      continuous = steps === 0;
      pauseRequested = false;
      let remaining = continuous ? Infinity : steps,
        r;
      status("Compiling the first update, then learning from batches…");
      while (remaining > 0 && !pauseRequested) {
        const chunk = Math.min(250, remaining);
        r = await request("train", { steps: chunk });
        lastMetrics = r.metrics;
        history.push(r.metrics);
        if (history.length > 1200)
          history = history.filter((_, i) => i % 2 === 0);
        evaluateView(r.evaluation);
        paint($("#world-curves"));
        remaining -= chunk;
        if (steps === 0 && !continuous) break;
        if (r.stopped) break;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      continuous = false;
      status(
        `Training paused at ${(r?.metrics.step ?? evaluation?.step ?? 0).toLocaleString()} updates. Weights, Adam moments and random streams are retained. Press Train to resume.`,
      );
      return r;
    });
  },
  async evaluate() {
    return guarded(async () => {
      status("Evaluating separate trajectories…");
      const r = await request("evaluate");
      evaluateView(r);
      status("Held-out evaluation complete.");
      return r;
    });
  },
  async compare() {
    return guarded(async () => {
      status("Training a fresh matched prediction-only model…");
      const r = await request("compare");
      comparisonView(r);
      status(
        r.complete
          ? "Matched comparison complete. Your regularized model is still active."
          : "Comparison paused; the table reports both update counts.",
      );
      return r;
    });
  },
  async control(steps = 20) {
    return guarded(async () => {
      status(
        "Planning through the learned model; preparing the separate drawing readout…",
      );
      const r = await request("control", {
        steps,
        goal: +$("#world-goal").value,
      });
      scene = { ...scene, ...r.scene };
      drawScene();
      status(
        "Control sequence finished. Inspect the physical error and the imagined futures.",
      );
      return r;
    });
  },
  async resetScene() {
    return guarded(async () => {
      scene = await request("scene", { goal: +$("#world-goal").value });
      controlHistory = [];
      drawScene();
      return scene;
    });
  },
  stop: () => {
    continuous = false;
    pauseRequested = true;
    return request("stop");
  },
  async forecasts() {
    return guarded(async () => {
      status("Comparing three commands from one frozen context…");
      const r = await request("forecasts");
      drawForecasts(r);
      status(
        `Forecasts frozen at update ${evaluation.step}. Solid paths are simulated outcomes; dashed paths use learned predictions plus the diagnostic readout.`,
      );
      return r;
    });
  },
  snapshot: exportState,
  async dispose() {
    worker?.terminate();
    worker = null;
    info = null;
    setBusy(false);
  },
};
if ($("#world-lab")) {
  surface($("#world-curves"), (c) => {
    line(c, [
      [60, 30],
      [60, 305],
      [690, 305],
    ]);
    txt(c, 70, 23, "log₁₀ loss", colors.muted);
    txt(c, 680, 353, "training updates", colors.muted, "right");
    for (let i = -8; i <= 2; i += 2) {
      const y = 305 - (i + 8) * 26;
      line(
        c,
        [
          [60, y],
          [690, y],
        ],
        colors.line,
      );
      txt(c, 50, y + 4, `10^${i}`, colors.muted, "right");
    }
    const max = Math.max(500, ...history.map((m) => m.step));
    for (let i = 0; i <= 4; i++)
      txt(
        c,
        60 + (630 * i) / 4,
        325,
        Math.round((max * i) / 4).toLocaleString(),
        colors.muted,
        "center",
      );
    for (const [key, color, mul] of [
      ["predictionLoss", colors.pred, 1],
      ["regularizer", colors.loss, 0.01],
    ]) {
      const points = history.map((m) => [
        60 + (630 * m.step) / max,
        305 -
          26 *
            (Math.max(
              -8,
              Math.min(2, Math.log10(Math.max(1e-12, m[key] * mul))),
            ) +
              8),
      ]);
      line(c, points, color, 2);
      points.forEach((p) => dot(c, p[0], p[1], 3, color));
    }
    txt(c, 83, 51, "prediction MSE", colors.pred);
    txt(c, 300, 51, "0.01 × SIGReg", colors.loss);
    if (!history.length)
      txt(
        c,
        360,
        185,
        "Initializing actual random-weight measurements…",
        colors.muted,
        "center",
      );
  });
  surface($("#world-control-plot"), () => {
    const svg = $("#world-control-plot");
    if (!scene) {
      svg.innerHTML =
        '<text x="360" y="180" text-anchor="middle" class="instrument-label">Prepare the model to observe the mechanism.</text>';
      return;
    }
    const skeleton = (state, role, opacity, dashed = false) => {
      const { base, elbow, tip } = armGeometry(state, 360, 180, 165);
      return `<path d="M${base.x} ${base.y}L${elbow.x} ${elbow.y}L${tip.x} ${tip.y}" fill="none" stroke="var(--${role})" stroke-width="${dashed ? 2 : 1.5}" stroke-linecap="round" opacity="${opacity}" ${dashed ? 'stroke-dasharray="6 5"' : ""}/>`;
    };
    svg.innerHTML = `<title>Actual pose and imagined consequences</title>
      <desc>The solid blue mechanism is the actual state. The dashed amber outline is the goal. Translucent teal outlines are imagined states from a separately fitted diagnostic readout.</desc>
      <circle cx="360" cy="180" r="140.25" class="reach-guide"/>
      <path d="M180 180H540M360 32V328" class="reach-guide"/>
      ${(scene.imagined || []).map((state, i) => skeleton(state, "teal", 0.15 + (0.4 * (i + 1)) / scene.imagined.length)).join("")}
      ${skeleton(scene.goal, "amber", 0.9, true)}
      ${armDrawing(scene.state, 360, 180, 165)}
      <text x="24" y="26" class="instrument-label">Actual pose and imagined consequences</text>
      <text x="24" y="345" class="instrument-label">The camera images above are the model’s inputs.</text>`;
  });
  $("#world-init").onclick = () => api.init().catch(() => {});
  $("#world-train").onclick = () => api.train().catch(() => {});
  $("#world-evaluate").onclick = () => api.evaluate().catch(() => {});
  $("#world-compare").onclick = () => api.compare().catch(() => {});
  $("#world-stop").onclick = () => {
    status("Pausing after the current update or action…");
    api.stop().catch(() => {});
  };
  $("#world-control").onclick = () => api.control().catch(() => {});
  $("#world-control-reset").onclick = () => api.resetScene().catch(() => {});
  $("#world-goal").onchange = () => {
    if (info) api.resetScene().catch(() => {});
  };
  $("#capstone-export").onclick = () => $("#world-export").click();
  $("#world-export").onclick = () => {
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(exportState(), null, 2)], {
          type: "application/json",
        }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = `world-model-seed-${info.seed}-step-${evaluation.step}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };
  const start = initialArm(),
    goal = { q1: -0.9, q2: 1 };
  scene = {
    state: start,
    previous: { ...start },
    goal,
    frame: renderSensor(start),
    goalFrame: renderSensor(goal),
    error: poseError(start, goal),
    step: 0,
  };
  drawScene();
  $("#world-forecasts").innerHTML =
    '<div class="visual-panels">' +
    ["Push", "Reverse", "Release"]
      .map(
        (name) =>
          `<div class="visual-panel"><h4>${name}</h4><svg viewBox="0 0 360 280" role="img" aria-label="Shared starting pose">${armDrawing({ q1: -1.9, q2: 1.45 }, 180, 140, 125)}</svg><p class="lab-note">Shared context. Actual random-weight forecasts initialize with the nearby model.</p></div>`,
      )
      .join("") +
    "</div>";
  const lazy = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && !info && !busy) {
        lazy.disconnect();
        api.init().catch(() => {});
      }
    },
    { rootMargin: "500px" },
  );
  lazy.observe($("#world-lab"));
  lazy.observe($("#control-lab"));
  $("#world-forecast").onclick = () => api.forecasts().catch(() => {});
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && continuous) {
      api.stop();
      status(
        "Training paused because this page is hidden. Return and press Train to resume.",
      );
    }
  });
  addEventListener("pagehide", () => worker?.terminate());
}
window.WorldWorkshop = api;
window.SIGRegMath = math;
window.BookHasExperiment = () => Boolean(info) || busy;
function drawFutureChoices(probe) {
  const host = $("#future-choices");
  if (!host || !probe) return;
  host.innerHTML =
    `<h4>A fixed future-image question</h4><p class="lab-note">Same held-out examples at every checkpoint. Blue outlines mark the true future; teal marks the model’s choice. A tie is reported, not broken to inflate accuracy.</p>` +
    probe.examples
      .slice(0, 2)
      .map(
        (e, i) =>
          `<div class="future-case"><div><span>Current image</span><canvas data-example="${i}" data-current></canvas></div>${e.candidates.map((_, j) => `<div class="${j === e.correctIndex ? "true-future " : ""}${j === e.selectedIndex ? "chosen-future" : ""}"><span>Candidate ${j + 1}</span><canvas data-example="${i}" data-candidate="${j}"></canvas><small>distance ${e.distances[j].toExponential(2)}</small></div>`).join("")}</div><p class="lab-note">${e.selectedIndex === null ? "Model tied" : `Model chose ${e.selectedIndex + 1}`} · persistence ${e.persistenceIndex === null ? "tied" : e.persistenceIndex + 1} · true future ${e.correctIndex + 1} · action [${e.action.map((x) => x.toFixed(2)).join(", ")}]</p>`,
      )
      .join("");
  host.querySelectorAll("canvas").forEach((c) => {
    const e = probe.examples[+c.dataset.example];
    sensor(
      c,
      c.hasAttribute("data-current")
        ? e.current
        : e.candidates[+c.dataset.candidate],
    );
  });
}
function drawForecasts(results, step = evaluation?.step ?? 0) {
  forecastStep = step;
  forecastRecord = results;
  cancelAnimationFrame(forecastAnimation);
  const host = $("#world-forecasts");
  let frame = 0,
    playing = false,
    last = 0;
  host.innerHTML =
    `<p class="lab-note">${printSnapshot ? "Recorded" : "Frozen"} at update ${step}. Blue is the physical outcome; teal is the learned forecast drawn through a separately fitted pose readout. Both begin at the observed pose. The forecast stays fixed during further training.</p><div class="visual-controls screen-only"><button type="button" data-forecast-play aria-pressed="false">${icon("play")}<span>Replay</span></button><label class="visual-range"><span>Forecast step <output>0</output></span><input type="range" min="0" max="12" step="1" value="0" aria-label="Forecast step"></label></div><div class="visual-panels">` +
    results
      .map(
        (r, i) =>
          `<div class="visual-panel"><h4>${r.name}</h4><svg data-forecast-arm="${i}" viewBox="0 0 360 250" role="img" aria-label="${r.name}: blue physical arm and teal learned forecast"></svg><p class="lab-note">Readout RMS ${r.readoutError.toFixed(3)} rad. Forecast drawing error includes this separate readout.</p></div>`,
      )
      .join("") +
    "</div>";
  const slider = host.querySelector("input"),
    button = host.querySelector("button");
  const tips = (states, cx) =>
    states.map((s) => {
      const p = armGeometry(s, cx, 110, 95).tip;
      return [p.x, p.y];
    });
  const trace = (pts, color, dash) =>
    `<path d="${pts.map((p, i) => (i ? "L" : "M") + p.join(" ")).join("")}" stroke="var(--${color})" fill="none" stroke-width="2" ${dash ? 'stroke-dasharray="5 4"' : ""}/>`;
  const draw = () => {
    slider.value = frame;
    host.querySelector("output").textContent = frame;
    results.forEach((r, i) => {
      const actual = [r.start, ...r.actual],
        predicted = [r.start, ...r.poses];
      host.querySelector(`[data-forecast-arm="${i}"]`).innerHTML =
        trace(tips(actual, 90), "blue", false) +
        trace(tips(predicted, 270), "teal", true) +
        `<g class="forecast-predicted">${armDrawing(predicted[frame], 270, 110, 95)}</g><g class="forecast-actual">${armDrawing(actual[frame], 90, 110, 95)}</g><text x="90" y="230" text-anchor="middle" class="visual-label" fill="var(--blue)">Actual</text><text x="270" y="230" text-anchor="middle" class="visual-label" fill="var(--teal)">Learned</text>`;
    });
  };
  const setPlaying = (value) => {
    playing = value;
    button.innerHTML =
      icon(value ? "pause" : "play") +
      `<span>${value ? "Pause" : "Replay"}</span>`;
    button.setAttribute("aria-pressed", String(value));
  };
  const tick = (time) => {
    if (!playing) return;
    if (document.hidden) {
      setPlaying(false);
      return;
    }
    if (time - last > 240) {
      frame = (frame + 1) % 13;
      draw();
      last = time;
      if (frame === 12) {
        setPlaying(false);
        return;
      }
    }
    forecastAnimation = requestAnimationFrame(tick);
  };
  slider.oninput = () => {
    setPlaying(false);
    cancelAnimationFrame(forecastAnimation);
    frame = +slider.value;
    draw();
  };
  button.onclick = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = (frame + 1) % 13;
      draw();
      return;
    }
    setPlaying(!playing);
    cancelAnimationFrame(forecastAnimation);
    if (playing) {
      if (frame === 12) frame = 0;
      last = performance.now();
      forecastAnimation = requestAnimationFrame(tick);
    }
  };
  if (printSnapshot) frame = 12;
  draw();
}

function updateReport() {
  const host = $("#capstone-live-card");
  if (!host) return;
  const button = $("#capstone-export");
  if (button) button.disabled = !evaluation;
  if (!evaluation) return;
  const e = evaluation,
    reached = controlHistory.some((r) => r.error < 0.15),
    final = controlHistory.at(-1);
  host.innerHTML = `<strong>${printSnapshot ? "Recorded worked example" : "Live experiment"} · seed ${info?.seed ?? 17}</strong><dl><dt>Updates</dt><dd>${e.step}</dd><dt>Prediction / persistence</dt><dd>${(e.predictionLoss / Math.max(e.persistenceLoss, 1e-15)).toFixed(3)}</dd><dt>Embedding spread</dt><dd>${e.spread.toFixed(4)}</dd><dt>Future choices</dt><dd>${e.futureMatching.correct}/${e.futureMatching.total}</dd><dt>Executed actions</dt><dd>${controlHistory.length}</dd><dt>Goal reached at least once</dt><dd>${final ? (reached ? "Yes" : "No") : "Not evaluated"}</dd><dt>Final physical error</dt><dd>${final ? final.error.toFixed(3) + " rad" : "Not evaluated"}</dd></dl><p>These observations support claims about this run and this fixed evaluation only. Train, compare objectives, and retain the failed goals before drawing a broader conclusion.</p>`;
}
