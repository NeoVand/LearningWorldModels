import { experiment } from "./normality.js";
// Deterministic mathematical desks. These do not train or simulate learned weights.
import { palette } from "./palette.js";
function desk(id, inputId, render) {
  const canvas = document.getElementById(id),
    input = document.getElementById(inputId);
  if (!canvas || !input) return;
  function draw() {
    const width = canvas.clientWidth || 600,
      height = Math.max(
        180,
        Math.min(
          id === "rollout-canvas" || id === "attention-canvas" ? 200 : 250,
          width * 0.4,
        ),
      ),
      dpr = devicePixelRatio || 1;
    canvas.style.height = height + "px";
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const c = canvas.getContext("2d");
    c.scale(dpr, dpr);
    c.font = '12px "DM Sans", sans-serif';
    render(c, width, height, Number(input.value));
  }
  addEventListener("book-theme-change", draw);
  input.addEventListener("input", draw);
  new ResizeObserver(draw).observe(canvas);
  document.fonts.ready.then(draw);
  draw();
}
function line(c, x, y, X, Y, color = palette.line, width = 1) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function point(c, x, y, color, r = 4) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
function label(c, t, x, y, color = palette.ink) {
  c.fillStyle = color;
  c.fillText(t, x, y);
}
desk("geometry-canvas", "geometry-angle", (c, w, h, degrees) => {
  const a = (degrees * Math.PI) / 180,
    cx = w / 2,
    cy = h / 2,
    s = Math.min(w / 9, h / 8);
  line(c, 20, cy, w - 20, cy);
  line(c, cx, 15, cx, h - 20);
  for (let i = 0; i < 144; i++) {
    const p = i * 2.399963229728653,
      r = Math.sqrt((i + 0.5) / 144) * 2,
      xx = Math.sqrt(3) * r * Math.cos(p),
      yy = r * Math.sin(p),
      x = (xx - yy) / Math.sqrt(2),
      y = (xx + yy) / Math.sqrt(2);
    point(c, cx + s * x, cy - s * y, palette.lat, 2.1);
  }
  line(
    c,
    cx - 3.6 * s * Math.cos(a),
    cy + 3.6 * s * Math.sin(a),
    cx + 3.6 * s * Math.cos(a),
    cy - 3.6 * s * Math.sin(a),
    palette.act,
    2,
  );
  const variance = 2 + Math.sin(2 * a);
  label(c, "unit direction u", 18, 24, palette.act);
  document.getElementById("geometry-readout").textContent =
    `At ${degrees}°, projected variance uᵀCu = ${variance.toFixed(3)}. The maximum is 3 at 45°; the minimum is 1 at 135°.`;
});
desk("ridge-canvas", "ridge-lambda", (c, w, h, lambda) => {
  const scale = Math.min((w - 90) / 1.6, (h - 60) / 1.6),
    x = 45,
    y = h - 35,
    weight = 1 / (1 + lambda);
  line(c, x, y, w - 20, y);
  line(c, x, y, x, 20);
  line(c, x, y, x + 1.4 * scale, y - 1.4 * scale * weight, palette.pred, 2);
  point(c, x + scale, y - scale, palette.obs, 5);
  line(
    c,
    x + scale,
    y - scale,
    x + scale,
    y - weight * scale,
    palette.loss,
    1.5,
  );
  label(c, "observed (1, 1)", x + scale + 8, y - scale, palette.obs);
  label(c, "x", w - 22, y + 22);
  label(c, "y", x - 17, 20);
  document.getElementById("ridge-readout").textContent =
    `w = 1/(1 + λ) = ${weight.toFixed(3)}. Data error = ${((weight - 1) ** 2).toFixed(3)}; weighted penalty = ${(lambda * weight ** 2).toFixed(3)}; total = ${((weight - 1) ** 2 + lambda * weight ** 2).toFixed(3)}.`;
});
desk("rollout-canvas", "rollout-lipschitz", (c, w, h, L) => {
  const n = 12,
    eps = 0.05,
    values = [0];
  for (let i = 0; i < n; i++) values.push(L * values.at(-1) + eps);
  // Keep one scale for every slider position. log1p leaves zero visible and
  // gives small and rapidly growing bounds room in the same plot.
  const left = 43,
    right = w - 19,
    top = 52,
    bottom = h - 33,
    maxBound = 20,
    X = (i) => left + (i / n) * (right - left),
    Y = (v) =>
      bottom -
      (Math.log1p(v / eps) / Math.log1p(maxBound / eps)) * (bottom - top);
  label(c, "ERROR BOUND · LOG SPACING", left, 17, palette.muted);
  line(c, left, 32, left + 18, 32, palette.loss, 2);
  label(c, `L = ${L.toFixed(2)}`, left + 24, 36, palette.loss);
  c.save();
  c.setLineDash([4, 4]);
  line(c, left + 103, 32, left + 121, 32, palette.obs, 1.5);
  c.restore();
  label(c, "L = 1 reference", left + 127, 36, palette.obs);
  for (const tick of [0, 0.1, 0.5, 2, 10, 20]) {
    const y = Y(tick);
    line(c, left, y, right, y, palette.line, tick === 0 ? 1.2 : 0.7);
    c.textAlign = "right";
    label(c, String(tick), left - 7, y + 4, palette.muted);
  }
  c.textAlign = "center";
  for (const tick of [0, 3, 6, 9, 12]) {
    label(c, String(tick), X(tick), bottom + 16, palette.muted);
  }
  c.textAlign = "left";
  c.textAlign = "right";
  label(c, "step", right, h - 5, palette.muted);
  c.textAlign = "left";
  for (let i = 1; i <= n; i++)
    line(c, X(i - 1), Y(values[i - 1]), X(i), Y(values[i]), palette.loss, 2.5);
  c.save();
  c.setLineDash([4, 4]);
  for (let i = 1; i <= n; i++)
    line(c, X(i - 1), Y((i - 1) * eps), X(i), Y(i * eps), palette.obs, 1.5);
  c.restore();
  point(c, X(n), Y(values[n]), palette.loss, 4);
  c.canvas.setAttribute(
    "aria-label",
    `Worst-case rollout bound through twelve steps for L ${L.toFixed(2)}. Fixed log-spaced error axis from zero to twenty; dashed reference L equals one. Final bound ${values[n].toFixed(3)}.`,
  );
  document.getElementById("rollout-readout").textContent =
    `At step 12: ${values[n].toFixed(3)} versus 0.600 when L = 1 (${(values[n] / (n * eps)).toFixed(1)}×). The one-step error allowance is ε = 0.05; prior error is multiplied by L. These are bounds, not measured errors.`;
});
desk("attention-canvas", "attention-temperature", (c, w, h, tau) => {
  const scores = [1, 2, 0.5],
    raw = scores.map((s) => Math.exp((s - 2) / tau)),
    den = raw.reduce((a, b) => a + b, 0),
    weights = raw.map((v) => v / den),
    vals = [0, 10, 4],
    mean = weights.reduce((a, v, i) => a + v * vals[i], 0),
    left = 25,
    right = w - 20,
    step = (right - left) / 3,
    top = 58,
    bottom = h - 43,
    barHeight = bottom - top;
  label(c, `τ = ${tau.toFixed(2)}`, left, 19, palette.muted);
  c.textAlign = "right";
  label(c, `OUTPUT  ${mean.toFixed(3)}`, right, 19, palette.pred);
  c.textAlign = "left";
  line(c, left, bottom, right, bottom, palette.line);
  weights.forEach((v, i) => {
    const x = left + i * step,
      center = x + step / 2,
      width = Math.min(48, step * 0.48),
      height = v * barHeight;
    c.fillStyle = palette.pred;
    c.fillRect(center - width / 2, bottom - height, width, height);
    c.textAlign = "center";
    label(
      c,
      v.toFixed(3),
      center,
      Math.max(49, bottom - height - 8),
      palette.pred,
    );
    label(c, `token ${i + 1}`, center, bottom + 15);
    label(
      c,
      `s=${scores[i]}  v=${vals[i]}`,
      center,
      bottom + 29,
      palette.muted,
    );
  });
  c.textAlign = "left";
  c.canvas.setAttribute(
    "aria-label",
    `Attention weights ${weights.map((v) => v.toFixed(3)).join(", ")} at temperature ${tau.toFixed(2)}, from scores 1, 2, 0.5 and scalar values 0, 10, 4. Weighted output ${mean.toFixed(3)}.`,
  );
  document.getElementById("attention-readout").textContent =
    `The unrounded weights sum to 1. With values 0, 10, and 4, the weighted sum is ${weights[0].toFixed(3)}×0 + ${weights[1].toFixed(3)}×10 + ${weights[2].toFixed(3)}×4 ≈ ${mean.toFixed(3)} (shown weights are rounded).`;
});

