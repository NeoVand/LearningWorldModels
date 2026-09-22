import { rolloutSpec } from "./experiments.js";
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
  esc,
} from "./core.js";
import { ecf, ep, rng, normal } from "../numerics.js";
const eq = (s) => `<div class="visual-equation">${tex(s, true)}</div>`;
const cards = (items) =>
  '<div class="visual-steps">' +
  items
    .map(([a, b]) => `<div class="visual-card"><strong>${a}</strong>${b}</div>`)
    .join("") +
  "</div>";
register("I1", {
  title: "A window keeps its axes through the graph",
  question:
    "Select a time position. Which entries are context, and which supply the next target?",
  controls: [range("time", "Sequence position", 0, 2, 1, 1)],
  draw: (s) =>
    row(
      panel(
        "Three images, two transitions",
        cards([
          [
            "Camera window",
            tex("[3,B,4096]") + "<br>time × batch × flattened pixels",
          ],
          ["Shared encoder", tex("[3,B,8]") + "<br>time × batch × coordinates"],
          ["Selected slice", tex(`Z_{${s.time}}\\in\\mathbb R^{B\\times8}`)],
        ]),
      ),
      panel(
        "Predict one next embedding",
        cards([
          [
            "Concatenate",
            tex("[\\encoded{z}_0,\\encoded{z}_1,\\action{a}_0,\\action{a}_1]") +
              "<br>8 + 8 + 2 + 2 = 20 entries per example",
          ],
          ["Predict a residual", tex("g:\\mathbb R^{20}\\to\\mathbb R^8")],
          [
            "Add and compare",
            tex("\\predicted{\\hat z}_2=\\encoded{z}_1+g(\\cdot)") +
              "<br>Compare against encoder output z₂. Gradients reach both.",
          ],
        ]),
      ),
    ),
  caption:
    "The browser layout is time-first. The paper and libraries may store axes differently; a permutation must preserve which axis each reduction refers to.",
});
register("I2", {
  title: "Average before squaring",
  question:
    "Two arrows can cancel. Squaring their individual lengths first destroys that cancellation.",
  controls: [range("angle", "Second phasor angle", 0, 6.28, 0.02, 3.14)],
  draw(s) {
    const c = (1 + Math.cos(s.angle)) / 2,
      v = Math.sin(s.angle) / 2;
    return row(
      panel(
        "Average complex values",
        svg(
          `<circle cx="180" cy="140" r="100" fill="none" stroke="var(--line)"/>` +
            path(
              [
                [180, 140],
                [280, 140],
              ],
              "violet",
              2,
            ) +
            path(
              [
                [180, 140],
                [180 + 100 * Math.cos(s.angle), 140 - 100 * Math.sin(s.angle)],
              ],
              "violet",
              2,
            ) +
            path(
              [
                [180, 140],
                [180 + 100 * c, 140 - 100 * v],
              ],
              "teal",
              4,
            ),
          "Two unit phasors and their mean",
        ),
      ),
      panel(
        "Noncommuting operations",
        eq(`\\left|\\frac{1+e^{i\\alpha}}2\\right|^2=${f(c * c + v * v, 3)}`) +
          eq("\\frac{|1|^2+|e^{i\\alpha}|^2}{2}=1"),
        "These are different functions. SIGReg averages the sample phasors before taking the squared discrepancy from its target. Then it integrates frequencies and averages directions/time.",
      ),
    );
  },
  caption:
    "At opposite angles the mean is zero although every individual arrow has length one. Reduction order is mathematical content, not merely an implementation detail.",
});
export const traceLines = [
  ["Projection", "h = z @ directions"],
  ["Phase", "phase = h[:, :, None] * omega[None, None, :]"],
  ["Average", "c = np.cos(phase).mean(axis=0)"],
  ["Average", "s = np.sin(phase).mean(axis=0)"],
  ["Discrepancy", "error = (c - target)**2 + s**2"],
  ["Discrepancy", "return batch * (error * weights).sum(axis=-1).mean()"],
];
register("I3", {
  title: "Trace a two-by-two batch",
  question:
    "Follow the same two examples and coordinate directions used in the text.",
  controls: [
    choices("stage", "Operation", [
      "Projection",
      "Phase",
      "Average",
      "Discrepancy",
    ]),
    range("direction", "Direction column", 1, 2, 1, 1),
  ],
  draw(s) {
    const h = s.direction === 1 ? [1, -1] : [0, 0],
      r = ecf(h, 1),
      d = (r.c - r.q) ** 2 + r.s * r.s;
    const code = traceLines
      .map(
        ([stage, source]) =>
          `<span class="code-line ${stage === s.stage ? "trace-active-line" : ""}">${esc(source).replace(/\b(return|None)\b/g, '<span class="hljs-keyword">$1</span>')}</span>`,
      )
      .join("\n");
    return (
      row(
        panel(
          "Known inputs",
          eq("Z=\\begin{pmatrix}1&0\\\\-1&0\\end{pmatrix},\\quad U=I") +
            eq("\\omega=1,\\quad B=2"),
        ),
        panel(
          s.stage,
          {
            Projection: eq(`h=Zu=(${h.join(",")})^\\top`),
            Phase:
              eq(`e^{ih_1}=${f(Math.cos(h[0]), 4)}+${f(Math.sin(h[0]), 4)}i`) +
              eq(
                `e^{ih_2}=${f(Math.cos(h[1]), 4)}${Math.sin(h[1]) < 0 ? "-" : "+"}${f(Math.abs(Math.sin(h[1])), 4)}i`,
              ),
            Average: eq(`\\widehat\\varphi(1)=${f(r.c, 4)}+${f(r.s, 4)}i`),
            Discrepancy: eq(`|\\widehat\\varphi-q|^2=${f(d, 5)}`),
          }[s.stage],
          s.direction === 1
            ? "Opposite imaginary parts cancel. The mean is cos(1), not a unit phasor."
            : "Both projections are zero, so both phasors are 1.",
        ),
      ) +
      `<div class="code-wrap trace-excerpt"><div class="code-header"><span>Python · exact lines from the SIGReg reference</span></div><div class="code-body"><pre class="source-code"><code>${code}</code></pre></div></div>`
    );
  },
  caption:
    "The selected lines are copied from the tested reference above. This calculation inspects one frequency; the final line weights all frequency knots, sums them, multiplies by batch size and averages direction columns.",
});
register("I4", {
  title: "A split can leak a frame without copying a window",
  question:
    "Two different windows can still share most of their camera frames.",
  controls: [choices("split", "Split", ["Random windows", "Whole episodes"])],
  draw(s) {
    let g = "";
    for (let r = 0; r < 3; r++) {
      g += text(18, 40 + r * 75, "Episode " + (r + 1));
      for (let i = 0; i < 8; i++) {
        const test = s.split === "Whole episodes" ? r === 2 : (i + r) % 3 === 0;
        g += `<rect x="${110 + i * 27}" y="${20 + r * 75}" width="22" height="24" rx="3" fill="var(--${s.split === "Whole episodes" ? (test ? "amber" : "blue") : "plot-line"})" opacity=".65"/>`;
      }
      g +=
        line(
          110,
          60 + r * 75,
          183,
          60 + r * 75,
          s.split === "Whole episodes" && r === 2 ? "amber" : "blue",
        ) +
        line(
          137,
          67 + r * 75,
          210,
          67 + r * 75,
          s.split === "Random windows" || r === 2 ? "amber" : "blue",
        );
    }
    return row(
      panel(
        "Frames and overlapping windows",
        svg(g, "Episode split versus interleaved frame membership"),
        "Blue training; amber held out. Adjacent length-three windows overlap.",
      ),
      panel(
        "What independence is claimed",
        s.split === "Whole episodes"
          ? "Holding out whole episodes removes shared frames between those episodes. It still does not test new physics, cameras, action ranges, or tasks."
          : "Assigning adjacent windows independently can put the same observation on both sides of the split. “Different windows” is insufficient.",
      ),
    );
  },
  caption:
    "The diagram illustrates the leakage mechanism. The actual laboratory splits episodes before sampling its windows.",
});
register("I5", {
  title: "A checkpoint is more than weights",
  question:
    "What must survive a pause for the next update to be a continuation?",
  draw: () =>
    cards([
      ["Parameters θ", "The learned encoder and predictor."],
      [
        "Adam moments",
        "First and second moving averages retain optimizer history.",
      ],
      [
        "Update count",
        "Bias correction depends on the number of completed updates.",
      ],
      [
        "Random streams",
        "Batch and projection streams determine which update comes next.",
      ],
      ["Resume", "All four remain in memory when you pause this browser run."],
      [
        "Reset",
        "A seed reconstructs an initial experiment; it does not continue the trained checkpoint.",
      ],
    ]),
  caption:
    "Saving measurements exports observations about a run, not a restorable parameter checkpoint. The browser’s Pause/Train continuation retains the actual optimizer state in its worker.",
});
register("A1", {
  title: "The graph stays; the movable quantities change",
  question:
    "During planning, which values are optimized and which remain fixed?",
  controls: [choices("mode", "Mode", ["Learning", "Planning"])],
  draw: (s) =>
    row(
      panel(
        "Information flow",
        cards([
          [
            "Observe",
            tex(
              "\\observed{o}_t\\to f_\\theta(\\observed{o}_t)=\\encoded{z}_t",
            ),
          ],
          [
            "Predict",
            tex(
              "(\\encoded{z}_t,\\action{a}_t)\\to g_\\psi(\\encoded{z}_t,\\action{a}_t)",
            ),
          ],
          [
            "Compare",
            s.mode === "Learning"
              ? tex(
                  "\\|\\predicted{\\hat z}_{t+1}-\\encoded{z}_{t+1}\\|^2+\\lambda\\objective{R}",
                )
              : tex(
                  "\\|\\predicted{\\hat z}_{t+H}-f_\\theta(\\observed{o}_{\\rm goal})\\|^2",
                ),
          ],
        ]),
      ),
      panel(
        "What moves",
        eq(
          s.mode === "Learning"
            ? "(\\theta,\\psi)\\leftarrow\\operatorname{optimizer}(\\nabla L)"
            : "a_{t:t+H-1}\\leftarrow\\operatorname{search}(C)",
        ),
        s.mode === "Learning"
          ? "Actions and observations are supplied by the fixed dataset. Encoder and predictor parameters change."
          : "Encoder and predictor parameters are frozen. Candidate action sequences change. The goal image is encoded by the same frozen encoder.",
      ),
    ),
  caption:
    "CEM searches without differentiating through the actions. Gradient-based planning is another possible choice, but it is not the browser’s search algorithm.",
});
export function cem(iter) {
  const random = rng(209),
    history = [];
  let mu = [0, 0],
    sd = [1, 1];
  for (let k = 0; k <= iter; k++) {
    const pts = Array.from({ length: 80 }, () =>
        mu.map((m, j) => m + sd[j] * normal(random)),
      ),
      cost = (p) => (p[0] - 0.8) ** 2 + 2 * (p[1] + 0.6) ** 2;
    const sorted = [...pts].sort((a, b) => cost(a) - cost(b)),
      elite = sorted.slice(0, 12);
    const next = [0, 1].map((j) => elite.reduce((a, p) => a + p[j] / 12, 0)),
      spread = [0, 1].map((j) =>
        Math.max(
          0.08,
          Math.sqrt(elite.reduce((a, p) => a + (p[j] - next[j]) ** 2 / 12, 0)),
        ),
      );
    history.push({ pts, elite, mu, sd, next, spread });
    mu = next;
    sd = spread;
  }
  return history.at(-1);
}
register("A2", {
  title: "Search, keep, refit, repeat",
  question: "Which samples determine the next search distribution?",
  controls: [range("iteration", "CEM iteration", 0, 5, 1, 0)],
  draw(s) {
    const r = cem(s.iteration);
    return row(
      panel(
        "Candidate action pairs",
        scatter(
          r.pts.map((p) => [...p, r.elite.includes(p) ? "amber" : "violet"]),
        ),
        "Amber: best 12 of 80 under C(a) = (a₁ − 0.8)² + 2(a₂ + 0.6)².",
      ),
      panel(
        "Fit the elite distribution",
        eq("\\mu_j^{\\rm new}=K^{-1}\\sum_{i\\in E}a_{ij}") +
          eq(
            "\\sigma_j^{\\rm new}=\\max(0.08,\\sqrt{K^{-1}\\sum_{i\\in E}(a_{ij}-\\mu_j^{\\rm new})^2})",
          ) +
          number("New mean", r.next.map((x) => f(x, 3)).join(", ")) +
          number(
            "New standard deviation",
            r.spread.map((x) => f(x, 3)).join(", "),
          ),
      ),
    );
  },
  caption:
    "The cost surface is an explicitly defined two-action illustration. The world-model planner uses longer action sequences and a learned rollout cost. The standard-deviation floor prevents a prematurely degenerate search.",
});
register("A3", rolloutSpec);

