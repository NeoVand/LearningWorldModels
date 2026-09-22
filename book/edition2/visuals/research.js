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
  range,
  choices,
  button,
  tex,
  f,
  number,
  takeaway,
  results,
} from "./core.js";
import { renderSensor, SENSOR_SIZE } from "../../world/sensor.ts";
import { recorded } from "./recorded.js";
const eq = (s) => `<div class="visual-equation">${tex(s, true)}</div>`;
const cards = (items) =>
  '<div class="visual-steps">' +
  items
    .map(([a, b]) => `<div class="visual-card"><strong>${a}</strong>${b}</div>`)
    .join("") +
  "</div>";
const softmax = (a) => {
  let max = Math.max(...a),
    e = a.map((x) => Math.exp(x - max)),
    sum = e.reduce((a, b) => a + b);
  return e.map((x) => x / sum);
};
register("V1", {
  title: "From image patches to a token sequence",
  question:
    "A patch is flattened before projection. Its position is then supplied separately.",
  controls: [range("patch", "Selected patch", 0, 15, 1, 5)],
  draw(s) {
    const img = renderSensor({ q1: -1.4, q2: 1.6 });
    const patchSide = SENSOR_SIZE / 4,
      pixelWidth = 224 / SENSOR_SIZE;
    let g = `<rect x="70" y="25" width="224" height="224" fill="white"/>`;
    img.forEach(
      (v, i) =>
        (g +=
          v >= 1
            ? ""
            : `<rect x="${70 + (i % SENSOR_SIZE) * pixelWidth}" y="${25 + Math.floor(i / SENSOR_SIZE) * pixelWidth}" width="${pixelWidth}" height="${pixelWidth}" fill="rgb(${v * 255},${v * 255},${v * 255})"/>`),
    );
    g = `<g class="sensor-image">${g}</g>`;
    g += `<rect x="${70 + (s.patch % 4) * 56}" y="${25 + Math.floor(s.patch / 4) * 56}" width="56" height="56" fill="none" stroke="var(--amber)" stroke-width="3"/>`;
    const values = Array.from(
      { length: patchSide ** 2 },
      (_, i) =>
        img[
          (Math.floor(s.patch / 4) * patchSide + Math.floor(i / patchSide)) *
            SENSOR_SIZE +
            (s.patch % 4) * patchSide +
            (i % patchSide)
        ],
    );
    return row(
      panel(
        `Teaching image: ${SENSOR_SIZE} × ${SENSOR_SIZE}`,
        svg(
          g,
          "Actual sensor image with one selected sixteen by sixteen patch",
        ),
        "Sixteen grayscale patches, each containing 256 intensities. First row of the selected patch: " +
          values
            .slice(0, patchSide)
            .map((v) => f(v, 1))
            .join(", ") +
          ". A toy projection takes the mean of all 256 patch values: " +
          f(values.reduce((a, b) => a + b) / values.length, 3) +
          ". Adding the illustrative position " +
          s.patch +
          "/16 gives " +
          f(values.reduce((a, b) => a + b) / values.length + s.patch / 16, 3) +
          ".",
      ),
      panel(
        "Research image: 224 × 224",
        eq("(224/14)^2=256\\text{ patches}") +
          eq("14\\cdot14\\cdot3=588\\text{ inputs per RGB patch}") +
          eq("588\\to192;\\quad256+1=257\\text{ tokens}"),
        "The added CLS token is learned. Patch position vectors are added to distinguish locations. A permutation of patch contents without positions would lose spatial ordering.",
      ),
    );
  },
  caption:
    "The small sensor image makes the operation legible. The research dimensions are 14 × 14 RGB patches projected to width 192, plus a CLS token; they are not the dimensions of the tiny teaching image.",
});
export function attention(s) {
  const X = [
      [1, 0],
      [0, 1],
      [1, s.future ?? 1],
    ],
    q = X[s.query ?? 0],
    scores = X.map((k) => (q[0] * k[0] + q[1] * k[1]) / Math.sqrt(2)),
    masked =
      s.mask === true
        ? scores.map((v, j) => (j > (s.query ?? 0) ? -Infinity : v))
        : scores,
    w = softmax(masked),
    values = [
      [1, 2],
      [3, 0],
      [0, 4],
    ],
    out = [0, 1].map((k) => w.reduce((v, a, j) => v + a * values[j][k], 0));
  return { scores, masked, w, out, values };
}
register("V2", {
  title: "One query creates one row of weights",
  question:
    "Select the querying token. The row changes because its dot products with the keys change.",
  controls: [range("query", "Query token", 0, 2, 1, 0)],
  draw(s) {
    const r = attention(s);
    return row(
      panel(
        "Scores → normalized row",
        svg(
          r.w
            .map(
              (w, i) =>
                `<rect x="${55 + i * 100}" y="${220 - w * 170}" width="50" height="${w * 170}" rx="3" fill="var(--teal)"/>` +
                text(80 + i * 100, 246, "Key " + (i + 1), "muted", "middle") +
                text(80 + i * 100, 205 - w * 170, f(w, 3), "teal", "middle"),
            )
            .join(""),
          "Softmax weights for selected query",
        ),
      ),
      panel(
        "The weighted values",
        eq("s_j=q^\\top k_j/\\sqrt2") +
          eq(`s=(${r.scores.map((x) => f(x)).join(",")})`) +
          eq(`y=\\sum_jw_jv_j=(${r.out.map((x) => f(x)).join(",")})`),
        "Values are (1,2), (3,0), and (0,4). The weights are positive and sum to one, so the output is their weighted average.",
      ),
    );
  },
  caption:
    "For this tiny example Q and K use identity projections. In a transformer, learned matrices produce Q, K and V. A row corresponds to a query; a column corresponds to a possible source key/value.",
});
register("V3", {
  title: "Mask before the maximum and exponential",
  question:
    "Change the future token. Earlier causal outputs must stay unchanged.",
  controls: [
    range("query", "Query row", 0, 2, 1, 0),
    range("future", "Future token coordinate", -5, 5, 0.1, 1),
  ],
  draw(s) {
    const r = attention({ ...s, mask: true });
    let g = "";
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        g +=
          `<rect x="${75 + j * 70}" y="${30 + i * 70}" width="60" height="60" rx="5" fill="var(--${j <= i ? "teal" : "line"})" opacity="${i === s.query ? 1 : 0.25}"/>` +
          text(
            105 + j * 70,
            66 + i * 70,
            j <= i ? "allowed" : "−∞",
            j <= i && i === s.query ? "paper" : "ink",
            "middle",
          );
    return row(
      panel(
        "Causal attention region",
        svg(g, "Lower triangular allowed region"),
      ),
      panel(
        "Selected row",
        eq(`w=(${r.w.map((x) => f(x, 3)).join(",")})`) +
          eq(`y=(${r.out.map((x) => f(x, 3)).join(",")})`),
        "Forbidden entries become −∞ before computing the maximum. Their stabilized exponentials are exactly zero. Every row has at least its own allowed token.",
      ),
    );
  },
  caption:
    "This calculation verifies an information boundary inside attention. It does not prove that a whole training pipeline is causal if preprocessing or training-time normalization also pools future information.",
});
register("V4", {
  title: "Normalization, conditioning, and an identity path",
  question:
    "At a zero residual gate, why is the whole block initially the identity?",
  controls: [
    range("action", "Action signal", -1, 1, 0.05, 0.5),
    range("gate", "Residual gate", 0, 1, 0.02, 0),
  ],
  draw(s) {
    const x = [1, 2, 6],
      mu = 3,
      sd = Math.sqrt(14 / 3 + 1e-5),
      ln = x.map((v) => (v - mu) / sd),
      cond = ln.map((v) => (1 + 0.2 * s.action) * v + 0.3 * s.action),
      out = x.map((v, i) => v + s.gate * cond[i]);
    return row(
      panel(
        "Normalize across features",
        eq("x=(1,2,6),\\quad\\mu=3") +
          eq(`\\operatorname{LN}(x)=(${ln.map((v) => f(v)).join(",")})`),
        "The per-token mean is removed and feature variance normalized before learned gain and shift.",
      ),
      panel(
        "Condition and gate",
        eq("v=(1+\\gamma(a))\\operatorname{LN}(x)+\\beta(a)") +
          eq("y=x+g\\,v") +
          eq(`y=(${out.map((v) => f(v)).join(",")})`),
        "Here γ(a)=0.2a and β(a)=0.3a illustrate learned action-dependent parameters. At g = 0, y = x exactly.",
      ),
    );
  },
  caption:
    "This is a tiny AdaLN-style calculation, not the full attention/MLP block. AdaLN-zero initializes modulation/gating paths so residual identity behavior is explicit.",
});
register("V5", {
  title: "Heads share an input, not their projection matrices",
  question:
    "Which token collection supplies queries, and which supplies keys and values?",
  draw: () =>
    `<div class="attention-architecture">
      <section><h4>Temporal predictor · self-attention</h4><div class="attention-flow">
        <div><strong>One token sequence</strong><span>192 coordinates in and out</span></div><span aria-hidden="true">→</span>
        <div><strong>Independent Q, K, V projections</strong><span>All read the same sequence; each learns its own map</span></div><span aria-hidden="true">→</span>
        <div><strong>16 heads × 64</strong><span>1,024 internal channels</span></div><span aria-hidden="true">→</span>
        <div><strong>Output projection</strong><span>Back to width 192, not 192 ÷ 16 per head</span></div>
      </div></section>
      <section><h4>Diagnostic decoder · cross-attention</h4><div class="attention-feeds">
        <div><strong>Q · learned patch queries</strong><span>Specify output image positions</span></div>
        <div><strong>K and V · frozen representation</strong><span>Supply information to read</span></div>
      </div><p class="attention-boundary">Fit this decoder after representation learning. Its reconstruction loss does not train the main world model.</p></section>
    </div>`,
  caption:
    "Self-attention obtains Q, K and V from the same sequence. Cross-attention can obtain queries from one collection and keys/values from another. The distinction is a dataflow distinction, not an extra mystical operation.",
});
register("H1", {
  title: "What is hidden, and what supplies the target?",
  question: "Compare the prediction problem before comparing model sizes.",
  draw: () =>
    `<table class="method-comparison"><thead><tr><th scope="col">Method</th><th scope="col">Context supplied</th><th scope="col">Representation target</th><th scope="col">Training boundary</th></tr></thead><tbody>
      <tr><th scope="row">I-JEPA</th><td data-axis="Context">Visible regions of one image</td><td data-axis="Target">Masked image regions</td><td data-axis="Boundary">Moving-average target encoder; target gradients stopped</td></tr>
      <tr><th scope="row">V-JEPA</th><td data-axis="Context">Visible space–time regions of video</td><td data-axis="Target">Masked video regions</td><td data-axis="Boundary">Moving-average teacher; targets detached</td></tr>
      <tr><th scope="row">V-JEPA 2</th><td data-axis="Context">Video first; robot observations and actions later</td><td data-axis="Target">Masked video features first; action-conditioned future features later</td><td data-axis="Boundary">Video pretraining and robot post-training have distinct data and objectives</td></tr>
    </tbody></table>` +
    takeaway(
      "The key change is the prediction question: hidden image content → hidden video content → the effect of an action. V-JEPA 2's action stage is separate from its video pretraining.",
    ),
  caption:
    "These are matched summaries of the research training setups described in the surrounding sections. They are not a claim that every version, downstream stage, or adaptation uses the same graph.",
});
register("H2", {
  title: "Frozen features and joint learning are different boundaries",
  question:
    "Mark which encoder receives gradients during the world-model stage.",
  draw: () =>
    row(
      panel(
        "DINO-WM",
        eq("o\\to\\underbrace{f_{\\rm pretrained}}_{\\rm frozen}\\to z") +
          eq("z\\to g_{\\rm trainable}"),
        "Feature pretraining happened elsewhere. World-model training fits dynamics in those features.",
      ),
      panel(
        "PLDM",
        eq("o\\to f_\\theta\\to z\\to g_\\psi"),
        "Jointly learned representation and dynamics, with multiple auxiliary objective terms specified by the method.",
      ),
      panel(
        "LeJEPA → LeWM",
        eq("\\text{agreement}+\\lambda\\,\\text{SIGReg}"),
        "LeJEPA regularizes views of images. LeWM adds temporal action-conditioned prediction. Both target and context encoder paths receive gradients in the examined LeWM implementation.",
      ),
    ),
  caption:
    "An arrow here denotes information flow, not historical superiority. Distinguish a frozen encoder during dynamics training from the earlier process that trained that encoder.",
});
register("H3", {
  title: "Choose the comparison axis before choosing a winner",
  question:
    "A paper family is easier to read as a matrix of design choices than a ladder of successors.",
  draw: () =>
    `<div class="lineage-axis-map" role="group" aria-label="Three independent axes for comparing research methods">
      <section><h4>What is predicted?</h4><div class="lineage-options">
        <div><strong>Hidden image region</strong><span>I-JEPA</span></div>
        <div><strong>Hidden video content</strong><span>V-JEPA</span></div>
        <div><strong>Effect of a supplied action</strong><span>V-JEPA 2 post-training · LeWM</span></div>
      </div></section>
      <section><h4>How is representation geometry constrained?</h4><div class="lineage-options">
        <div><strong>Gaussian regularization</strong><span>LeJEPA · LeWM</span></div>
      </div></section>
      <section><h4>Does the visual encoder update with dynamics?</h4><div class="lineage-options">
        <div><strong>Frozen pretrained features</strong><span>DINO-WM</span></div>
        <div><strong>Joint representation and dynamics learning</strong><span>PLDM · LeWM</span></div>
      </div></section>
    </div>`,
  caption:
    "The generated atlas accompanies this exact comparison. Read each method’s source for stage-specific targets, gradient routing, and training data; a visual family resemblance is not equivalence.",
});
register("W1", {
  title: "The research model’s dimensions fit together",
  question: "Where does the paper’s compact notation hide a whole tensor axis?",
  draw: () =>
    `<div class="tensor-routes">
      <section><h4>Prediction route · keep batch and time</h4><ol class="tensor-flow">
        <li><strong>Observe</strong><code>B × T × 3 × 224 × 224</code><span>RGB frames</span></li>
        <li><strong>Patchify + encode</strong><code>B × T × 257 × 192</code><span>256 patches + CLS; one shared image encoder across frames</span></li>
        <li><strong>Project CLS</strong><code>B × T × d</code><span>Projector output; d = 192 in the inspected default</span></li>
        <li><strong>Predict shifted targets</strong><code>B × N × d</code><span>N shifted positions; context embeddings + actions predict them, while the shared target encoder stays trainable</span></li>
      </ol></section>
      <section><h4>SIGReg route · retain each axis until its reduction</h4><ol class="tensor-flow">
        <li><strong>Reorder</strong><code>T × B × d</code><span>Regularize each time position separately</span></li>
        <li><strong>Project</strong><code>T × B × 1,024</code><span>Multiply by d × 1,024 sampled directions</span></li>
        <li><strong>Sample frequencies</strong><code>T × B × 1,024 × 17</code><span>Seventeen frequency knots per projection</span></li>
        <li><strong>Reduce</strong><code>scalar loss</code><span>Average batch phasors before squaring; sum weighted frequencies, multiply by B, then average directions and time</span></li>
      </ol></section>
    </div>`,
  caption:
    "Dimensions refer to the pinned implementation described in this chapter. Paper prose and code defaults differ in documented details; this graph does not claim a rerun of the benchmark.",
});
register("W2", {
  title: "The paper spends actions in blocks",
  question:
    "One research planning token can represent several physical actions.",
  draw: () =>
    row(
      panel(
        "Observed context and shifted targets",
        eq(
          "(\\observed{o}_t,\\observed{o}_{t+1},\\observed{o}_{t+2})\\to(\\predicted{\\hat z}_{t+1},\\predicted{\\hat z}_{t+2},\\predicted{\\hat z}_{t+3})",
        ),
        "Four observations supply three context positions and three shifted targets in a length-four training window.",
      ),
      panel(
        "Five blocks of five actions",
        svg(
          Array.from(
            { length: 5 },
            (_, i) =>
              Array.from(
                { length: 5 },
                (_, j) =>
                  `<rect x="${20 + i * 64 + j * 10}" y="100" width="8" height="50" rx="2" fill="var(--amber)"/>`,
              ).join("") +
              text(44 + i * 64, 180, "Block " + (i + 1), "muted", "middle"),
          ).join(""),
          "Twenty-five actions grouped into five blocks",
        ),
        "The inspected PushT configuration plans five blocks and executes five blocks before replanning. The browser demonstration replans after one action.",
      ),
    ),
  caption:
    "The cadence is part of the method. Do not interpret robustness or timing without checking physical action repetition, token horizon, and the executed prefix.",
});
register("W3", {
  title: "Reported results, with the exceptions visible",
  question: "Competitive control does not mean winning on every environment.",
  draw: () =>
    row(
      panel(
        "LeWM success in the plotted v1 setting",
        svg(
          [
            ["TwoRoom", 87],
            ["Reacher", 86],
            ["PushT", 96],
            ["Cube", 74],
          ]
            .map(
              ([name, v], i) =>
                text(15, 45 + i * 57, name) +
                `<rect x="100" y="${28 + i * 57}" width="${v * 1.9}" height="25" rx="3" fill="var(--teal)"/>` +
                text(305, 46 + i * 57, v + "%", "ink", "end"),
            )
            .join("") +
            text(100, 268, "0") +
            text(290, 268, "100%", "muted", "end"),
          "Published success percentages from Figure 6",
        ),
        "Values transcribed from v1 Figure 6. Other methods do better on TwoRoom and Cube. No error bars are fabricated here.",
      ),
      panel(
        "Planning time in the reported comparison",
        number("LeWM", "0.98 s") +
          number("DINO-WM", "47 s") +
          number("Ratio", f(47 / 0.98, 1) + "×"),
        "v1 Figure 3 averages 50 runs; Appendix D specifies one NVIDIA L40S GPU for planning. This is not a browser speed guarantee.",
      ),
      panel(
        "Multiple training seeds: a separate protocol",
        "<table><thead><tr><th>Model</th><th>Push-T success, as reported</th></tr></thead><tbody><tr><td>DINO-WM</td><td>92.0 ± 1.63</td></tr><tr><td>PLDM</td><td>78.0 ± 5.0</td></tr><tr><td>LeWM</td><td>96.0 ± 2.83</td></tr></tbody></table>",
        "Table 5 uses three training seeds and the same 50 Push-T trajectories. Goals are reachable within 25 steps; the planning budget is 50. Its caption calls the reported spread “variance”; we preserve the printed ± values without reinterpreting them as confidence intervals or standard errors.",
      ),
    ),
  caption:
    "Source: LeWorldModel arXiv:2603.19312v1, Figures 3 and 6. These selected figure values are distinct from the multiple-seed appendix table and fixed-compute comparisons. Read their protocols before generalizing.",
});
register("L6", {
  title: "Keep the failed trajectories in view",
  question: "Does “reached once” agree with “still there at the end”?",
  controls: [
    choices("seed", "Recorded seed", ["17", "41", "73"], "17"),
    choices(
      "goal",
      "Trajectory to inspect",
      ["Local 1", "Local 2", "Local 3", "Distant"],
      "Local 1",
    ),
  ],
  draw(s) {
    const run = recorded.find((r) => String(r.seed) === s.seed);
    const goalLabels = [
      "Local goal 1",
      "Local goal 2",
      "Local goal 3",
      "Distant stress goal",
    ];
    const selected = Math.max(
      0,
      ["Local 1", "Local 2", "Local 3", "Distant"].indexOf(s.goal),
    );
    const current = run.controls[selected];
    const localTop =
      1.12 *
      Math.max(
        0.15,
        ...run.controls.slice(0, 3).flatMap((r) => [r.initial, ...r.errors]),
      );
    const final = current.errors.at(-1);
    const minimum = Math.min(...current.errors);
    const status = (r) =>
      r.errors.at(-1) < 0.15
        ? ["Within goal at end", "within"]
        : r.errors.some((x) => x < 0.15)
          ? ["Reached, then left", "left"]
          : ["Did not reach", "missed"];
    return (
      `<div class="trajectory-overview" aria-label="Outcomes for all four goals">${run.controls
        .map((r, i) => {
          const [label, kind] = status(r);
          return `<div class="trajectory-summary ${kind}${i === selected ? " selected" : ""}"><strong>${goalLabels[i]}</strong><span>${label}</span><small>Final ${f(r.errors.at(-1), 3)} rad</small></div>`;
        })
        .join("")}</div>` +
      row(
        panel(
          goalLabels[selected] +
            (selected === 3 ? " · independent scale" : " · shared local scale"),
          plot({
            xmin: 0,
            xmax: 40,
            ymin: 0,
            ymax:
              selected === 3
                ? Math.max(0.2, current.initial, ...current.errors) * 1.12
                : localTop,
            height: 250,
            ticks: 4,
            curves: [
              {
                data: [
                  [0, current.initial],
                  ...current.errors.map((x, j) => [j + 1, x]),
                ],
                color: selected === 3 ? "rose" : "teal",
              },
              { fn: () => 0.15, color: "amber" },
            ],
            xlabel: "action",
            ylabel: "RMS error · rad",
          }),
        ),
      ) +
      results(
        ["Lowest error", f(minimum, 3) + " rad"],
        ["Final error", f(final, 3) + " rad"],
        ["Outcome", status(current)[0]],
      ) +
      takeaway(
        "All four outcomes stay visible above. Choose a goal to inspect its complete trajectory. Local goals share one vertical scale; the distant stress goal has its own labeled scale. Amber marks the same 0.15-radian tolerance.",
      )
    );
  },
  caption:
    "Recorded 64 × 64 WebGPU measurements: 5,000 updates per seed, 40 executed actions per goal, circular joint RMS threshold 0.15 rad. Source: research/edition2/verification.json. These plots do not update when you train a new live model.",
});
register("K1", {
  title: "Label the information boundary yourself",
  question:
    "Which quantities train the model? Which are evaluation-only labels? Reveal after making your assignment.",
  controls: [choices("answer", "Worked answer", ["Hidden", "Reveal"])],
  draw: (s) =>
    cards(
      s.answer === "Hidden"
        ? [
            ["Camera frames", "Training input or evaluation label?"],
            [
              "Motor actions",
              "Fixed data or optimized variable? In which stage?",
            ],
            ["Joint angles", "Main training target or diagnostic label?"],
            [
              "Goal image",
              "Representation target or planning objective input?",
            ],
          ]
        : [
            [
              "Camera frames",
              "Training inputs; encoded targets remain differentiable.",
            ],
            [
              "Motor actions",
              "Fixed observations during training; candidate variables during planning.",
            ],
            [
              "Joint angles",
              "Simulator state; used for physical evaluation and a separate drawing readout, not the main learning loss.",
            ],
            [
              "Goal image",
              "Encoded using the frozen encoder during planning. Candidate terminal embeddings are compared with this goal.",
            ],
          ],
    ),
  caption:
    "The worked answer describes this book’s experiment. A different world-model system can use different supervision; state the boundary before making a claim about learning from pixels.",
});
register("K2", {
  title: "An experiment report starts at update zero",
  question:
    "Record what has actually run, including the failures. Leave unmeasured claims blank.",
  draw: () =>
    '<div id="capstone-live-card" class="visual-card"><strong>No live measurements yet</strong>The laboratory prepares real random weights when you visit it. This card will then show its seed, update count, spread, prediction ratio and observed control outcomes.</div><p><a href="#world-lab">Open the experiment</a></p><button type="button" id="capstone-export">Save the current report</button>',
  caption:
    "The report uses your actual live state. The exported JSON contains measurements and configuration, not a restorable model checkpoint. Historical reference runs remain separately labeled.",
});
register("X1", {
  title: "One role, one color",
  question:
    "Use a symbol’s defined role, not its letter alone, to read the mathematics.",
  draw: () =>
    `<div class="notation-example">${eq("\\lat_t=f_\\theta(\\obs_t)")}${eq("\\pred_{t+1}=g_\\psi(\\lat_t,\\act_t)")}${eq("\\loss=\\|\\pred_{t+1}-\\lat_{t+1}\\|^2+\\lambda\\reg(\\Z)")}</div>
    <div class="notation-legend" role="group" aria-label="Semantic color roles in the equations">
      <div class="notation-entry observation"><strong>Observation</strong>${tex("\\obs")}</div>
      <div class="notation-entry representation"><strong>Representation</strong>${tex("\\lat,\\quad\\Z")}</div>
      <div class="notation-entry prediction"><strong>Prediction</strong>${tex("\\pred")}</div>
      <div class="notation-entry action"><strong>Action</strong>${tex("\\act")}</div>
      <div class="notation-entry objective"><strong>Error / objective</strong>${tex("\\loss,\\quad\\reg,\\quad\\disc")}</div>
      <div class="notation-entry analytical"><strong>Analytical tools</strong>${tex("\\uvec,\\quad\\freq,\\quad\\cf")}<small>Muted local palette</small></div>
    </div>`,
  caption:
    "Operators, dimensions, indices and unassigned mathematical parameters remain neutral. Color supplements the defined symbols and labels; it never replaces them.",
});
register("X2", {
  title: "Trace each paper equation back to its tools",
  question:
    "When a research equation feels opaque, return to the operation it compresses.",
  draw: () =>
    cards([
      [
        "Equation 1 · Prediction",
        '<a href="#jepa">Shared targets and squared error</a> → <a href="#visual-I1">tensor shapes</a>',
      ],
      [
        "Equations 2, 3, 6 · SIGReg",
        '<a href="#visual-G4">projection</a> → <a href="#visual-S1">characteristic function</a> → <a href="#visual-S5">quadrature</a> → <a href="#visual-S7">gradient</a>',
      ],
      [
        "Equations 4, 5 · Planning",
        '<a href="#visual-A1">fixed model, variable actions</a> → <a href="#visual-A2">CEM</a> → <a href="#visual-A4">execution cadence</a>',
      ],
      [
        "Equations 7, 8 · Baselines",
        '<a href="#lineage">frozen versus jointly learned features</a> → <a href="#reference-4">axis-correct auxiliary losses</a>',
      ],
      [
        "Equation 9 · Straightness",
        '<a href="#visual-G4">dot products and angles</a> → <a href="#visual-E7">temporal displacement geometry</a>',
      ],
    ]),
  caption:
    "The chapter coverage table gives the detailed source mapping. This map supplies navigable prerequisite paths rather than treating the numbered equations as independent facts.",
});
