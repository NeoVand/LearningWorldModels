import {
  optimizerSpec,
  normalizationSpec,
  neuronActivations,
} from "./experiments.js";
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
const fitTarget = (s, x) =>
  s.target === "Bump"
    ? Math.exp(-3 * x * x) - 0.3
    : s.target === "Zigzag"
      ? Math.abs(x) - 1
      : Math.sin(2 * x);
function initFit(s) {
  if (s.fit) return;
  const r = rng(42),
    units = +(s.units ?? 8);
  s.fit = {
    steps: 0,
    a: 0,
    b: 0,
    w: Array.from({ length: units }, () => normal(r) * 0.7),
    c: Array.from({ length: units }, () => normal(r) * 0.4),
    v: Array.from({ length: units }, () => normal(r) * 0.2),
  };
}
function fitStep(s, n) {
  initFit(s);
  const m = s.fit,
    units = m.w.length,
    activation = neuronActivations[s.activation ?? "tanh"];
  for (let k = 0; k < n; k++) {
    const g = {
      a: 0,
      b: 0,
      w: Array(units).fill(0),
      c: Array(units).fill(0),
      v: Array(units).fill(0),
    };
    for (let i = 0; i < 41; i++) {
      const x = -2 + i * 0.1,
        y = fitTarget(s, x),
        h = m.w.map((w, j) => activation.fn(w * x + m.c[j])),
        pred = h.reduce((a, v, j) => a + m.v[j] * v, 0),
        error = (2 * (pred - y)) / 41,
        lin = (2 * (m.a * x + m.b - y)) / 41;
      g.a += lin * x;
      g.b += lin;
      for (let j = 0; j < units; j++) {
        g.v[j] += error * h[j];
        g.w[j] += error * m.v[j] * activation.df(m.w[j] * x + m.c[j]) * x;
        g.c[j] += error * m.v[j] * activation.df(m.w[j] * x + m.c[j]);
      }
    }
    m.a -= 0.03 * g.a;
    m.b -= 0.03 * g.b;
    for (let j = 0; j < units; j++) {
      m.w[j] -= 0.03 * g.w[j];
      m.c[j] -= 0.03 * g.c[j];
      m.v[j] -= 0.03 * g.v[j];
    }
    m.steps++;
  }
}
register("N3", {
  title: "Build a curve from individual neurons",
  question:
    "Change the target, activation or number of units. Train the same network, then inspect the curves that add up to its prediction.",
  controls: [
    choices("target", "Target", ["Sine", "Bump", "Zigzag"]),
    choices("units", "Hidden units", ["1", "4", "8", "16"], "8"),
    choices("activation", "Activation", ["tanh", "ReLU", "GELU", "Linear"]),
    button("play", "Train / pause"),
    button("train", "200 updates"),
    button("reset-fit", "Reset weights"),
    choices("contributions", "Individual contributions", ["Hidden", "Shown"]),
  ],
  animate: true,
  fps: 8,
  tick(s) {
    fitStep(s, 25);
  },
  change(s, key) {
    if (["target", "units", "activation"].includes(key)) delete s.fit;
  },
  action(s, a) {
    if (a === "reset-fit") delete s.fit;
    else if (a === "train") fitStep(s, 200);
  },
  draw(s) {
    initFit(s);
    const m = s.fit,
      activation = neuronActivations[s.activation],
      predict = (x) =>
        m.w.reduce(
          (sum, w, j) => sum + m.v[j] * activation.fn(w * x + m.c[j]),
          0,
        ),
      mse =
        Array.from({ length: 41 }, (_, i) => {
          const x = -2 + i * 0.1;
          return (predict(x) - fitTarget(s, x)) ** 2;
        }).reduce((a, b) => a + b) / 41;
    const curves = [
      { fn: (x) => fitTarget(s, x), color: "blue" },
      { fn: (x) => m.a * x + m.b, color: "amber" },
    ];
    if (s.contributions === "Shown")
      m.w.forEach((w, j) =>
        curves.push({
          fn: (x) => m.v[j] * activation.fn(w * x + m.c[j]),
          color: j % 2 ? "violet" : "muted",
        }),
      );
    curves.push({ fn: predict, color: "teal" });
    return row(
      panel(
        "Target and current fit",
        plot({
          xmin: -2,
          xmax: 2,
          ymin: -1.8,
          ymax: 1.8,
          curves,
          points: Array.from({ length: 21 }, (_, i) => {
            const x = -2 + i * 0.2;
            return [x, fitTarget(s, x), "blue", 2];
          }),
          ylabel: "prediction",
        }),
        `${m.steps.toLocaleString()} actual gradient updates. Blue target; amber affine baseline; teal neural network.`,
      ),
      panel(
        "What the units contribute",
        eq(`\\hat y=\\sum_{j=1}^{${m.w.length}}v_j\\sigma(w_jx+b_j)`) +
          number("Mean squared error", f(mse, 4)) +
          `<p class="visual-note">${m.w.length} hidden units · ${3 * m.w.length} trainable parameters. ${s.contributions === "Shown" ? "Each thin curve is one weighted unit. Their sum is the teal prediction." : "Show individual contributions to see how a collection of simple curves builds the fit."}</p>`,
        "A linear activation keeps the whole model affine, however many units you add. Nonlinear activations let it bend.",
      ),
    );
  },
  caption:
    "Adapted from Jaxverse’s curve-fitting experiment. Training uses all 41 fixed samples, explicit chain-rule gradients and a learning rate of 0.03. Pause preserves weights; reset restores the seed. Changing the target, width or activation starts fresh. This supervised example is separate from the world-model laboratory.",
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
register("N5", optimizerSpec);

register("N6", {
  title: "The fit alone leaves a choice",
  question:
    "One observation at x = 1 cannot determine the curvature. What does the penalty prefer?",
  controls: [
    range("curvature", "Curvature c", -2, 2, 0.02, 1),
    range("lambda", "Penalty weight", 0, 2, 0.02, 0.5),
  ],
  draw(s) {
    return row(
      panel(
        "A family through one observation",
        plot({
          xmin: -1,
          xmax: 3,
          ymin: Math.min(0, 1 + 4 * s.curvature) - 0.2,
          ymax: Math.max(1, 1 + 4 * s.curvature) + 0.2,
          curves: [
            { fn: (x) => 1 + s.curvature * (x - 1) ** 2, color: "teal" },
            { fn: () => 1, color: "blue" },
          ],
          points: [[1, 1, "amber", 6]],
        }),
      ),
      panel(
        "Separate the two reasons",
        plot({
          xmin: -2,
          xmax: 2,
          ymin: 0,
          ymax: Math.max(0.25, 4 * s.lambda * 1.12),
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
register("N7", normalizationSpec);

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
            tex(`\\observed{x}=1\\to\\encoded{z}=\\theta\\observed{x}\\to\\predicted{\\hat z}=1.5\\encoded{z}=${f(pred)}`),
          ],
          ["Target branch", tex(`\\observed{x}'=2\\to\\encoded{z}'=\\theta\\observed{x}'=${f(target)}`)],
        ]),
      ),
      panel(
        "Derivative through the graph",
        eq(`\\objective{L}=(\\predicted{\\hat z}-\\encoded{z}')^2=${f(error * error)}`) +
          eq(
            `\\frac{d\\objective{L}}{d\\theta}=2(\\predicted{\\hat z}-\\encoded{z}')\\left(1.5-${s.target === "Stopped" ? "0" : "2"}\\right)=${f(g)}`,
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
            ? "\\|c\\encoded{z}_1-c\\encoded{z}_2\\|^2=c^2\\|\\encoded{z}_1-\\encoded{z}_2\\|^2"
            : "\\|\\operatorname{diag}(c,1)\\Delta\\encoded{z}\\|^2=c^2\\Delta\\encoded{z}_1^2+\\Delta\\encoded{z}_2^2",
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
        eq("\\predicted{\\hat z}_{t+2}=g(\\encoded{z}_t,\\encoded{z}_{t+1},\\action{a}_t,\\action{a}_{t+1})"),
        s.alignment === "Correct"
          ? "Each action is paired with the transition it produced."
          : "The displayed labels assign later commands to earlier transitions. This changes the learning problem even though array shapes still match.",
      ),
    ),
  caption:
    "A shape check cannot detect every indexing error. The same temporal alignment must hold in data construction, training, rollouts, and evaluation.",
});