register("A4", {
  title: "A long plan can be spent one action at a time",
  question:
    "Change the execution prefix independently of the planning horizon.",
  controls: [
    range("horizon", "Planning horizon", 2, 12, 1, 8),
    range("prefix", "Requested execution prefix", 1, 6, 1, 1),
  ],
  draw(s) {
    const prefix = Math.min(s.prefix, s.horizon);
    return row(
      panel(
        "One planning round",
        svg(
          Array.from(
            { length: s.horizon },
            (_, i) =>
              `<rect x="${20 + (i * 300) / s.horizon}" y="90" width="${280 / s.horizon}" height="60" rx="4" fill="var(--${i < prefix ? "amber" : "teal"})" opacity="${i < prefix ? 1 : 0.25}"/>` +
              text(
                20 + ((i + 0.45) * 300) / s.horizon,
                180,
                String(i + 1),
                "ink",
                "middle",
              ),
          ).join(""),
          "Planned and executed action slots",
        ),
        "Amber actions are executed. Teal actions are imagined but may be discarded.",
      ),
      panel(
        "After the prefix",
        eq(`H=${s.horizon},\\quad k=${prefix}`),
        "Observe again, replace the stale context, and search a new plan. The browser executes one action per replan. The research paper groups actions on a different cadence.",
      ),
    );
  },
  caption:
    "Planning horizon controls how far the model looks ahead. Execution prefix controls how long it acts before getting new evidence. Neither guarantees accurate long-horizon prediction.",
});
register("A5", {
  title: "A cheap latent move can be physically wrong",
  question:
    "Erase one physical coordinate from the representation. Can the planner still detect an error there?",
  controls: [
    range("scale", "Second-coordinate scale", 0, 1, 0.01, 0.1),
    range("velocity", "Velocity on arrival", 0, 2, 0.05, 1),
  ],
  draw(s) {
    return row(
      panel(
        "Latent cost hides a direction",
        plot({
          xmin: -2,
          xmax: 2,
          ymin: 0,
          ymax: 4,
          curves: [
            { fn: (y) => y * y, color: "blue" },
            { fn: (y) => (s.scale * y) ** 2, color: "rose" },
          ],
          xlabel: "physical second-coordinate error",
          ylabel: "squared cost",
        }),
        "Blue physical squared error; rose latent squared distance. At scale zero, this direction becomes invisible.",
      ),
      panel(
        "Reaching is not remaining",
        plot({
          xmin: 0,
          xmax: 3,
          ymin: -1,
          ymax: 6,
          curves: [{ fn: (t) => s.velocity * t, color: "blue" }],
          xlabel: "time after reaching position",
          ylabel: "distance from goal",
        }),
        `Arrival velocity ${f(s.velocity)}. With no braking in this simple illustration, reaching the correct position does not keep it there.`,
      ),
    );
  },
  caption:
    "These explicit counterexamples separate representation distortion from dynamics error and stopping behavior. A low imagined terminal cost alone cannot establish successful physical control.",
});