let normalityMode = "normal";
desk("normality-canvas", "normality-size", (c, w, h, exponent) => {
  const r = experiment(2 ** exponent, normalityMode),
    left = 38,
    bottom = h - 43,
    right = w - 20,
    top = 61;
  const max = Math.max(r.nulls.at(-1) * 1.1, 0.2),
    bins = 28,
    counts = Array(bins).fill(0);
  c.canvas.dataset.xMax = max.toFixed(5);
  c.canvas.dataset.observedOffscale = String(r.d > max);
  r.nulls.forEach(
    (v) => counts[Math.min(bins - 1, Math.floor((v / max) * bins))]++,
  );
  const peak = Math.max(...counts),
    dx = (right - left) / bins;
  counts.forEach((n, i) => {
    const height = (n / peak) * (bottom - top);
    c.fillStyle = palette.lat + "65";
    c.fillRect(left + i * dx + 1, bottom - height, Math.max(1, dx - 2), height);
  });
  line(c, left, bottom, right, bottom);
  const x = (v) => left + (v / max) * (right - left);
  line(c, x(r.threshold), top, x(r.threshold), bottom, palette.act, 1.5);
  const observedX = Math.min(x(r.d), right - 2);
  line(c, observedX, top, observedX, bottom, palette.loss, 2);
  if (r.d > max) {
    c.fillStyle = palette.loss;
    c.beginPath();
    c.moveTo(right - 1, top + 2);
    c.lineTo(right - 9, top - 3);
    c.lineTo(right - 9, top + 7);
    c.closePath();
    c.fill();
  }
  label(c, `Observed D = ${r.d.toFixed(3)}`, left, 20, palette.loss);
  label(
    c,
    `95% null cutoff ≈ ${r.threshold.toFixed(3)}`,
    left,
    41,
    palette.act,
  );
  label(c, "0", left, bottom + 18);
  label(c, max.toFixed(2), right - 25, bottom + 18);
  label(c, "KS discrepancy D", left, h - 3);
  document.getElementById("normality-readout").textContent =
    `n = ${r.n}; observed D = ${r.d.toFixed(4)}; Monte Carlo p = ${r.p.toFixed(4)}. ${r.p <= 0.05 ? "Reject the specified null at 5%." : "Do not reject the specified null at 5%."} This is not a probability that the null is true. For a mean shift of 0.4, ${r.detected}/128 fresh trials reject (estimated power ${(r.power * 100).toFixed(1)}%).`;
});
document.querySelectorAll("[data-normality]").forEach((b) =>
  b.addEventListener("click", () => {
    normalityMode = b.dataset.normality;
    document
      .querySelectorAll("[data-normality]")
      .forEach((e) => e.setAttribute("aria-pressed", String(e === b)));
    document
      .getElementById("normality-size")
      .dispatchEvent(new Event("input", { bubbles: true }));
  }),
);
