import {
  register,
  row,
  panel,
  svg,
  text,
  dot,
  line,
  path,
  plot,
  scatter,
  range,
  choices,
  button,
  tex,
  f,
  number,
} from "./core.js";
import { cloud, ecf, ep, closedEP, rng, normal } from "../numerics.js";
import { cdf, ks, experiment } from "../normality.js";
const eq = (s) => `<div class="visual-equation">${tex(s, true)}</div>`;
const sample = [-1.3, -0.5, -0.5, 0.2, 0.8, 1.1];
function histogram(values, min, max, bins = 16) {
  const counts = Array(bins).fill(0);
  for (const x of values) {
    const j = Math.floor(((x - min) / (max - min)) * bins);
    if (j >= 0 && j < bins) counts[j]++;
  }
  const top = Math.max(1, ...counts);
  return svg(
    line(35, 230, 325, 230) +
      counts
        .map(
          (n, i) =>
            `<rect x="${35 + (i * 290) / bins}" y="${230 - (180 * n) / top}" width="${290 / bins - 2}" height="${(180 * n) / top}" fill="var(--violet)"/>`,
        )
        .join("") +
      text(35, 255, f(min)) +
      text(325, 255, f(max), "muted", "end") +
      text(35, 20, "Count; tallest bin = " + top),
    "Histogram with linear bins",
  );
}
function empirical(values) {
  const a = [...values].sort((a, b) => a - b),
    out = [[-3, 0]];
  a.forEach((x, i) => out.push([x, i / a.length], [x, (i + 1) / a.length]));
  out.push([3, 1]);
  return out;
}
register("T1", {
  title: "The empirical CDF jumps at observations",
  question: "Two observations are tied at −0.5. How large is the jump there?",
  controls: [range("n", "Observations included", 1, 6, 1, 6)],
  draw(s) {
    const a = sample.slice(0, s.n);
    return row(
      panel(
        "Accumulated fractions",
        plot({
          xmin: -3,
          xmax: 3,
          ymin: 0,
          ymax: 1,
          curves: [
            { fn: cdf, color: "blue" },
            { data: empirical(a), color: "teal" },
          ],
          xlabel: "threshold x",
          ylabel: "fraction ≤ x",
        }),
      ),
      panel(
        "Check both sides of every jump",
        eq(
          "D=\\max_i\\left\\{\\frac{i}{n}-\\Phi(x_{(i)}),\\Phi(x_{(i)})-\\frac{i-1}{n}\\right\\}",
        ) + number("KS discrepancy", f(ks(a), 4)),
        `Sorted observations: ${[...a].sort((a, b) => a - b).join(", ")}. Left and right limits matter; a line through point centers would miss the step structure.`,
      ),
    );
  },
  caption:
    "Blue is the fixed standard normal CDF; teal is the empirical CDF. Tied observations create a larger single jump, and the maximum formula still checks its outer limits.",
});
register("T2", {
  title: "Each sample contributes one statistic",
  question:
    "The null histogram contains discrepancies, not the original observations.",
  controls: [
    range("n", "Sample size", 8, 64, 8, 24),
    choices("mode", "Observed sample", ["normal", "shifted", "two-point"]),
  ],
  draw(s) {
    const r = experiment(s.n, s.mode);
    return row(
      panel(
        "One observed sample",
        histogram(r.observed, -4, 4),
        `This sample supplies D = ${f(r.d, 3)}.`,
      ),
      panel(
        "511 independent null samples",
        histogram(r.nulls, 0, 0.6),
        `Monte Carlo tail p = ${f(r.p, 4)}. Null 95th percentile ${f(r.threshold, 3)}. Each bar counts independent sample-level KS values.`,
      ),
    );
  },
  caption:
    "The finite Monte Carlo calculation includes the observed statistic through p = (1 + count at least as extreme)/512. This is a calibration under a specified null, not the probability that the null is true.",
});
register("T3", {
  title: "Fitting the reference changes the test",
  question:
    "The same sample can look closer to a Gaussian after using that sample to choose its mean and scale.",
  controls: [
    range("shift", "Sample shift", -1, 1, 0.05, 0.6),
    range("seed", "Sample seed", 1, 30, 1, 12),
  ],
  draw(s) {
    const r = rng(s.seed),
      a = Array.from({ length: 32 }, () => normal(r) + s.shift),
      mu = a.reduce((x, y) => x + y) / 32,
      sd = Math.sqrt(a.reduce((v, x) => v + (x - mu) ** 2, 0) / 32),
      b = a.map((x) => (x - mu) / sd);
    return row(
      panel(
        "Fixed N(0,1) reference",
        plot({
          xmin: -3,
          xmax: 3,
          ymin: 0,
          ymax: 1,
          curves: [
            { fn: cdf, color: "blue" },
            { data: empirical(a), color: "teal" },
          ],
        }),
        `D = ${f(ks(a), 3)}`,
      ),
      panel(
        "Fit mean and scale first",
        plot({
          xmin: -3,
          xmax: 3,
          ymin: 0,
          ymax: 1,
          curves: [
            { fn: cdf, color: "blue" },
            { data: empirical(b), color: "teal" },
          ],
        }),
        `Estimated μ = ${f(mu)}, σ = ${f(sd)}; standardized D = ${f(ks(b), 3)}.`,
      ),
    );
  },
  caption:
    "Fitting often reduces apparent discrepancy but need not reduce KS in every sample. A valid fitted-null calibration must repeat the same fitting step for every simulated null sample. The fixed-null KS threshold is not automatically valid.",
});
register("T4", {
  title: "Three questions, three experiments",
  question:
    "What changes when a discrepancy becomes a differentiable training penalty?",
  draw: () =>
    row(
      panel(
        "Testing",
        eq("P_{H_0}(\\text{reject})\\leq\\alpha"),
        "Hold the null and calibration fixed. Across repetitions, control the false-alarm rate.",
      ),
      panel(
        "Power",
        eq("P_{H_1}(\\text{reject})"),
        "Specify an alternative. Ask how often the chosen test detects it at this sample size.",
      ),
      panel(
        "Optimization",
        eq("\\theta\\leftarrow\\theta-\\eta\\nabla_\\theta R"),
        "Move the representation to reduce a penalty. A lower training value is not a hypothesis-test verdict.",
      ),
    ),
  caption:
    "Sample size, fitting choices and repeated testing affect statistical interpretation. A regularizer can be useful without returning a calibrated p-value.",
});
register("S1", {
  title: "Turn each sample into an arrow",
  question: "Shift the sample and watch the average leave the real axis.",
  controls: [
    range("omega", "Frequency ω", 0, 6, 0.05, 1.2),
    choices("sample", "Sample", ["Symmetric", "Asymmetric"]),
    range("selected", "Highlighted sample", 1, 4, 1, 1),
  ],
  draw(s) {
    const h =
        s.sample === "Symmetric" ? [-1, -0.5, 0.5, 1] : [-1.4, -0.2, 0.4, 1.8],
      r = ecf(h, s.omega);
    let g =
      `<circle cx="180" cy="140" r="100" fill="none" stroke="var(--line)"/>` +
      line(60, 140, 300, 140) +
      line(180, 20, 180, 260);
    h.forEach((x, i) => {
      let p = [
        180 + 100 * Math.cos(s.omega * x),
        140 - 100 * Math.sin(s.omega * x),
      ];
      g +=
        path(
          [[180, 140], p],
          i === s.selected - 1 ? "amber" : "violet",
          i === s.selected - 1 ? 3 : 1,
        ) + dot(...p, 3, i === s.selected - 1 ? "amber" : "violet");
    });
    g +=
      path(
        [
          [180, 140],
          [180 + 100 * r.c, 140 - 100 * r.s],
        ],
        "teal",
        4,
      ) + dot(180 + 100 * r.q, 140, 4, "blue");
    return row(
      panel(
        "Unit arrows and their average",
        svg(
          g,
          "Unit circle with sample phasors, empirical mean and Gaussian target",
        ),
      ),
      panel(
        "Selected contribution",
        eq(
          `h=${h[s.selected - 1]},\\quad\\omega h=${f(s.omega * h[s.selected - 1])}`,
        ) +
          eq(`\\widehat\\varphi=${f(r.c)}+i(${f(r.s)})`) +
          eq(`q(\\omega)=${f(r.q)}`),
        "Violet arrows all have length one. Teal is their average, which can be shorter. Blue is the standard Gaussian target on the real axis.",
      ),
    );
  },
  caption:
    "A characteristic function is a vector average on the complex unit circle. Symmetric samples cancel their imaginary contributions; the asymmetric example prevents that cancellation from being mistaken for a universal property.",
});
register("S2", {
  title: "Space and frequency tell different stories",
  question:
    "A shift moves the density but rotates its characteristic function. A scale change alters its decay.",
  controls: [
    range("mu", "Mean", -1.5, 1.5, 0.05, 0.6),
    range("sigma", "Standard deviation", 0.3, 1.8, 0.05, 1),
  ],
  draw(s) {
    const re = (w) =>
        Math.exp((-s.sigma * s.sigma * w * w) / 2) * Math.cos(s.mu * w),
      im = (w) =>
        Math.exp((-s.sigma * s.sigma * w * w) / 2) * Math.sin(s.mu * w);
    return row(
      panel(
        "Density space",
        plot({
          xmin: -4,
          xmax: 4,
          ymin: 0,
          ymax: 1.4,
          curves: [
            {
              fn: (x) =>
                Math.exp(-0.5 * ((x - s.mu) / s.sigma) ** 2) /
                (s.sigma * Math.sqrt(2 * Math.PI)),
              color: "violet",
            },
          ],
          xlabel: "sample value x",
          ylabel: "density",
        }),
      ),
      panel(
        "Frequency space",
        plot({
          xmin: -4,
          xmax: 4,
          ymin: -1,
          ymax: 1,
          curves: [
            { fn: re, color: "teal" },
            { fn: im, color: "amber" },
            { fn: (w) => Math.exp((-w * w) / 2), color: "blue" },
          ],
          xlabel: "frequency ω",
          ylabel: "CF component",
        }),
        "Teal real part, amber imaginary part, blue fixed standard-Gaussian target.",
      ),
    );
  },
  caption:
    "The exact Gaussian formula is exp(iμω − σ²ω²/2). The integration window used by SIGReg is a separate weighting choice; changing the data distribution does not change that chosen window.",
});
register("S3", {
  title: "A correct population still gives a noisy batch",
  question: "What happens to the discrepancy floor when batch size doubles?",
  controls: [
    range("exponent", "Batch size exponent", 3, 8, 1, 5),
    range("seed", "Repeat stream", 1, 20, 1, 3),
  ],
  draw(s) {
    const B = 2 ** s.exponent,
      r = rng(s.seed),
      vals = Array.from({ length: 80 }, () =>
        closedEP(Array.from({ length: B }, () => normal(r))),
      ),
      mean = vals.reduce((a, b) => a + b) / vals.length,
      expected = Math.sqrt(2 * Math.PI) * (1 - 1 / Math.sqrt(3));
    return row(
      panel(
        "Independent Gaussian batches",
        plot({
          xmin: 0,
          xmax: 80,
          ymin: 0,
          ymax: 5,
          points: vals.map((v, i) => [i, B * v, "violet"]),
          curves: [{ fn: () => expected, color: "blue" }],
          xlabel: "batch repeat",
          ylabel: "B × discrepancy",
        }),
      ),
      panel(
        "Scale separates two quantities",
        number("Batch size", B) +
          number("Mean unscaled discrepancy", f(mean, 4)) +
          number("Mean batch-scaled statistic", f(B * mean, 3)) +
          eq(
            `\\mathbb E[BD]=\\sqrt{2\\pi}(1-1/\\sqrt3)\\approx${f(expected, 3)}`,
          ),
        "The horizontal line is the full-line Gaussian-window expectation, not a zero-loss target.",
      ),
    );
  },
  caption:
    "These independent repeats use the closed-form full-line discrepancy. Multiplying by batch size compensates its 1/B expectation; it does not make individual batches nonrandom.",
});
register("S4", {
  title: "The axes can hide dependence",
  question:
    "Rotate from a coordinate axis to the diagonal. Half the diagonal projections collapse to a point.",
  controls: [range("angle", "Projection angle", 0, 1.57, 0.01, 0)],
  draw(s) {
    const pts = cloud("lines", 500, 41),
      u = [Math.cos(s.angle), Math.sin(s.angle)],
      h = pts.map((p) => p[0] * u[0] + p[1] * u[1]);
    return row(
      panel(
        "The joint distribution",
        scatter(pts, { angle: s.angle }),
        "Construction: (X, SX), with X standard Gaussian and S an independent fair sign.",
      ),
      panel(
        "One measured direction",
        histogram(h, -4, 4),
        `Angle ${f(s.angle)} radians. Along an axis the marginal is Gaussian. At π/4, the S = −1 half projects to zero.`,
      ),
      panel(
        "Its frequency fingerprint",
        plot({
          xmin: 0,
          xmax: 4,
          ymin: -0.2,
          ymax: 1,
          curves: [
            { fn: (w) => ecf(h, w).c, color: "teal" },
            { fn: (w) => Math.exp((-w * w) / 2), color: "blue" },
          ],
          xlabel: "ω",
          ylabel: "real CF",
        }),
      ),
    );
  },
  caption:
    "Matching every one-dimensional projection characterizes a multivariate Gaussian. Matching a finite sampled set is evidence with blind spots; this construction makes one blind spot explicit.",
});
register("S5", {
  title: "The window and the grid solve different problems",
  question:
    "Increase the cutoff, then increase the number of knots. Which error did each change reduce?",
  controls: [
    range("limit", "Positive cutoff A", 0.5, 6, 0.1, 3),
    range("knots", "Knots K", 3, 49, 2, 17),
  ],
  draw(s) {
    const h = [-1.6, -0.3, 0.2, 1.1],
      fn = (w) => {
        const a = ecf(h, w);
        return ((a.c - a.q) ** 2 + a.s * a.s) * a.q;
      },
      v = ep(h, { limit: s.limit, knots: s.knots, scaled: false }),
      dense = ep(h, { limit: s.limit, knots: 2001, scaled: false });
    return row(
      panel(
        "Weighted squared discrepancy",
        plot({
          xmin: 0,
          xmax: 6,
          ymin: 0,
          ymax: 0.12,
          curves: [
            { fn, color: "rose" },
            {
              data: Array.from({ length: s.knots }, (_, i) => {
                const w = (i * s.limit) / (s.knots - 1);
                return [w, fn(w)];
              }),
              color: "amber",
            },
          ],
          points: Array.from({ length: s.knots }, (_, i) => {
            const w = (i * s.limit) / (s.knots - 1);
            return [w, fn(w), "amber", 3];
          }),
          xlabel: "positive frequency",
          ylabel: "error × window",
        }),
      ),
      panel(
        "Separate the errors",
        number("Trapezoid estimate", f(v, 6)) +
          number("Dense integral on the same interval", f(dense, 6)) +
          number("Full-line closed form", f(closedEP(h), 6)),
        "The positive half is doubled. Endpoint weights are half interior weights before doubling. A denser grid cannot recover a discarded tail.",
      ),
    );
  },
  caption:
    "The shaded quantity is not the CF itself but squared complex discrepancy times the window. The exact same finite sum drives the displayed numerical estimate.",
});
register("S6", {
  title: "Expand the square into pairs",
  question:
    "How can a frequency integral be checked without using a frequency grid?",
  draw() {
    const h = [-1, 0.2, 1.3],
      table = h.map((a) => h.map((b) => Math.exp(-0.5 * (a - b) ** 2)));
    return row(
      panel(
        "Pair kernel values",
        `<table><thead><tr><th>hᵢ \ hⱼ</th>${h.map((x) => "<th>" + x + "</th>").join("")}</tr></thead><tbody>${table.map((r, i) => "<tr><th>" + h[i] + "</th>" + r.map((x) => "<td>" + f(x, 3) + "</td>").join("") + "</tr>").join("")}</tbody></table>`,
        "Each cell is exp(−(hᵢ − hⱼ)²/2). Diagonal pairs contribute one.",
      ),
      panel(
        "Three integrated terms",
        eq("D=\\frac{\\sqrt{2\\pi}}{B^2}\\sum_{i,j}e^{-(h_i-h_j)^2/2}") +
          eq("-\\frac{2\\sqrt\\pi}{B}\\sum_i e^{-h_i^2/4}+\\sqrt{2\\pi/3}") +
          number(
            "Closed form / dense quadrature",
            `${f(closedEP(h), 6)} / ${f(ep(h, { knots: 2001, limit: 9, scaled: false }), 6)}`,
          ),
      ),
    );
  },
  caption:
    "Expanding |empirical CF − target|² gives empirical–empirical pairs, empirical–target terms, and target–target terms. This independent formula checks the quadrature implementation.",
});
register("S7", {
  title: "A differentiable penalty can be stationary at collapse",
  question:
    "Start with all samples at zero, then introduce a tiny separation. Does the gradient behave as expected?",
  controls: [
    range("spread", "Symmetric separation", 0, 1, 0.005, 0),
    range("selected", "Sample", 1, 4, 1, 1),
  ],
  draw(s) {
    const h = [-1, -0.3, 0.3, 1].map((x) => x * s.spread),
      r = ep(h, { gradient: true }),
      i = s.selected - 1,
      eps = 1e-5,
      a = [...h],
      b = [...h];
    a[i] += eps;
    b[i] -= eps;
    const fd = (ep(a) - ep(b)) / (2 * eps);
    return row(
      panel(
        "Samples and return gradients",
        plot({
          xmin: -1.5,
          xmax: 1.5,
          ymin: -5,
          ymax: 5,
          points: h.map((x, j) => [
            x,
            r.gradient[j],
            j === i ? "amber" : "violet",
            5,
          ]),
          xlabel: "sample h",
          ylabel: "∂R / ∂h",
        }),
      ),
      panel(
        "Follow the selected sample",
        eq("A_{bk}=-(c_k-q_k)\\sin(\\omega_kh_b)") +
          eq("\\phantom{A_{bk}=}+s_k\\cos(\\omega_kh_b)") +
          eq(
            "\\frac{\\partial D}{\\partial h_b}=\\sum_k\\frac{2w_k\\omega_k}{B}A_{bk}",
          ) +
          number(
            "Analytic / finite difference",
            `${f(r.gradient[i], 5)} / ${f(fd, 5)}`,
          ),
        "This display multiplies D by B. For a vector embedding, multiply the scalar gradient by its projection direction and average directions.",
      ),
    );
  },
  caption:
    "At exact zero collapse, both sine terms and the empirical imaginary part vanish. A nonzero loss can coexist with zero gradient. A small asymmetric or symmetric separation exposes the local response.",
});
register("S8", {
  title: "The complete measurement, without hidden steps",
  question:
    "Can you name what is averaged at each stage before reading the compact formula?",
  draw: () =>
    row(
      panel(
        "Geometry → frequencies",
        eq("\\lat_b\\longrightarrow h_b=\\uvec^\\top\\lat_b") +
          eq("h_b\\longrightarrow e^{i\\freq h_b}") +
          eq("\\ecf(\\freq)=B^{-1}\\sum_b e^{i\\freq h_b}"),
      ),
      panel(
        "Frequencies → one penalty",
        eq(
          "\\disc=\\int|\\ecf(\\freq)-\\target(\\freq)|^2w(\\freq)\\,d\\freq",
        ) + eq("\\reg=\\frac{B}{M}\\sum_{m=1}^M\\disc_m"),
        "Average samples before squaring; integrate weighted frequency discrepancy; average projection directions.",
      ),
    ),
  caption:
    "The generated overview plate accompanies these exact, selectable equations. The direction count, batch factor, frequency window and numerical quadrature remain explicit in the implementation.",
});
