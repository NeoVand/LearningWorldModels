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
  scatter,
  range,
  choices,
  tex,
  f,
  number,
  takeaway,
  esc,
} from "./core.js";
import { ecf, ep, rng, normal } from "../numerics.js";
const eq = (s) => `<div class="visual-equation">${tex(s, true)}</div>`;
register("I1", {
  title: "The same frames, two memory layouts",
  question:
    "Reordering axes changes the array layout. Does it change which frames belong together?",
  draw: () => {
    const colors = ["blue", "violet", "teal"],
      cells = [];
    for (let b = 0; b < 2; b++)
      for (let t = 0; t < 3; t++)
        cells.push(
          `<rect x="${40 + t * 38}" y="${55 + b * 43}" width="32" height="32" rx="3" fill="var(--${colors[t]})" opacity=".68"/>`,
        );
    for (let t = 0; t < 3; t++)
      for (let b = 0; b < 2; b++)
        cells.push(
          `<rect x="${235 + b * 38}" y="${39 + t * 43}" width="32" height="32" rx="3" fill="var(--${colors[t]})" opacity=".68"/>`,
        );
    const diagram =
      text(96, 18, "Example first", "ink", "middle") +
      text(272, 18, "Time first", "ink", "middle") +
      text(56, 45, "0", "muted", "middle") +
      text(94, 45, "1", "muted", "middle") +
      text(132, 45, "2", "muted", "middle") +
      text(23, 76, "1", "muted", "middle") +
      text(23, 119, "2", "muted", "middle") +
      text(251, 31, "1", "muted", "middle") +
      text(289, 31, "2", "muted", "middle") +
      [0, 1, 2]
        .map((t) => text(218, 59 + t * 43, String(t), "muted", "middle"))
        .join("") +
      cells.join("") +
      line(169, 99, 207, 99, "ink") +
      `<path d="M207 99l-7-4v8z" fill="var(--ink)"/>` +
      text(
        180,
        177,
        "Each square is one frame; colors mark time.",
        "muted",
        "middle",
      );
    return (
      row(
        panel(
          "A transpose keeps each example’s sequence intact",
          svg(
            diagram,
            "Two example rows each contain frames at times zero, one, and two. A transpose groups the same six frames by time instead of by example.",
            360,
            190,
          ),
          "Two examples are drawn; the batch can have any size. The third time slice supplies the target, while the first two and their aligned actions supply context.",
        ),
      ) +
      eq(
        "[B,3,4096]\\;\\longrightarrow\\;[3,B,4096]\\;\\xrightarrow{f_\\theta}\\;[3,B,8]",
      )
    );
  },
  caption:
    "The manuscript names examples in batch-first order. The browser transposes to time-first order before the shared encoder, so SIGReg can inspect a separate batch of embeddings at each time. Transposing axes does not swap actions between transitions.",
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
  title: "Different windows can share the same frame",
  question:
    "Can a held-out window contain a camera frame that training has already seen?",
  controls: [choices("split", "Split", ["Random windows", "Whole episodes"])],
  draw(s) {
    const whole = s.split === "Whole episodes";
    const frame = (x, y, id, color, shared) =>
      `<rect x="${x}" y="${y}" width="66" height="47" rx="4" fill="var(--surface-raised)" stroke="var(--${shared ? "rose" : color})" stroke-width="${shared ? 2 : 1.5}"/>` +
      text(x + 33, y + 29, "frame " + id, "ink", "middle");
    const strip =
      dot(23, 25, 4, "blue") +
      text(36, 29, "Training · episode 1", "ink") +
      dot(23, 104, 4, "amber") +
      text(36, 108, `Validation · episode ${whole ? "2" : "1"}`, "ink") +
      [1, 2, 3]
        .map((id, i) => frame(82 + i * 82, 38, id, "blue", !whole && id > 1))
        .join("") +
      [2, 3, 4]
        .map((id, i) => frame(82 + i * 82, 117, id, "amber", !whole && id < 4))
        .join("") +
      text(
        180,
        190,
        whole ? "0 shared source frames" : "2 shared source frames",
        whole ? "teal" : "rose",
        "middle",
      );
    return (
      row(
        panel(
          "Inspect the source of each frame",
          svg(
            strip,
            whole
              ? "Training uses frames one through three from episode one; validation uses frames two through four from episode two, so no source frame repeats."
              : "Training uses frames one through three from episode one; validation uses frames two through four from the same episode, so frames two and three repeat.",
            360,
            205,
          ),
        ),
      ) +
      takeaway(
        whole
          ? "Holding out episode 2 prevents this frame leak. It does not test a new camera or new physics."
          : "The windows differ, but frames 2 and 3 appear in both. Validation has already seen part of its input.",
      )
    );
  },
  caption:
    "These are illustrative windows of length three. The laboratory splits whole episodes before sampling its training and validation windows.",
});
register("I5", {
  title: "A checkpoint is more than weights",
  question:
    "What must survive a pause for the next update to be a continuation?",
  draw: () =>
    row(
      panel(
        "What crosses the pause",
        svg(
          `<rect x="12" y="20" width="150" height="139" rx="6" fill="var(--surface-raised)" stroke="var(--line)"/>` +
            text(26, 43, "Weights", "ink") +
            text(26, 73, "Adam averages", "ink") +
            text(26, 103, "Update count", "ink") +
            text(26, 133, "Random streams", "ink") +
            [54, 84, 114].map((y) => line(25, y, 148, y)).join("") +
            line(169, 89, 225, 89, "teal") +
            `<path d="M225 89l-8-5v10z" fill="var(--teal)"/>` +
            text(197, 73, "pause", "muted", "middle") +
            `<rect x="233" y="53" width="114" height="72" rx="6" fill="var(--surface-raised)" stroke="var(--teal)"/>` +
            text(290, 81, "Resume", "ink", "middle") +
            text(290, 101, "same run", "teal", "middle") +
            line(88, 165, 88, 192, "muted") +
            line(88, 192, 225, 192, "muted") +
            `<path d="M225 192l-8-5v10z" fill="var(--muted)"/>` +
            text(279, 185, "Metrics export", "muted", "middle") +
            text(279, 205, "record only", "muted", "middle"),
          "Weights, optimizer averages, update count, and random streams remain in memory across a pause and allow the next update to continue the same run. Exported measurements are a record, not a restorable checkpoint.",
          360,
          220,
        ),
      ),
    ),
  caption:
    "The browser’s Pause/Train continuation retains this state in its worker. Resetting from a seed reconstructs an initial run; saving measurements exports observations, not a restorable checkpoint.",
});
register("A1", {
  title: "The same model, different things to change",
  question:
    "Both use the encoder and predictor. What does each process adjust?",
  draw: () => {
    const box = (x, y, w, a, b, color = "line") =>
      `<rect x="${x}" y="${y}" width="${w}" height="43" rx="5" fill="var(--surface-raised)" stroke="var(--${color})"/>` +
      text(x + w / 2, y + 18, a, "ink", "middle") +
      text(x + w / 2, y + 34, b, "muted", "middle");
    const arrow = (x1, x2, y, color = "plot-line") =>
      line(x1, y, x2, y, color) +
      `<path d="M${x2} ${y}l-6-4v8z" fill="var(--${color})"/>`;
    const flow =
      text(12, 17, "LEARNING", "teal") +
      box(12, 28, 91, "Recorded", "transitions") +
      arrow(105, 128, 49, "teal") +
      box(130, 28, 101, "Encoder +", "predictor", "teal") +
      arrow(233, 256, 49, "teal") +
      box(258, 28, 89, "Prediction", "error") +
      `<path d="M303 75V91H181V75" fill="none" stroke="var(--teal)" stroke-width="1.7"/>` +
      `<path d="M181 75l-4 7h8z" fill="var(--teal)"/>` +
      text(242, 108, "update model weights", "teal", "middle") +
      text(12, 137, "PLANNING", "amber") +
      box(12, 148, 91, "Candidate", "actions", "amber") +
      arrow(105, 128, 169, "amber") +
      box(130, 148, 101, "Same frozen", "model", "teal") +
      arrow(233, 256, 169, "amber") +
      box(258, 148, 89, "Goal", "cost") +
      `<path d="M303 195V211H57V195" fill="none" stroke="var(--amber)" stroke-width="1.7"/>` +
      `<path d="M57 195l-4 7h8z" fill="var(--amber)"/>` +
      text(180, 232, "search candidate actions", "amber", "middle");
    return (
      row(
        panel(
          "Follow the two feedback loops",
          svg(
            flow,
            "In learning, recorded images and actions pass through the encoder and predictor; prediction error updates model weights. In planning, candidate actions pass through the frozen model; goal cost changes the candidates.",
            360,
            246,
          ),
        ),
      ) +
      takeaway(
        "Learning changes model weights using recorded transitions. Planning searches actions using those fixed weights.",
      )
    );
  },
  caption:
    "The browser’s planner uses CEM to search candidate action sequences and encodes the goal image with the frozen encoder. It does not differentiate through the actions.",
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
  title: "A cheap endpoint can hide two failures",
  question: "What can a small latent goal cost miss about the physical state?",
  controls: [range("scale", "Keep the second coordinate", 0, 1, 0.01, 0.1)],
  draw(s) {
    const physical = 1.5 ** 2,
      latent = (1.5 * s.scale) ** 2;
    const diagram =
      text(10, 22, "1 · A hidden physical error", "ink") +
      text(10, 53, "Physical cost", "blue") +
      `<rect x="160" y="43" width="165" height="13" rx="3" fill="var(--blue)" opacity=".82"/>` +
      text(10, 84, "Latent cost", "violet") +
      `<rect x="160" y="74" width="165" height="13" rx="3" fill="var(--inset)"/>` +
      `<rect x="160" y="74" width="${165 * s.scale * s.scale}" height="13" rx="3" fill="var(--violet)"/>` +
      line(10, 113, 350, 113) +
      text(10, 139, "2 · The right place, but still moving", "ink") +
      text(345, 139, "speed = 1", "amber", "end") +
      [0, 1, 2]
        .map((t) => {
          const x = 26 + t * 108;
          return (
            text(x + 32, 164, "time " + t, "muted", "middle") +
            line(x - 10, 220, x + 95, 220) +
            `<circle cx="${x + 20}" cy="205" r="11" fill="none" stroke="var(--teal)" stroke-width="2"/>` +
            dot(x + 20 + t * 18, 205, 6, "blue")
          );
        })
        .join("") +
      text(180, 248, "Teal rings mark the goal position.", "muted", "middle");
    return (
      row(
        panel(
          "Two checks that endpoint cost omits",
          svg(
            diagram,
            `A fixed physical second-coordinate error of 1.5 has squared cost 2.25, but latent cost ${latent.toFixed(3)} when that coordinate is scaled by ${s.scale.toFixed(2)}. In a separate case, an object begins at the goal position and moves away because its arrival speed is one.`,
            360,
            260,
          ),
        ),
      ) +
      `<div class="visual-results"><div><span>Physical error squared</span><strong>${f(physical, 2)}</strong></div><div><span>Latent error squared</span><strong>${f(latent, 3)}</strong></div></div>` +
      takeaway(
        "A representation can hide a wrong position. Even with the right position, motion can carry the arm away.",
      )
    );
  },
  caption:
    "Top: a toy encoder scales one physical coordinate by the control value, while its actual error stays at 1.5. Bottom: with no braking, a toy object reaches the goal at time 0 with speed 1 and then drifts. Both are explicit counterexamples, not measured browser rollouts.",
});
