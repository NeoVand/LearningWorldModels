import {
  register,
  row,
  panel,
  svg,
  text,
  dot,
  line,
  path,
  formula,
  plot,
  scatter,
  range,
  choices,
  button,
  tex,
  f,
  number,
} from "./core.js";
import { cloud, rng, normal } from "../numerics.js";
const eq = (s) => `<div class="visual-equation">${tex(s, true)}</div>`;
const cards = (items) =>
  '<div class="visual-steps">' +
  items
    .map(([a, b]) => `<div class="visual-card"><strong>${a}</strong>${b}</div>`)
    .join("") +
  "</div>";
function initFit(s) {
  if (s.fit) return;
  const r = rng(42);
  s.fit = {
    steps: 0,
    a: 0,
    b: 0,
    w: Array.from({ length: 8 }, () => normal(r) * 0.7),
    c: Array.from({ length: 8 }, () => normal(r) * 0.4),
    v: Array.from({ length: 8 }, () => normal(r) * 0.2),
  };
}
function fitStep(s, n) {
  initFit(s);
  const m = s.fit;
  for (let k = 0; k < n; k++) {
    const g = {
      a: 0,
      b: 0,
      w: Array(8).fill(0),
      c: Array(8).fill(0),
      v: Array(8).fill(0),
    };
    for (let i = 0; i < 41; i++) {
      const x = -2 + i * 0.1,
        y = Math.sin(2 * x),
        h = m.w.map((w, j) => Math.tanh(w * x + m.c[j])),
        pred = h.reduce((a, v, j) => a + m.v[j] * v, 0),
        error = (2 * (pred - y)) / 41,
        lin = (2 * (m.a * x + m.b - y)) / 41;
      g.a += lin * x;
      g.b += lin;
      for (let j = 0; j < 8; j++) {
        g.v[j] += error * h[j];
        g.w[j] += error * m.v[j] * (1 - h[j] * h[j]) * x;
        g.c[j] += error * m.v[j] * (1 - h[j] * h[j]);
      }
    }
    m.a -= 0.03 * g.a;
    m.b -= 0.03 * g.b;
    for (let j = 0; j < 8; j++) {
      m.w[j] -= 0.03 * g.w[j];
      m.c[j] -= 0.03 * g.c[j];
      m.v[j] -= 0.03 * g.v[j];
    }
    m.steps++;
  }
}
register("N3", {
  title: "Let eight curved units fit a curved target",
  question:
    "Both models see the same 41 points. Can a stack of affine maps reproduce these bends?",
  controls: [
    button("train", "Train 200 updates"),
    button("reset-fit", "Reset weights"),
  ],
  action(s, a) {
    if (a === "reset-fit") delete s.fit;
    else if (a === "train") fitStep(s, 200);
  },
  draw(s) {
    initFit(s);
    const m = s.fit;
    return row(
      panel(
        "Random weights are visible from the start",
        plot({
          xmin: -2,
          xmax: 2,
          ymin: -1.5,
          ymax: 1.5,
          curves: [
            { fn: (x) => Math.sin(2 * x), color: "blue" },
            { fn: (x) => m.a * x + m.b, color: "amber" },
            {
              fn: (x) =>
                m.w.reduce(
                  (a, w, j) => a + m.v[j] * Math.tanh(w * x + m.c[j]),
                  0,
                ),
              color: "teal",
            },
          ],
          ylabel: "prediction",
        }),
        `${m.steps} real gradient updates. Blue target; amber affine baseline; teal eight-neuron tanh model.`,
      ),
      panel(
        "Why depth alone does not suffice",
        eq("A_2(A_1x+b_1)+b_2=(A_2A_1)x+(A_2b_1+b_2)") +
          eq("\\hat y=\\sum_{j=1}^{8}v_j\\tanh(w_jx+b_j)"),
        "Nonlinear units create bends that a single affine rule cannot express. This small full-batch demo uses explicit chain-rule derivatives and a fixed learning rate.",
      ),
    );
  },
  caption:
    "The target, seed, samples and training rate are fixed. Each click continues the same weights; reset returns to the original random initialization. This is a separate supervised example teaching optimization, not the world model.",
});
register("N4", {
  title: "Read a gradient as three local factors",
  question:
    "Change a weight and check the prediction, error signal, and local sensitivity together.",
  controls: [
    range("w", "Input weight", -0.8, 1.8, 0.02, 0.5),
    range("v", "Output weight", -0.8, 1.8, 0.02, 1.2),
    range("x", "Input", -1, 1, 0.02, 0.8),
  ],
  draw(s) {
    const u = s.w * s.x + 0.1,
      h = Math.tanh(u),
      y = s.v * h,
      e = y - 0.6,
      g = e * s.v * (1 - h * h) * s.x;
    return row(
      panel(
        "Forward",
        cards([
          ["Preactivation", tex(`u=wx+0.1=${f(u)}`)],
          ["Hidden value", tex(`h=\\tanh u=${f(h)}`)],
          ["Output and target", tex(`\\hat y=vh=${f(y)},\\quad y=0.6`)],
        ]),
      ),
      panel(
        "Backward",
        eq(
          "\\frac{\\partial L}{\\partial w}=\\underbrace{(\\hat y-y)}_{\\text{error}}\\underbrace{v(1-h^2)}_{\\text{hidden sensitivity}}\\underbrace{x}_{\\text{input}}",
        ) +
          eq(`=${f(e)}\\cdot${f(s.v * (1 - h * h))}\\cdot${f(s.x)}=${f(g, 4)}`),
        "Loss is one half squared error. The sign says whether increasing this weight initially raises or lowers the loss.",
      ),
    );
  },
  caption:
    "Every displayed factor is recomputed. A shared weight would receive a sum of such contributions from all of its uses and all batch examples.",
});
register("N5", {
  title: "Optimizer memory smooths a sequence",
  question:
    "The first moving average is biased toward its zero initialization. What does correction change?",
  controls: [range("n", "Updates shown", 1, 40, 1, 10)],
  draw(s) {
    let m = 0,
      v = 0;
    const gs = [],
      ms = [],
      hat = [],
      vh = [];
    for (let i = 1; i <= s.n; i++) {
      const g = Math.sin(i * 0.8) + 0.5;
      m = 0.9 * m + 0.1 * g;
      v = 0.99 * v + 0.01 * g * g;
      gs.push([i, g]);
      ms.push([i, m]);
      hat.push([i, m / (1 - 0.9 ** i)]);
      vh.push([i, v / (1 - 0.99 ** i)]);
    }
    return row(
      panel(
        "Same gradients; different memory",
        plot({
          xmin: 0,
          xmax: 40,
          ymin: -1,
          ymax: 2,
          curves: [
            { data: gs, color: "blue" },
            { data: ms, color: "violet" },
            { data: hat, color: "teal" },
          ],
          xlabel: "update",
          ylabel: "gradient / first moment",
        }),
        "Blue gradient, violet uncorrected first moment, teal bias-corrected first moment.",
      ),
      panel(
        "Updates use different quantities",
        eq("\\Delta\\theta_{\\rm SGD}=-\\eta g_k") +
          eq("\\Delta\\theta_{\\rm momentum}=-\\eta m_k") +
          eq(
            "\\Delta\\theta_{\\rm Adam}=-\\eta\\frac{\\hat m_k}{\\sqrt{\\hat v_k}+\\epsilon}",
          ) +
          number("Corrected second moment", f(vh.at(-1)[1])),
        "These are responses to one prescribed gradient sequence, not evidence that one optimizer solves every problem faster.",
      ),
    );
  },
  caption:
    "The curves use β₁ = 0.9 and β₂ = 0.99. Corrected moments divide out the missing mass caused by starting the recurrence at zero.",
});
register("N6", {
  title: "The fit alone leaves a choice",
  question:
    "One observation at x = 0 cannot determine the curvature. What does the penalty prefer?",
  controls: [
    range("curvature", "Curvature c", -2, 2, 0.02, 1),
    range("lambda", "Penalty weight", 0, 2, 0.02, 0.5),
  ],
  draw(s) {
    return row(
      panel(
        "A family through one observation",
        plot({
          xmin: -2,
          xmax: 2,
          ymin: -4,
          ymax: 5,
          curves: [
            { fn: (x) => 1 + s.curvature * x * x, color: "teal" },
            { fn: () => 1, color: "blue" },
          ],
          points: [[0, 1, "amber", 6]],
        }),
      ),
      panel(
        "Separate the two reasons",
        plot({
          xmin: -2,
          xmax: 2,
          ymin: 0,
          ymax: 8,
          curves: [
            { fn: () => 0, color: "blue" },
            { fn: (c) => s.lambda * c * c, color: "rose" },
          ],
          points: [
            [s.curvature, s.lambda * s.curvature * s.curvature, "teal", 5],
          ],
          xlabel: "curvature c",
          ylabel: "objective",
        }),
        "Every curve fits the lone observation exactly. A positive squared-curvature penalty selects c = 0. When λ = 0, the data leave c undetermined.",
      ),
    );
  },
  caption:
    "Regularization expresses a preference among explanations compatible with the data. The choice must match the task; “simpler” is not a universal guarantee of truth.",
});
register("N7", {
  title: "Which entries share a normalization?",
  question:
    "A row is one example. A column is one feature. Change the reduction axis.",
  controls: [
    choices("mode", "Operation", [
      "LayerNorm",
      "BatchNorm · training",
      "BatchNorm · evaluation",
    ]),
  ],
  draw(s) {
    const a = [
        [1, 2, 6],
        [3, 4, 2],
      ],
      out = a.map(() => Array(3));
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 3; j++) {
        const values = s.mode === "LayerNorm" ? a[i] : a.map((r) => r[j]),
          mu =
            s.mode === "BatchNorm · evaluation"
              ? 2
              : values.reduce((x, y) => x + y) / values.length,
          variance =
            s.mode === "BatchNorm · evaluation"
              ? 4
              : values.reduce((v, x) => v + (x - mu) ** 2, 0) / values.length;
        out[i][j] = (a[i][j] - mu) / Math.sqrt(variance + 1e-5);
      }
    return row(
      panel(
        "Input: batch × feature",
        svg(
          a
            .flatMap((r, i) =>
              r.map(
                (v, j) =>
                  `<rect x="${45 + j * 90}" y="${60 + i * 80}" width="75" height="65" rx="8" fill="var(--${s.mode === "LayerNorm" ? (i ? "violet" : "blue") : ["blue", "violet", "amber"][j]})" opacity=".18"/>` +
                  text(82 + j * 90, 99 + i * 80, String(v), "ink", "middle"),
              ),
            )
            .join(""),
          "Two by three array with normalization groups",
        ),
      ),
      panel(
        "Normalized values",
        eq("\\frac{x-\\mu}{\\sqrt{\\sigma^2+10^{-5}}}") +
          `<table><tbody>${out.map((r) => "<tr>" + r.map((v) => "<td>" + f(v) + "</td>").join("") + "</tr>").join("")}</tbody></table>`,
        s.mode === "BatchNorm · evaluation"
          ? "Illustrative stored statistics μ = 2, variance = 4 are used, not this batch’s moments."
          : "Gain = 1 and offset = 0. Epsilon prevents division by zero.",
      ),
    );
  },
  caption:
    "LayerNorm uses features within an example. BatchNorm during training uses examples for each feature; its evaluation rule uses stored statistics. These are normalization operations, not automatically regularizers.",
});
register("P2", {
  title: "Follow one decision through the proposed agent",
  question:
    "Which modules are needed for this decision, and which are actually built in the laboratory?",
  controls: [range("stage", "Stage", 1, 5, 1, 1)],
  draw: (s) =>
    cards(
      [
        ["1 · Perception", "Camera image → representation. Implemented."],
        [
          "2 · Memory",
          "Recent image and action history. Implemented as a short context; not a general memory system.",
        ],
        [
          "3 · World model",
          "Candidate actions → predicted representations. Implemented.",
        ],
        [
          "4 · Cost",
          "Goal distance plus effort. Implemented; no learned intrinsic-cost module.",
        ],
        [
          "5 · Actor",
          "Search, act once, observe again. Implemented with CEM and replanning.",
        ],
      ].map((x, i) => [`${i + 1 === s.stage ? "● " : ""}${x[0]}`, x[1]]),
    ),
  caption:
    "LeCun’s broader proposal includes more than this toy learner. Highlighting a stage makes the dataflow explicit without claiming that the book implements the entire architecture.",
});
register("J2", {
  title: "Both uses of shared weights contribute",
  question:
    "Freeze the target branch. The forward values can stay the same while the derivative changes.",
  controls: [
    range("theta", "Shared encoder parameter", -1.5, 1.5, 0.02, 0.8),
    choices("target", "Target gradient", ["Enabled", "Stopped"]),
  ],
  draw(s) {
    const a = 1,
      b = 2,
      p = 1.5,
      pred = p * s.theta * a,
      target = s.theta * b,
      error = pred - target,
      g = 2 * error * (p * a - (s.target === "Stopped" ? 0 : b));
    return row(
      panel(
        "A scalar shared-encoder example",
        cards([
          [
            "Context branch",
            tex(`x=1\\to z=\\theta x\\to\\hat z=1.5z=${f(pred)}`),
          ],
          ["Target branch", tex(`x'=2\\to z'=\\theta x'=${f(target)}`)],
        ]),
      ),
      panel(
        "Derivative through the graph",
        eq(`L=(\\hat z-z')^2=${f(error * error)}`) +
          eq(
            `\\frac{dL}{d\\theta}=2(\\hat z-z')\\left(1.5-${s.target === "Stopped" ? "0" : "2"}\\right)=${f(g)}`,
          ),
        s.target === "Stopped"
          ? "Stopping the target removes its local derivative. It is a computational rule, not a different forward loss value."
          : "The target’s contribution is present because the same parameter controls both branches.",
      ),
    );
  },
  caption:
    "This finite scalar calculation isolates gradient routing. Stop-gradient alone is not a proof against collapse; objectives and update rules must be analyzed together.",
});
register("J3", {
  title: "Agreement can improve by forgetting",
  question:
    "Shrink the code while leaving the physical inputs different. Watch the loss fall without improved dynamics.",
  controls: [
    range("scale", "Representation scale", 0, 1, 0.01, 1),
    choices("collapse", "Collapse", ["All directions", "One direction"]),
  ],
  draw(s) {
    const pts = cloud("gaussian", 90, 17).map((p) => [
      p[0] * s.scale,
      p[1] * (s.collapse === "All directions" ? s.scale : 1),
    ]);
    return row(
      panel("The representations", scatter(pts)),
      panel(
        "What the objective sees",
        eq(
          s.collapse === "All directions"
            ? "\\|cz_1-cz_2\\|^2=c^2\\|z_1-z_2\\|^2"
            : "\\|\\operatorname{diag}(c,1)\\Delta z\\|^2=c^2\\Delta z_1^2+\\Delta z_2^2",
        ) +
          number(
            s.collapse === "All directions"
              ? "Squared-error scale factor"
              : "First-coordinate error factor",
            f(s.scale * s.scale, 4),
          ),
        "A constant encoder and matching constant predictor give perfect agreement. Partial collapse discards only some distinctions, so inspect more than one variance summary.",
      ),
    );
  },
  caption:
    "This is a constructed shrinking representation, not recorded learning. At exact collapse a smooth symmetry-preserving regularizer may also have zero gradient; avoiding collapse in practice is not the same as a nonzero gradient at every collapsed point.",
});
register("J4", {
  title: "Moment constraints change different aspects of a cloud",
  question:
    "Normalize coordinate spread, then remove linear covariance. Does the ring disappear?",
  controls: [
    choices("kind", "Cloud", ["Gaussian", "Ring", "Correlated"]),
    range("scale", "Scale", 0.1, 2, 0.05, 0.5),
  ],
  draw(s) {
    const raw = cloud(s.kind === "Ring" ? "ring" : "gaussian", 160, 23).map(
      (p) => [
        p[0] * s.scale,
        (s.kind === "Correlated" ? p[0] + 0.25 * p[1] : p[1]) * s.scale,
      ],
    );
    const mean = [0, 1].map((j) =>
        raw.reduce((a, p) => a + p[j] / raw.length, 0),
      ),
      pts = raw.map((p) => p.map((v, j) => v - mean[j]));
    const variance = (p) =>
        [0, 1].map((j) => p.reduce((a, v) => a + (v[j] * v[j]) / p.length, 0)),
      v = variance(pts),
      spread = pts.map((p) =>
        p.map((x, j) => x / Math.min(1, Math.sqrt(v[j]))),
      );
    const vv = variance(spread),
      cov = spread.reduce((a, p) => a + (p[0] * p[1]) / spread.length, 0),
      uncorrelated = spread.map((p) => [p[0], p[1] - (cov / vv[0]) * p[0]]);
    return row(
      panel(
        "Centered input",
        scatter(pts),
        "Pair agreement is a separate constraint: matching two views alone could shrink this entire cloud.",
      ),
      panel(
        "Coordinate variance floor",
        scatter(spread),
        "Constructively rescale only coordinates whose standard deviation is below one.",
      ),
      panel(
        "Remove linear covariance",
        scatter(uncorrelated),
        "Subtract the part of coordinate two linearly explained by coordinate one. A final rescaling can restore its variance.",
      ),
    );
  },
  caption:
    "These computed transformations illustrate the jobs of variance and covariance constraints; they are not a simulation of VICReg gradient descent. The ring remains non-Gaussian after its moments are adjusted. Invariance, spread, and redundancy are distinct requirements.",
});
register("J5", {
  title: "The action belongs between the frames",
  question:
    "Which command caused the target image? Read left to right before indexing an array.",
  controls: [choices("alignment", "Alignment", ["Correct", "Shifted by one"])],
  draw: (s) =>
    row(
      panel(
        "Three-frame window",
        svg(
          [0, 1, 2]
            .map(
              (i) =>
                `<rect x="${10 + i * 125}" y="90" width="90" height="90" rx="7" fill="var(--surface)" stroke="var(--blue)"/>` +
                formula(10 + i * 125, 120, 90, `\\obs_{t${i ? `+${i}` : ""}}`),
            )
            .join("") +
            formula(
              80,
              40,
              100,
              s.alignment === "Correct" ? "\\act_t" : "\\act_{t+1}",
            ) +
            formula(
              205,
              40,
              120,
              s.alignment === "Correct" ? "\\act_{t+1}" : "\\act_{t+2}",
            ) +
            line(100, 134, 135, 134, "amber") +
            line(225, 134, 260, 134, "amber"),
          "Images and the actions between them",
          360,
          240,
        ),
      ),
      panel(
        "Prediction target",
        eq("\\hat z_{t+2}=g(z_t,z_{t+1},a_t,a_{t+1})"),
        s.alignment === "Correct"
          ? "Each action is paired with the transition it produced."
          : "The displayed labels assign later commands to earlier transitions. This changes the learning problem even though array shapes still match.",
      ),
    ),
  caption:
    "A shape check cannot detect every indexing error. The same temporal alignment must hold in data construction, training, rollouts, and evaluation.",
});
