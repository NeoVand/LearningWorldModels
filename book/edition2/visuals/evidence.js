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
  tex,
  f,
  number,
  results,
  takeaway,
} from "./core.js";
import { cloud, sigreg, rng, normal } from "../numerics.js";
const eq = (s) => `<div class="visual-equation">${tex(s, true)}</div>`;
const cards = (items) =>
  '<div class="visual-steps">' +
  items
    .map(([a, b]) => `<div class="visual-card"><strong>${a}</strong>${b}</div>`)
    .join("") +
  "</div>";
register("E1", {
  title: "A probe measures accessibility to a chosen decoder",
  question:
    "The cubic encoding keeps all information about x. Can a linear probe recover x exactly?",
  controls: [choices("encoding", "Encoding", ["Linear", "Cubic"])],
  draw(s) {
    const train = Array.from({ length: 21 }, (_, i) => -1 + i * 0.1),
      enc = (x) => (s.encoding === "Linear" ? x : x ** 3),
      beta =
        train.reduce((a, x) => a + enc(x) * x, 0) /
        train.reduce((a, x) => a + enc(x) ** 2, 0),
      test = Array.from({ length: 20 }, (_, i) => -0.95 + i * 0.1),
      mse = test.reduce((a, x) => a + (beta * enc(x) - x) ** 2, 0) / 20;
    return row(
      panel(
        "Physical value and probe prediction",
        plot({
          xmin: -1,
          xmax: 1,
          ymin: -1.4,
          ymax: 1.4,
          curves: [
            { fn: (x) => x, color: "blue" },
            { fn: (x) => beta * enc(x), color: "amber" },
            {
              fn: (x) => (s.encoding === "Cubic" ? Math.cbrt(enc(x)) : enc(x)),
              color: "teal",
            },
          ],
          xlabel: "physical x",
          ylabel: "decoded x",
        }),
      ),
      panel(
        "Fit on one set, test on another",
        number("Linear probe held-out MSE", f(mse, 5)) +
          number("Chosen inverse decoder MSE", "0.00000"),
        "The amber slope is fitted by least squares on 21 training points. Twenty interleaved points are held out. The teal inverse is analytically chosen, so it is an information-preservation witness, not a learned-probe result.",
      ),
    );
  },
  caption:
    "A poor linear probe need not mean the information was erased. Conversely, an expressive successful probe does not show that a planner or a simple linear decoder can readily use it.",
});
register("E2", {
  title: "Rotation renames coordinates",
  question:
    "Rotate the cloud and both endpoints of a distance. Which quantities remain unchanged?",
  controls: [range("angle", "Rotation", 0, 6.28, 0.02, 0.8)],
  draw(s) {
    const a = s.angle,
      c = Math.cos(a),
      t = Math.sin(a),
      pts = cloud("lines", 128, 7),
      rot = (p) => [c * p[0] - t * p[1], t * p[0] + c * p[1]],
      v = sigreg(pts, { m: 8 }),
      v2 = sigreg(pts.map(rot), { m: 8 });
    return row(
      panel("Original coordinates", scatter(pts)),
      panel("Rotated coordinates", scatter(pts.map(rot))),
      panel(
        "Invariant distance; sampled score",
        eq("\\|Qx-Qy\\|^2=\\|x-y\\|^2") +
          number("Fixed eight-direction SIGReg", `${f(v, 3)} → ${f(v2, 3)}`),
        "For exact equality of this finite score, rotate the directions too. Fresh isotropic directions give rotational symmetry in expectation.",
      ),
    );
  },
  caption:
    "The predictor must be transformed consistently with the encoder. Coordinate freedom does not make every finite sampled statistic identical under a fixed unrotated direction set.",
});
register("E3", {
  title: "An angle lives on a circle",
  question:
    "Move across the −π/π seam. The mechanism barely moves, even though the written number jumps.",
  controls: [
    range("q", "True angle", -3.14, 3.14, 0.01, 3.05),
    range("pred", "Predicted angle", -3.14, 3.14, 0.01, -3.05),
  ],
  draw(s) {
    const wrap = (x) =>
        ((((x + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) -
        Math.PI,
      d = wrap(s.q - s.pred);
    return row(
      panel(
        "One turn identifies its endpoints",
        svg(
          `<circle cx="180" cy="140" r="105" fill="none" stroke="var(--line)"/>` +
            dot(
              180 + 105 * Math.cos(s.q),
              140 - 105 * Math.sin(s.q),
              7,
              "blue",
            ) +
            dot(
              180 + 105 * Math.cos(s.pred),
              140 - 105 * Math.sin(s.pred),
              5,
              "teal",
            ) +
            path(
              Array.from({ length: 61 }, (_, i) => {
                let a = s.pred + (i * d) / 60;
                return [180 + 95 * Math.cos(a), 140 - 95 * Math.sin(a)];
              }),
              "amber",
              3,
            ),
          "Circle with true and predicted angles and the shortest arc",
        ),
      ),
      panel(
        "Two different differences",
        number("Naive difference", f(s.q - s.pred) + " rad") +
          number("Wrapped difference", f(d) + " rad") +
          eq("\\operatorname{wrap}(\\delta)=((\\delta+\\pi)\\bmod2\\pi)-\\pi"),
        "The blue and teal markers are positions on the same circle. Amber traces the shorter angular displacement.",
      ),
    );
  },
  caption:
    "Circular error must wrap each joint difference before squaring and averaging. A plain subtraction near the seam produces a physically misleading error.",
});
function probabilities(pts, kernel) {
  const a = pts.map((p, i) =>
    pts.map((q, j) =>
      i === j ? 0 : kernel(p.reduce((s, x, k) => s + (x - q[k]) ** 2, 0)),
    ),
  );
  let sum = a.flat().reduce((a, b) => a + b);
  return a.map((r) => r.map((x) => x / sum));
}
register("E4", {
  title: "Neighbor probabilities are not ruler distances",
  question:
    "Move the two groups farther apart. Which within-group relationships stay intact?",
  controls: [range("gap", "Display gap", 1, 5, 0.1, 3)],
  draw(s) {
    const input = [
        [-2, -0.1],
        [-2, 0.1],
        [-1.8, 0],
        [2, -0.1],
        [2, 0.1],
        [1.8, 0],
      ],
      layout = input.map((p, i) => [
        (i < 3 ? -1 : 1) * s.gap + (i % 3) * 0.15,
        p[1] * 3,
      ]),
      P = probabilities(input, (d) => Math.exp(-d / 0.15)),
      Q = probabilities(layout, (d) => 1 / (1 + d)),
      kl = P.flat().reduce(
        (a, p, i) => a + (p ? p * Math.log(p / Q.flat()[i]) : 0),
        0,
      );
    return row(
      panel(
        "An illustrative display",
        plot({
          xmin: -6,
          xmax: 6,
          ymin: -1,
          ymax: 1,
          points: layout.map((p, i) => [...p, i < 3 ? "blue" : "violet", 6]),
        }),
        "Six points with two close neighborhoods. The displayed gap is a control, not a physical measurement.",
      ),
      panel(
        "Compute the probability comparison",
        number("KL(P || Q)", f(kl, 4)) +
          `<table><tbody>${P.map((r) => "<tr>" + r.map((v) => "<td>" + f(v, 2) + "</td>").join("") + "</tr>").join("")}</tbody></table>`,
        "P is a normalized symmetric Gaussian-affinity matrix in this illustration. Q uses inverse quadratic distances in the display; zero diagonal terms are excluded.",
      ),
    );
  },
  caption:
    "This demonstrates the neighborhood objective, not a complete t-SNE optimizer or its adaptive perplexity procedure. Local affinities constrain the layout; rotations and visually large gaps are not calibrated physical distances.",
});
register("E5", {
  title: "Turn compatibility into a probability only after normalization",
  question:
    "Lower the temperature. What changes: the energy landscape, or the probability assigned to its valleys?",
  controls: [range("temperature", "Temperature τ", 0.15, 2, 0.05, 0.7)],
  draw(s) {
    const E = (x) => (x * x - 1) ** 2,
      dx = 6 / 1200,
      Z = Array.from({ length: 1201 }, (_, i) => {
        let x = -3 + i * dx;
        return (
          Math.exp(-E(x) / s.temperature) *
          dx *
          (i === 0 || i === 1200 ? 0.5 : 1)
        );
      }).reduce((a, b) => a + b),
      p = (x) => Math.exp(-E(x) / s.temperature) / Z;
    return row(
      panel(
        "Two compatible regions",
        plot({
          xmin: -2,
          xmax: 2,
          ymin: 0,
          ymax: 5,
          curves: [{ fn: E, color: "rose" }],
          ylabel: "energy",
        }),
      ),
      panel(
        "Normalized density",
        plot({
          xmin: -2,
          xmax: 2,
          ymin: 0,
          ymax: 2,
          curves: [{ fn: p, color: "teal" }],
          ylabel: "probability density",
        }),
        `Numerically integrated normalizer ${f(Z, 4)} on [−3, 3]; tails here are negligible.`,
      ),
    );
  },
  caption:
    "The explicit energy E(x) = (x² − 1)² has two minima. It is an illustrative compatibility function, not an energy learned by LeWorldModel. A probability interpretation additionally needs a reference measure, temperature, and finite normalizer.",
});
register("E6", {
  title: "Change appearance or break continuity?",
  question:
    "A larger prediction error needs an explanation. What alternative explanations would this intervention leave open?",
  controls: [
    choices("event", "Intervention", [
      "Normal",
      "Color change",
      "Occlusion",
      "Teleport",
    ]),
  ],
  draw(s) {
    const actual = Array.from({ length: 12 }, (_, i) => [
        i,
        0.15 * i + (s.event === "Teleport" && i >= 6 ? 1 : 0),
      ]),
      observed = actual.map(([i, x]) =>
        s.event === "Occlusion" && i >= 6 && i < 9 ? [i, NaN] : [i, x],
      ),
      errors = actual.map(([i, x]) => [
        i,
        s.event === "Occlusion" && i >= 6 && i < 9
          ? NaN
          : i === 0
            ? 0
            : (x - (actual[i - 1][1] + 0.15)) ** 2 +
              (s.event === "Color change" && i === 6 ? 0.12 : 0),
      ]);
    return row(
      panel(
        "Controlled conceptual sequence",
        plot({
          xmin: 0,
          xmax: 11,
          ymin: 0,
          ymax: 3,
          curves: [{ data: observed, color: "blue" }],
          xlabel: "frame",
          ylabel: "position",
        }),
        s.event === "Occlusion"
          ? "Frames 6–8 are hidden; no observation is available there."
          : "Intervention begins at frame 6.",
      ),
      panel(
        "Explicit illustrative predictor",
        plot({
          xmin: 0,
          xmax: 11,
          ymin: 0,
          ymax: 1.2,
          curves: [{ data: errors, color: "rose" }],
          xlabel: "frame",
          ylabel: "illustrative discrepancy",
        }),
        "Rule: predict a +0.15 position step. Color adds a stipulated nuisance penalty of 0.12; this is not a measured neural-model response.",
      ),
    );
  },
  caption:
    "This conceptual control design shows what to compare, not a reported experiment. For an empirical claim, run matched interventions through the frozen model and measure its actual errors, including occlusion handling.",
});
register("E7", {
  title: "Geometry, asymmetric loss, and experimental controls",
  question:
    "Each diagnostic has a different target. Do not collapse them into one quality score.",
  controls: [
    range("angle", "Turn angle", 0, 3.14, 0.02, 1.57),
    range("tau", "Expectile asymmetry", 0.1, 0.9, 0.05, 0.7),
  ],
  draw(s) {
    const y = [-1, 0, 2],
      L = (m) =>
        y.reduce((a, v) => a + (v >= m ? s.tau : 1 - s.tau) * (v - m) ** 2, 0) /
        3;
    let best = -1;
    for (let x = -1; x <= 2; x += 0.002) if (L(x) < L(best)) best = x;
    return row(
      panel(
        "Temporal straightness",
        svg(
          path(
            [
              [65, 210],
              [180, 210],
              [180 + 100 * Math.cos(s.angle), 210 - 100 * Math.sin(s.angle)],
            ],
            "violet",
            3,
          ) + dot(180, 210, 4, "amber"),
          "Two displacement vectors with adjustable turn angle",
        ),
        `Cosine = ${f(Math.cos(s.angle))}. Zero motion would leave the angle undefined.`,
      ),
      panel(
        "Expectile",
        plot({
          xmin: -1,
          xmax: 2,
          ymin: 0,
          ymax: 4,
          curves: [{ fn: L, color: "rose" }],
          points: [[best, L(best), "teal", 5]],
          xlabel: "prediction",
          ylabel: "asymmetric squared loss",
        }),
        `For outcomes −1, 0, 2, minimizing location ≈ ${f(best)}.`,
      ),
      panel(
        "Ablation design",
        '<div class="visual-card">Use matched data, seed, budget and evaluation. Change the specified component. Keep all seeds and failures visible.</div>',
        "A difference can support a conclusion only under the comparison actually run.",
      ),
    );
  },
  caption:
    "Straightness is about angles in representation space. Expectiles minimize an asymmetric squared loss. Ablations compare interventions on a learning procedure; these are distinct kinds of evidence.",
});
register("R1", {
  title: "Small input spread makes a slope noisy",
  question:
    "Fit the same line repeatedly with fresh label noise. What happens when the design points move closer to zero?",
  controls: [
    range("spread", "Input magnitude a", 0.1, 1, 0.05, 1),
    range("seed", "Noise stream", 1, 20, 1, 4),
  ],
  draw(s) {
    const random = rng(s.seed),
      a = s.spread,
      beta = 2,
      noise = Array.from(
        { length: 100 },
        () => (normal(random) - normal(random)) / 2,
      ),
      reference = noise.map((n) => beta + n),
      estimates = noise.map((n) => beta + n / a),
      extent = Math.max(1, ...estimates.map((v) => Math.abs(v - beta))) * 1.12;
    const estimatesPlot = (values, color) =>
      plot({
        xmin: 0,
        xmax: 100,
        ymin: beta - extent,
        ymax: beta + extent,
        height: 230,
        ticks: 2,
        points: values.map((v, i) => [i + 1, v, color, 2.5]),
        curves: [{ fn: () => beta, color: "blue" }],
        xlabel: "independent noise draw",
        ylabel: "estimated slope",
      });
    return (
      row(
        panel(
          "Reference · input magnitude 1",
          estimatesPlot(reference, "teal"),
        ),
        panel(
          `Your design · input magnitude ${f(a)}`,
          estimatesPlot(estimates, "violet"),
        ),
      ) +
      results(
        ["Reference variance", "0.50"],
        ["Your slope variance", f(1 / (2 * a * a))],
        ["Noise amplification", `${f(1 / a)}×`],
      ) +
      eq("x=(-a,a),\\quad y_i=\\beta x_i+\\epsilon_i") +
      eq("\\operatorname{Var}(\\hat\\beta)=\\frac{1}{2a^2}") +
      takeaway(
        "Both plots share a vertical scale and the same noise draws. Halving the input magnitude doubles the slope’s standard deviation and quadruples its variance.",
      )
    );
  },
  caption:
    "The vertical range adjusts to keep every estimate visible. The true slope stays two and label-noise variance stays one; only the input spacing changes. These are least-squares fits for a two-point fixed design.",
});
register("R2", {
  title: "A covariance preference needs a task assumption",
  question:
    "Keep total variance fixed but assign less to one axis. What happens to estimates in that direction?",
  controls: [
    range("variance", "First-axis variance", 0.1, 1.9, 0.05, 1),
    range("ridge", "Ridge λ", 0, 2, 0.05, 0.2),
  ],
  draw(s) {
    let a = s.variance,
      b = 2 - a;
    return row(
      panel(
        "Fixed trace, unequal directions",
        svg(
          `<ellipse cx="180" cy="140" rx="${80 * Math.sqrt(a)}" ry="${80 * Math.sqrt(b)}" fill="none" stroke="var(--violet)"/>` +
            line(40, 140, 320, 140) +
            line(180, 10, 180, 270),
          "Covariance ellipse with trace two",
        ),
      ),
      panel(
        "Directional effects",
        eq(`\\lambda_1=${f(a)},\\quad\\lambda_2=${f(b)}`) +
          number("OLS variance factors", `${f(1 / a)}, ${f(1 / b)}`) +
          number(
            "Ridge retained coefficient fractions",
            `${f(a / (a + s.ridge))}, ${f(b / (b + s.ridge))}`,
          ),
        "Uniformity helps a symmetric aggregate criterion. A task known to use only the first axis can prefer allocating more variance to that axis.",
      ),
    );
  },
  caption:
    "The fixed-trace assumption is doing real work. Isotropy does not prove universal optimality for every privileged target direction or decoder family.",
});
register("R3", {
  title: "A local prediction is a weighted average",
  question:
    "Move the query between observations and shrink the neighborhood until no point receives weight.",
  controls: [
    range("query", "Query", -2, 2, 0.05, 0),
    range("bandwidth", "Bandwidth h", 0.1, 3, 0.05, 2),
  ],
  draw(s) {
    const x = [-1, 0, 1],
      y = [0, 2, 10],
      w = x.map((v) => Math.max(1 - Math.abs((s.query - v) / s.bandwidth), 0)),
      total = w.reduce((a, b) => a + b),
      out = total ? w.reduce((a, v, i) => a + v * y[i], 0) / total : null;
    return row(
      panel(
        "Kernel weights",
        plot({
          xmin: -2,
          xmax: 2,
          ymin: 0,
          ymax: 1.1,
          curves: [
            {
              fn: (x) => Math.max(1 - Math.abs((s.query - x) / s.bandwidth), 0),
              color: "violet",
            },
          ],
          points: x.map((v, i) => [v, w[i], "amber", 5]),
          xlabel: "stored location",
          ylabel: "unnormalized weight",
        }),
      ),
      panel(
        "Normalize before averaging",
        `<table><thead><tr><th>Label</th><th>Weight</th><th>Normalized</th></tr></thead><tbody>${y.map((v, i) => `<tr><td>${v}</td><td>${f(w[i])}</td><td>${total ? f(w[i] / total) : "undefined"}</td></tr>`).join("")}</tbody></table>` +
          number(
            "Prediction",
            out === null ? "No supported neighbor" : f(out, 3),
          ),
        "The denominator can be zero. Reporting a made-up average in that case would hide a lack of local support.",
      ),
    );
  },
  caption:
    "At query zero and bandwidth two, weights are 1/2, 1, 1/2, yielding 3.5. The common bandwidth normalization factor cancels in the ratio.",
});
register("R4", {
  title: "Symmetry cancels only with balanced density",
  question:
    "A symmetric kernel can still average asymmetrically when more data lie on one side.",
  controls: [
    range("slope", "Density slope k", -0.8, 0.8, 0.05, 0.5),
    range("bandwidth", "Half-width h", 0.1, 1, 0.05, 0.6),
  ],
  draw(s) {
    const h = s.bandwidth,
      k = s.slope;
    const pts = Array.from({ length: 101 }, (_, i) => {
      let x = -h + (2 * h * i) / 100;
      return [x, (1 + k * x) * (1 - Math.abs(x / h))];
    });
    const sum = pts.reduce((a, p) => a + p[1], 0),
      mean = pts.reduce((a, p) => a + p[0] * p[1], 0) / sum;
    return row(
      panel(
        "Kernel × local density",
        plot({
          xmin: -1,
          xmax: 1,
          ymin: 0,
          ymax: 1.4,
          curves: [{ data: pts, color: "violet" }],
          ylabel: "unnormalized local weight",
        }),
      ),
      panel(
        "A first-order label function",
        eq("m(x)=x,\\quad p(x)\\propto1+kx") +
          number("Smoothed value at query zero", f(mean, 5)) +
          eq("\\nabla\\log p(0)=k"),
        "With k = 0, positive and negative first-order terms cancel. With k ≠ 0, the denser side pulls the average. Curvature supplies an additional second-order term for a curved m.",
      ),
    );
  },
  caption:
    "This local positive-density example isolates the density-score contribution. The Taylor derivation needs smoothness, small bandwidth, and boundary conditions; the illustration does not remove those assumptions.",
});
register("R5", {
  title: "Density, log density, and score are different functions",
  question: "Narrow the Gaussian. Why does the average squared score increase?",
  controls: [range("sigma", "Gaussian scale σ", 0.3, 2, 0.05, 1)],
  draw(s) {
    const v = s.sigma * s.sigma;
    return row(
      panel(
        "Density",
        plot({
          xmin: -3,
          xmax: 3,
          ymin: 0,
          ymax: 1.5,
          curves: [
            {
              fn: (x) =>
                Math.exp((-x * x) / (2 * v)) / Math.sqrt(2 * Math.PI * v),
              color: "blue",
            },
          ],
          ylabel: "p(x)",
        }),
      ),
      panel(
        "Log density",
        plot({
          xmin: -3,
          xmax: 3,
          ymin: -15,
          ymax: 1,
          curves: [
            {
              fn: (x) => -0.5 * Math.log(2 * Math.PI * v) - (x * x) / (2 * v),
              color: "violet",
            },
          ],
          ylabel: "log p(x)",
        }),
      ),
      panel(
        "Density score",
        plot({
          xmin: -3,
          xmax: 3,
          ymin: -12,
          ymax: 12,
          curves: [{ fn: (x) => -x / v, color: "teal" }],
          ylabel: "d log p / dx",
        }),
        `Average squared score = 1/σ² = ${f(1 / v)}.`,
      ),
    );
  },
  caption:
    "The score differentiates with respect to the sample coordinate. It is not an attention weight or a classification confidence. Comparing Fisher information without fixing covariance changes the optimization question.",
});
register("R6", {
  title: "Follow the assumptions all the way to the claim",
  question:
    "Which arrow would be unjustified if we concluded that every downstream task is optimal?",
  draw: () =>
    cards([
      [
        "Regularity assumptions",
        "Smooth positive density; controlled boundary terms; finite quantities.",
      ],
      [
        "Covariance constraint",
        "Fix the covariance when comparing density-score magnitude.",
      ],
      [
        "Fisher inequality",
        "Under those assumptions, the Gaussian achieves the score-information lower bound.",
      ],
      [
        "Probe-bias bound",
        "Insert the bound into the stated local-probe approximation. This controls one term, under its own smoothness assumptions.",
      ],
      [
        "No universal-task arrow",
        "Gaussian geometry alone does not identify useful information.",
      ],
      [
        "Counterexample",
        "An encoder can output a Gaussian nuisance variable independent of the physical target. Perfect marginal geometry then coexists with no target information.",
      ],
    ]),
  caption:
    "A bound on a term in a risk expansion is not a proof that every learning task or planner is optimal. The dependency chain keeps the mathematical result separate from a broader research motivation.",
});
