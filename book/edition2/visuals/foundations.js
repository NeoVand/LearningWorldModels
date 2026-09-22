import { descentSpec, jacobianSpec, neuronSpec } from "./experiments.js";
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
  takeaway,
  results,
} from "./core.js";
import { cloud, covariance, rng, normal } from "../numerics.js";
import { cdf } from "../normality.js";
const eq = (s) => `<div class="visual-equation">${tex(s, true)}</div>`;
const cards = (items) =>
  '<div class="visual-steps">' +
  items
    .map(([a, b]) => `<div class="visual-card"><strong>${a}</strong>${b}</div>`)
    .join("") +
  "</div>";
const matrix = (a) =>
  tex(
    "\\begin{pmatrix}" +
      a
        .map((r) =>
          r.map((x) => (typeof x === "number" ? f(x, 2) : x)).join("&"),
        )
        .join("\\\\") +
      "\\end{pmatrix}",
    true,
  );
register("O3", {
  title: "A route through the prerequisites",
  question:
    "Follow the dependencies forward; return to a linked lesson whenever a later equation uses an unfamiliar idea.",
  draw() {
    const stages = [
      [
        "Observe",
        "Why learn from images, and how can we describe them?",
        [
          ["Self-supervision", "philosophy"],
          ["Vectors", "geometry"],
          ["Probability", "probability"],
        ],
      ],
      [
        "Measure",
        "Ask which distinctions survive and how changes propagate.",
        [
          ["Clouds", "clouds"],
          ["Calculus", "calculus"],
        ],
      ],
      [
        "Learn",
        "Build a predictor, then find its collapse loophole.",
        [
          ["Networks", "learning"],
          ["JEPA", "jepa"],
        ],
      ],
      [
        "Regularize",
        "Test a cloud and derive a penalty that keeps variation.",
        [
          ["Normality", "testing"],
          ["SIGReg", "sigreg"],
        ],
      ],
      [
        "Act",
        "Train on the arm; plan through imagined consequences.",
        [
          ["Laboratory", "laboratory"],
          ["Planning", "planning"],
          ["Evaluation", "evaluation"],
        ],
      ],
      [
        "Read",
        "Use the research bridges to audit the complete paper.",
        [
          ["Theory", "theory"],
          ["Transformers", "transformers"],
          ["Lineage", "lineage"],
          ["LeWorldModel", "paper"],
        ],
      ],
    ];
    return `<div class="prereq-route" role="navigation" aria-label="Prerequisite route to LeWorldModel"><ol>${stages
      .map(
        ([title, reason, links], i) =>
          `<li><span class="route-index">${String(i + 1).padStart(2, "0")}</span><strong>${title}</strong><div><p>${reason}</p><span class="route-links">${links.map(([name, chapter]) => `<a href="#${chapter}">${name}</a>`).join('<span aria-hidden="true"> · </span>')}</span></div></li>`,
      )
      .join("")}</ol></div>`;
  },
  caption:
    "The sequence is a learning path through the mathematics and working model. The theory and transformer chapters come after the small experiment so their assumptions and architecture have something concrete to explain.",
});
register("G1", {
  title: "Four pixels, two coordinates",
  question: "The bright pixels swap sides. Can row sums tell the images apart?",
  draw() {
    const grids = [
      { x: 61, label: "Image A", values: [1, 0, 0, 1] },
      { x: 219, label: "Image B", values: [0, 1, 1, 0] },
    ];
    const picture =
      grids
        .map(
          ({ x, label, values }) =>
            text(x + 40, 19, label, "ink", "middle") +
            values
              .map((value, i) => {
                const px = x + (i % 2) * 42;
                const py = 30 + Math.floor(i / 2) * 42;
                return (
                  `<rect x="${px}" y="${py}" width="39" height="39" rx="3" fill="var(--${value ? "blue" : "surface"})" stroke="var(--line)"/>` +
                  text(
                    px + 19.5,
                    py + 25,
                    value,
                    value ? "paper" : "ink",
                    "middle",
                  )
                );
              })
              .join(""),
        )
        .join("") +
      line(101, 119, 159, 155, "teal") +
      line(259, 119, 201, 155, "teal") +
      `<rect x="111" y="153" width="138" height="37" rx="18.5" fill="var(--surface)" stroke="var(--teal)"/>` +
      text(180, 176, "same two numbers", "teal", "middle");
    return `<div style="max-width:430px;margin:0 auto">${panel(
      "Two different images, one code",
      svg(
        picture,
        "Image A has bright pixels at upper left and lower right. Image B has bright pixels at upper right and lower left. Their row-sum encoder gives the same two numbers.",
        360,
        200,
      ) + eq("f(\\obs_A)=f(\\obs_B)=(1,1)^\\top"),
    )}</div>`;
  },
  caption:
    "The row-major lists are (1, 0, 0, 1) and (0, 1, 1, 0), so flattening keeps the difference. Each row sums to one in both images. The encoder discards the left–right arrangement, and its two-number output cannot recover it.",
});
const matrices = {
  Identity: [
    [1, 0],
    [0, 1],
  ],
  Rotate: [
    [0.707, -0.707],
    [0.707, 0.707],
  ],
  Shear: [
    [1, 0.8],
    [0, 1],
  ],
  Scale: [
    [1.5, 0],
    [0, 0.5],
  ],
  "Rank one": [
    [1, 0.5],
    [0, 0],
  ],
  Zero: [
    [0, 0],
    [0, 0],
  ],
};
function grid(A) {
  const m = ([x, y]) => [
    180 + 45 * (A[0][0] * x + A[0][1] * y),
    140 - 45 * (A[1][0] * x + A[1][1] * y),
  ];
  let s = "";
  for (let i = -2; i <= 2; i++)
    s +=
      path([m([i, -2]), m([i, 2])], "plot-line", 1) +
      path([m([-2, i]), m([2, i])], "plot-line", 1);
  s += path(
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ].map(m),
    "violet",
    3,
  );
  s +=
    path([m([0, 0]), m([1, 0])], "blue", 4) +
    path([m([0, 0]), m([0, 1])], "amber", 4);
  return svg(s, "Transformed grid with equal screen units");
}
register("G2", {
  title: "A matrix moves every point by the same rule",
  question:
    "Track the blue and amber basis vectors. Their destinations are the matrix columns.",
  controls: [choices("map", "Map", Object.keys(matrices).slice(0, 5))],
  draw: (s) =>
    row(
      panel("Original grid", grid(matrices.Identity)),
      panel(s.map, grid(matrices[s.map]), matrix(matrices[s.map])),
    ),
  caption:
    "Every grid intersection is calculated by matrix multiplication. Blue is the first basis vector; amber is the second. In the rank-one case the square has no area.",
});
register("G3", {
  title: "The order changes the shape",
  question: "Which index is summed away, and which pair names one output cell?",
  draw() {
    const products = [
      ["x_1=1", "1\\cdot3=3", "1\\cdot4=4"],
      ["x_2=2", "2\\cdot3=6", "2\\cdot4=8"],
    ];
    const table =
      `<table style="width:100%;table-layout:fixed;text-align:center"><thead><tr><th>${tex("x_i y_j")}</th><th>${tex("y_1=3")}</th><th>${tex("y_2=4")}</th></tr></thead><tbody>` +
      products
        .map(
          (row) =>
            `<tr><th>${tex(row[0])}</th><td>${tex(row[1])}</td><td>${tex(row[2])}</td></tr>`,
        )
        .join("") +
      `</tbody></table>`;
    return row(
      panel(
        "Dot product · one sum",
        eq("x^\\top y=1\\cdot3+2\\cdot4=11") +
          eq("(1\\times2)(2\\times1)=(1\\times1)"),
        "Matching positions contribute to one total. The inner index is summed over.",
      ),
      panel(
        "Outer product · every pair",
        table + eq("xy^\\top=\\begin{pmatrix}3&4\\\\6&8\\end{pmatrix}"),
        "The row chooses an x coordinate; the column chooses a y coordinate. No index is summed away.",
      ),
    );
  },
  caption:
    "The same vectors x = (1, 2)ᵀ and y = (3, 4)ᵀ give either one number or a 2 × 2 table. The product order decides whether matching pairs are summed or every pair is retained. Write shapes before multiplying.",
});
register("G4", {
  title: "A shadow with a sign",
  question:
    "Rotate the measuring direction until the projection is negative. What does the sign mean?",
  controls: [
    range("x", "Horizontal coordinate", -2.8, 2.8, 0.05, 1.6),
    range("y", "Vertical coordinate", -2.8, 2.8, 0.05, 2),
    range("angle", "Direction angle", -3.14, 3.14, 0.01, 0.6),
  ],
  draw(s) {
    const u = [Math.cos(s.angle), Math.sin(s.angle)],
      h = s.x * u[0] + s.y * u[1],
      p = [h * u[0], h * u[1]],
      M = ([x, y]) => [180 + 38 * x, 140 - 38 * y],
      o = M([0, 0]),
      v = M([s.x, s.y]),
      q = M(p);
    return row(
      panel(
        "Vector, projection and residual",
        svg(
          line(...M(u.map((x) => -3 * x)), ...M(u.map((x) => 3 * x)), "amber") +
            path([o, v], "blue", 2) +
            path([o, q], "violet", 4) +
            line(...q, ...v, "rose", "4 4") +
            dot(...v, 5, "blue") +
            dot(...q, 5, "violet"),
          "Projection with perpendicular residual",
        ),
      ),
      panel(
        "One distance decomposes",
        eq(`h=u^\\top x=${f(h)}`) +
          eq(`\\|x\\|^2=${f(s.x * s.x + s.y * s.y)}`) +
          eq(
            `h^2+\\|x-hu\\|^2=${f(h * h)}+${f(s.x * s.x + s.y * s.y - h * h)}`,
          ),
        "Negative means opposite to the chosen direction. It does not mean a negative length.",
      ),
    );
  },
  caption:
    "The dashed residual is perpendicular to the amber line. The squared lengths add by Pythagoras. Controls are keyboard-accessible alternatives to dragging.",
});
register("G5", {
  title: "A square, a line, a point",
  question: "Which input changes become invisible?",
  draw: () =>
    row(
      ...["Identity", "Rank one", "Zero"].map((k, i) =>
        panel(
          ["Rank 2", "Rank 1", "Rank 0"][i],
          grid(matrices[k]),
          [
            "Both independent directions survive.",
            "The vector (−0.5, 1) maps to zero. Every line parallel to it shares an output.",
            "Every input difference maps to zero. Nothing about the input survives.",
          ][i],
        ),
      ),
    ),
  caption:
    "Rank counts independent output directions. A nonzero null-space vector gives a concrete pair of distinct inputs with the same output.",
});
register("B1", {
  title: "Height is not probability",
  question:
    "Narrow the density. Its peak rises above one while its total area stays one.",
  controls: [
    range("sigma", "Standard deviation", 0.15, 1.5, 0.01, 0.35),
    range("bound", "Right boundary", -1, 2, 0.02, 0.4),
  ],
  draw(s) {
    let area = cdf(s.bound / s.sigma) - cdf(-1 / s.sigma),
      density = (x) =>
        Math.exp(-0.5 * (x / s.sigma) ** 2) /
        (s.sigma * Math.sqrt(2 * Math.PI));
    return (
      row(
        panel(
          "Discrete mass",
          plot({
            height: 230,
            ticks: 2,
            xmin: 0,
            xmax: 4,
            ymin: 0,
            ymax: 1,
            points: [
              [1, 0.2, "blue", 7],
              [2, 0.5, "blue", 7],
              [3, 0.3, "blue", 7],
            ],
            xlabel: "outcome",
            ylabel: "probability",
          }),
          "The three masses add to one.",
        ),
        panel(
          "Continuous density",
          plot({
            height: 230,
            xmin: -2,
            xmax: 2,
            ymin: 0,
            ymax: 3,
            xTicks: [-2, -1, 0, 1, 2],
            yTicks: [0, 1, 2, 3],
            snapDomain: false,
            curves: [
              { fn: density, color: "violet" },
              { fn: () => 1, color: "muted" },
              {
                data: Array.from({ length: 60 }, (_, i) => {
                  const x = -1 + ((s.bound + 1) * i) / 59;
                  return [x, density(x)];
                }),
                color: "amber",
                area: true,
              },
            ],
            ylabel: "density",
          }),
          "The gray line marks density 1. The shaded area, rather than peak height, is a probability.",
        ),
        panel(
          "Accumulated area",
          plot({
            height: 230,
            ticks: 2,
            xmin: -2,
            xmax: 2,
            ymin: 0,
            ymax: 1,
            curves: [{ fn: (x) => cdf(x / s.sigma) }],
            points: [[s.bound, cdf(s.bound / s.sigma), "amber", 5]],
            ylabel: "CDF",
          }),
          "Subtract two CDF values to recover the shaded probability.",
        ),
      ).replace(
        'style="--panel-count:',
        'style="grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));--panel-count:',
      ) +
      results(
        ["Density at the peak", f(density(0), 3)],
        [`Probability from −1 to ${f(s.bound)}`, f(area, 3)],
        ["Total probability", "1.000"],
      ) +
      takeaway(
        "A density can exceed 1. A probability cannot: it is the area over an interval, or the mass at a discrete outcome.",
      )
    );
  },
  caption:
    "For a continuous variable an exact point has probability zero. Probability comes from area under a density, whereas discrete mass is assigned directly to an outcome.",
});
register("B2", {
  title: "A mean that stays put while spread changes",
  question:
    "Move equal probability toward the two outer outcomes. Why does the balance point stay at zero?",
  controls: [
    range("mass", "Total outer probability", 0, 1, 0.01, 0.5),
    range("distance", "Outer distance", 0.1, 3, 0.05, 2),
  ],
  draw(s) {
    const p = [s.mass / 2, 1 - s.mass, s.mass / 2],
      x = [-s.distance, 0, s.distance];
    return (
      row(
        panel(
          "Probability as weight",
          svg(
            line(30, 190, 330, 190) +
              x
                .map(
                  (a, i) =>
                    `<rect x="${168 + a * 42}" y="${190 - 150 * p[i]}" width="24" height="${150 * p[i]}" rx="3" fill="var(--blue)"/>` +
                    text(180 + a * 42, 220, f(a), "ink", "middle") +
                    text(
                      180 + a * 42,
                      175 - 150 * p[i],
                      f(p[i]),
                      "blue",
                      "middle",
                    ),
                )
                .join("") +
              `<path class="mean-marker" d="M180 192L174 202H186Z" fill="var(--teal)"/>`,
            "Symmetric probability weights balanced at zero",
          ),
        ),
        panel(
          "Variance grows with distance",
          plot({
            xmin: 0,
            xmax: 3,
            ymin: 0,
            ymax: 9.5,
            height: 230,
            ticks: 2,
            curves: [{ fn: (d) => s.mass * d * d, color: "violet" }],
            points: [
              [s.distance, s.mass * s.distance * s.distance, "amber", 5],
            ],
            xlabel: "outer distance",
            ylabel: "variance",
          }),
        ),
      ) +
      results(
        ["Mean", "0.00"],
        ["Variance", f(s.mass * s.distance * s.distance)],
      ) +
      `<div class="visual-formula-row">${tex(`\\mathbb E[X]=${f(p[0])}(-${f(s.distance)})+${f(p[2])}(${f(s.distance)})=0`)}${tex(`\\operatorname{Var}(X)=${f(s.mass)}\\cdot${f(s.distance)}^2`)}</div>` +
      takeaway(
        "Equal masses on opposite sides cancel in the mean. Their squared distances add: doubling the distance multiplies the variance by four.",
      )
    );
  },
  caption:
    "Equal weights at opposite positions cancel in the mean. They add in the variance because both squared deviations are positive.",
});
register("B3", {
  title: "A positive report filters the population",
  question:
    "The event is rare among all 100 cases. How does its share change after a positive report?",
  controls: [choices("filter", "Show", ["All 100", "Positive reports"])],
  draw(s) {
    const filtered = s.filter === "Positive reports";
    let marks = "";
    if (filtered) {
      marks += text(36, 48, "8 real events", "blue");
      for (let i = 0; i < 8; i++) marks += dot(55 + i * 35, 88, 8, "blue");
      marks += text(36, 143, "18 false alarms", "amber");
      for (let i = 0; i < 18; i++)
        marks += dot(
          46 + (i % 9) * 34,
          177 + Math.floor(i / 9) * 36,
          8,
          "amber",
        );
    } else {
      for (let i = 0; i < 100; i++) {
        const event = i < 10;
        const positive = i < 8 || (i >= 10 && i < 28);
        const cx = 42 + (i % 10) * 30;
        const cy = 14 + Math.floor(i / 10) * 26;
        marks += dot(cx, cy, 6, event ? "blue" : "amber");
        if (positive)
          marks += `<circle cx="${cx}" cy="${cy}" r="9" fill="none" stroke="var(--teal)"/>`;
      }
    }
    return (
      row(
        panel(
          filtered
            ? "Only the 26 positive reports"
            : "All 100 equally likely cases",
          svg(
            marks,
            filtered
              ? "The twenty-six positive reports, rearranged into eight real events and eighteen false alarms"
              : "One hundred cases, ten real events, and twenty-six ringed positive reports",
          ),
        ),
        panel(
          filtered ? "Conditional chance" : "Chance before the report",
          filtered
            ? eq("P(E\\mid +)=\\frac{8}{8+18}=\\frac{8}{26}\\approx0.308")
            : eq("P(E)=\\frac{10}{100}=0.10"),
        ),
      ) +
      results(
        ["Cases in view", filtered ? "26" : "100"],
        ["Real events in view", filtered ? "8" : "10"],
        ["Event share", filtered ? "30.8%" : "10.0%"],
      ) +
      takeaway(
        filtered
          ? "Conditioning keeps only cases with a positive report. The denominator is 26, and eight of those cases contain the event."
          : "Blue dots contain the event; teal rings mark a positive report. Select Positive reports to remove cases that do not match what the sensor said.",
      )
    );
  },
  caption:
    "The sensor reports positive in eight of ten event cases and eighteen of ninety non-event cases. A positive report therefore raises the event probability from 10/100 to 8/26. Count the filtered cases first; Bayes’ rule expresses that same calculation algebraically.",
});
register("B4", {
  title: "The least-squares answer can be an impossible future",
  question:
    "Two outcomes occur at −1 and +1. Where does expected squared error put its prediction?",
  controls: [
    range("p", "Probability of +1", 0, 1, 0.01, 0.5),
    range("guess", "Proposed prediction", -1.5, 1.5, 0.01, 0),
  ],
  draw(s) {
    const mu = 2 * s.p - 1,
      L = (x) => (1 - s.p) * (x + 1) ** 2 + s.p * (x - 1) ** 2;
    return (
      row(
        panel(
          "Possible outcomes",
          plot({
            xmin: -1.5,
            xmax: 1.5,
            ymin: 0,
            ymax: 1,
            points: [
              [-1, 1 - s.p, "blue", 8],
              [1, s.p, "blue", 8],
              [mu, 0, "teal", 6],
            ],
            xlabel: "outcome",
            ylabel: "mass",
          }),
        ),
        panel(
          "Expected loss",
          plot({
            xmin: -1.5,
            xmax: 1.5,
            ymin: 0,
            ymax: 6.5,
            curves: [{ fn: L, color: "rose" }],
            points: [
              [s.guess, L(s.guess), "amber", 5],
              [mu, L(mu), "teal", 6],
            ],
            xlabel: "prediction",
            ylabel: "expected squared error",
          }),
        ),
      ) +
      results(
        ["Best prediction", f(mu)],
        ["Your expected loss", f(L(s.guess))],
        ["Lowest possible loss", f(L(mu))],
      ) +
      takeaway(
        s.p === 0.5
          ? "The best prediction is zero, even though only −1 and +1 can occur."
          : "The squared-error optimum follows the mean, not necessarily a possible outcome.",
      )
    );
  },
  caption:
    "At equal probabilities the minimizer is zero, even though zero never occurs. This is a property of squared error, not a defective optimizer.",
});
register("B5", {
  title: "A one-dimensional integral becomes an area",
  question: "Why does squaring the Gaussian integral make it easier?",
  draw: () =>
    row(
      panel(
        "Circular symmetry",
        svg(
          Array.from(
            { length: 10 },
            (_, i) =>
              `<circle cx="180" cy="140" r="${12 + i * 12}" fill="none" stroke="var(--violet)" stroke-width="8" opacity="${Math.exp(-(i * i) / 30)}"/>`,
          ).join("") +
            line(180, 140, 300, 140, "amber") +
            text(235, 127, "radius r", "amber"),
          "Concentric annuli weighted by radial density",
        ),
      ),
      panel(
        "Count a thin annulus",
        eq("I^2=\\int_{\\mathbb R^2}e^{-(x^2+y^2)/2}\\,dx\\,dy") +
          eq("=\\int_0^\\infty e^{-r^2/2}\,2\\pi r\,dr=2\\pi") +
          eq("I=\\sqrt{2\\pi}"),
        "The annulus area is approximately circumference × thickness. Set t = r²/2, so dt = r dr. The positive square root gives the normalizing constant.",
      ),
    ),
  caption:
    "Annuli explain the change to polar coordinates. For a shifted, scaled Gaussian, substituting y = (x − μ)/σ supplies the additional factor σ.",
});
register("B6", {
  title: "Uncorrelated does not mean independent",
  question: "Select a narrow range of x. Does it tell you something about y?",
  controls: [
    choices("kind", "Distribution", [
      "Independent",
      "Parabola",
      "Crossing lines",
    ]),
    range("slice", "Slice center", -1.5, 1.5, 0.05, 0.7),
  ],
  draw(s) {
    const r = rng(12),
      pts = Array.from({ length: 240 }, () => {
        const x = normal(r),
          v = normal(r);
        return [
          x,
          s.kind === "Independent"
            ? v
            : s.kind === "Parabola"
              ? (x * x - 1) / Math.sqrt(2)
              : r() < 0.5
                ? x
                : -x,
        ];
      }),
      selected = pts.filter((p) => Math.abs(p[0] - s.slice) < 0.25);
    return row(
      panel(
        "Joint sample",
        scatter(
          pts.map((p) => [
            ...p,
            Math.abs(p[0] - s.slice) < 0.25 ? "amber" : "violet",
          ]),
        ),
        "Amber points lie in the selected vertical slice.",
      ),
      panel(
        "Conditional slice",
        scatter(selected.map((p) => [0, p[1], "amber"])),
        `${selected.length} points. Zero population covariance in all three constructions; only the independent construction factors into independent coordinates.`,
      ),
    );
  },
  caption:
    "In the parabola, knowing x determines y. In crossing lines, knowing |x| determines |y|. Symmetry makes their covariance zero but does not remove dependence.",
});
register("B7", {
  title: "What is being repeated?",
  question:
    "More trials narrow the uncertainty of one success rate. How many independent models are in the right-hand example?",
  controls: [range("n", "Trials per experiment", 10, 210, 10, 50)],
  draw(s) {
    const r = rng(17),
      rates = Array.from(
        { length: 120 },
        () =>
          Array.from({ length: s.n }, () => (r() < 0.7 ? 1 : 0)).reduce(
            (a, b) => a + b,
          ) / s.n,
      );
    const se = Math.sqrt(0.21 / s.n);
    const low = Math.min(...rates, 0.7 - 2 * se);
    const high = Math.max(...rates, 0.7 + 2 * se);
    const pad = Math.max(0.025, (high - low) * 0.1);
    const ymin = Math.floor((low - pad) * 20) / 20;
    const ymax = Math.ceil((high + pad) * 20) / 20;
    const tickStep = ymax - ymin > 0.5 ? 0.2 : ymax - ymin > 0.25 ? 0.1 : 0.05;
    const yTicks = Array.from(
      { length: Math.floor(1 / tickStep) + 1 },
      (_, i) => Number((i * tickStep).toFixed(2)),
    ).filter((v) => v >= ymin && v <= ymax);
    const models = [
      [1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1],
      [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
    ];
    const modelRows = models
      .map((outcomes, i) => {
        const y = 69 + i * 59;
        return (
          `<rect x="28" y="${y - 22}" width="304" height="44" rx="5" fill="var(--surface)" stroke="var(--line)"/>` +
          text(48, y + 4, String.fromCharCode(65 + i), "ink", "middle") +
          outcomes
            .map((success, j) =>
              success
                ? dot(82 + j * 17, y, 5.3, "blue")
                : `<circle cx="${82 + j * 17}" cy="${y}" r="5.3" fill="var(--surface)" stroke="var(--muted)"/>`,
            )
            .join("") +
          text(
            320,
            y + 4,
            `${outcomes.reduce((sum, x) => sum + x, 0)}/12`,
            "ink",
            "end",
          )
        );
      })
      .join("");
    const chart = plot({
      xmin: -2,
      xmax: 122,
      ymin,
      ymax,
      xTicks: [0, 30, 60, 90, 120],
      yTicks,
      snapDomain: false,
      curves: [{ fn: () => 0.7, color: "amber" }],
      points: rates.map((v, i) => [i + 1, v, "blue", 2.4]),
      xlabel: "independent repeat",
      ylabel: "success fraction",
    });
    const hierarchy = svg(
      text(29, 29, "One model per row · 12 tasks each", "muted") +
        modelRows +
        line(28, 224, 332, 224) +
        text(180, 253, "3 retrainings · 36 task outcomes", "teal", "middle"),
      "Three separate trained models, labeled A, B, C, are each evaluated on twelve tasks. Colored circles indicate illustrative successes and open circles failures. There are three retrainings, not thirty-six.",
      360,
      280,
    );
    return (
      `<div class="visual-panels" data-panels="2" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));--panel-count:2;--graphic-count:2">` +
      panel("120 independent experiments", chart) +
      panel("Tasks nested within models", hierarchy) +
      `</div>` +
      takeaway(
        `At ${s.n} trials, one sample rate has standard error ${f(se, 3)} when the true success probability is 0.7. The right side has only <strong>3 independent model trainings</strong>, regardless of its 36 task outcomes.`,
      )
    );
  },
  caption:
    "The left plot is a Bernoulli simulation with true success probability 0.7. Its vertical scale follows the simulated rates, so small fluctuations remain visible at large trial counts. The right diagram is schematic, not a measurement of the book’s models. Tasks tested on one learned model share its training history; variation across retrainings has three units here, not 36.",
});
register("C1", {
  title: "Covariance is an average of signed products",
  question:
    "Move one point. Watch its centered products alter the whole covariance matrix.",
  controls: [
    range("x", "Fourth point x", -2, 2, 0.05, 1.5),
    range("y", "Fourth point y", -2, 2, 0.05, 1),
  ],
  draw(s) {
    const pts = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [s.x, s.y],
      ],
      m = [0, 1].map((j) => pts.reduce((a, p) => a + p[j] / 4, 0)),
      centered = pts.map((p) => p.map((v, j) => v - m[j])),
      C = [
        [0, 0],
        [0, 0],
      ];
    centered.forEach((p) =>
      p.forEach((a, i) => p.forEach((b, j) => (C[i][j] += (a * b) / 4))),
    );
    return row(
      panel(
        "Centered points",
        scatter(centered),
        `Mean before centering (${f(m[0])}, ${f(m[1])}).`,
      ),
      panel(
        "Signed contributions",
        `<table><thead><tr><th>Point</th><th>Δx Δy</th></tr></thead><tbody>${centered.map((p, i) => `<tr><td>${i + 1}</td><td>${f(p[0] * p[1])}</td></tr>`).join("")}</tbody></table>` +
          matrix(C),
        "This display uses the population-style divisor B = 4, matching the moment operation. An unbiased sample estimator uses B − 1.",
      ),
    );
  },
  caption:
    "Points with matching deviation signs contribute positively to the off-diagonal entry. Opposite signs contribute negatively. Centering changes when any point moves.",
});
register("C2", {
  title: "The last centered row is already determined",
  question:
    "Place three centered vectors head to tail. Why must the path close?",
  draw() {
    const marker = (role) =>
      `<marker id="c2-${role}" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="var(--${role})"/></marker>`;
    const arrow = (d, role) =>
      `<path d="${d}" fill="none" stroke="var(--${role})" stroke-width="2.4" marker-end="url(#c2-${role})"/>`;
    const triangle = svg(
      `<defs>${["blue", "amber", "violet"].map(marker).join("")}</defs>` +
        arrow("M180 90L105 165", "blue") +
        arrow("M105 165L180 165", "amber") +
        arrow("M180 165L180 90", "violet") +
        dot(180, 90, 4, "ink") +
        formula(45, 109, 66, "\\tilde x_1") +
        formula(111, 183, 76, "\\tilde x_2") +
        formula(189, 119, 76, "\\tilde x_3") +
        text(188, 78, "start = finish", "muted"),
      "Three centered row vectors translated head to tail: the blue vector goes down and left, the amber vector goes right, and the violet vector returns to the starting point. Their sum is zero.",
      360,
      240,
    );
    return (
      row(
        panel("Three centered rows form a closed path", triangle),
        panel(
          "The dependency comes from the mean",
          eq("\\sum_{b=1}^{B}(x_b-\\bar x)=\\sum_bx_b-B\\bar x=0") +
            eq("\\tilde x_B=-\\sum_{b=1}^{B-1}\\tilde x_b"),
        ),
      ) +
      takeaway(
        `Only B − 1 centered rows can be independent. ${tex("\\operatorname{rank}(\\tilde X)\\leq\\min(d,B-1)")}`,
      )
    );
  },
  caption:
    "In the picture the three rows are (−1, −1), (1, 0), and (0, 1). Translating vectors to join their ends does not change them. With two centered rows the second is simply the negative of the first. In any batch the final centered row is fixed by the others; this finite-sample rank limit is not evidence that the population collapsed.",
});
register("C3", {
  title: "Whitening changes scale along principal directions",
  question: "Follow the same points through rotation and rescaling.",
  controls: [
    choices("stage", "Stage", ["Original", "Rotate", "Rescale", "Rotate back"]),
  ],
  draw(s) {
    const base = cloud("gaussian", 160, 8),
      a = 0.65,
      c = Math.cos(a),
      t = Math.sin(a),
      rot = (p) => [c * p[0] - t * p[1], t * p[0] + c * p[1]],
      elong = base.map((p) => [1.7 * p[0], 0.5 * p[1]]),
      pts =
        s.stage === "Original"
          ? elong.map(rot)
          : s.stage === "Rotate"
            ? elong
            : s.stage === "Rescale"
              ? base
              : base.map(rot);
    return row(
      panel(s.stage, scatter(pts)),
      panel(
        "The same transformation in symbols",
        eq("C=Q\\Lambda Q^\\top") +
          eq("x\\mapsto Q^\\top x\\mapsto\\Lambda^{-1/2}Q^\\top x"),
        "The long direction is divided by its standard deviation. The short direction is expanded. Rotating back gives a symmetric whitening map. Sample covariance is only approximately identity for this finite random batch.",
      ),
    );
  },
  caption:
    "An ellipse summarizes second moments. It is not a hard boundary containing every point. Whitening needs nonzero eigenvalues or an explicitly regularized inverse.",
});
register("C4", {
  title: "Identity covariance does not specify a shape",
  question:
    "All three populations have mean zero and covariance I. Which measuring direction exposes a difference?",
  controls: [
    choices(
      "shape",
      "Population",
      ["Gaussian", "Ring", "Crossing lines"],
      "Crossing lines",
    ),
    choices(
      "direction",
      "Projection",
      ["Horizontal", "Diagonal", "Vertical"],
      "Horizontal",
    ),
  ],
  draw(s) {
    const kinds = {
      Gaussian: "gaussian",
      Ring: "ring",
      "Crossing lines": "lines",
    };
    const roles = {
      Gaussian: "blue",
      Ring: "violet",
      "Crossing lines": "teal",
    };
    const angles = {
      Horizontal: 0,
      Diagonal: Math.PI / 4,
      Vertical: Math.PI / 2,
    };
    const angle = angles[s.direction];
    const pts = cloud(kinds[s.shape], 240, 7);
    const projected = pts
      .map(([x, y]) => x * Math.cos(angle) + y * Math.sin(angle))
      .sort((a, b) => a - b);
    const steps = [[-3.5, 0]];
    projected.forEach((value, i) => {
      steps.push(
        [value, i / projected.length],
        [value, (i + 1) / projected.length],
      );
    });
    steps.push([3.5, 1]);
    const atZero = projected.filter((value) => Math.abs(value) < 1e-10).length;
    const interpretation =
      s.shape === "Crossing lines" && s.direction === "Diagonal"
        ? `On the diagonal, ${atZero} of 240 sampled points project to exactly zero. The step in the teal curve cannot come from a Gaussian.`
        : s.shape === "Crossing lines"
          ? "Along this axis the crossing-line cloud has a Gaussian projection. Choose Diagonal to reveal what this one view misses."
          : s.shape === "Ring"
            ? "Every point lies on a circle of radius √2. Its projection stays within ±√2, unlike an unbounded Gaussian."
            : "A Gaussian cloud has a Gaussian projection in every direction. Its finite-sample staircase stays near the smooth reference.";
    return (
      row(
        panel(
          s.shape + " · amber measuring line",
          scatter(
            pts.map((point) => [...point, roles[s.shape]]),
            { angle },
          ),
        ),
        panel(
          "Projection compared with a Gaussian",
          plot({
            xmin: -3.5,
            xmax: 3.5,
            ymin: 0,
            ymax: 1,
            xTicks: [-3, -2, -1, 0, 1, 2, 3],
            yTicks: [0, 0.25, 0.5, 0.75, 1],
            snapDomain: false,
            curves: [
              { fn: cdf, color: "muted" },
              { data: steps, color: roles[s.shape] },
            ],
            xlabel: "projected value",
            ylabel: "fraction ≤ value",
          }) +
            `<div class="c4-key"><span style="--key-color:var(--${roles[s.shape]})">${s.shape} sample</span><span style="--key-color:var(--muted)">Gaussian reference</span></div>`,
        ),
      ) +
      results(
        ["Population covariance", "I"],
        ["Sample points exactly at 0", `${atZero} / 240`],
      ) +
      takeaway(interpretation)
    );
  },
  caption:
    "The colored staircase counts 240 sampled projections; the gray curve is the standard Gaussian CDF. The stated moments hold for the populations, while finite samples fluctuate. One Gaussian-looking projection cannot certify the full cloud. SIGReg will check many directions.",
});
register("D1", {
  title: "Shrink the step; keep the ratio",
  question:
    "The rise becomes tiny. Why does rise divided by run approach a nonzero number?",
  controls: [
    range("x", "Base point", -0.9, 1.5, 0.01, 0.6),
    range("h", "Positive step h", 0.01, 1, 0.01, 0.5),
  ],
  draw(s) {
    const m = 2 * s.x + s.h;
    return row(
      panel(
        "Secant and tangent",
        plot({
          xmin: -1,
          xmax: 2,
          ymin: -1,
          ymax: 4,
          curves: [
            { fn: (x) => x * x, color: "blue" },
            { fn: (x) => s.x * s.x + m * (x - s.x), color: "amber" },
            { fn: (x) => s.x * s.x + 2 * s.x * (x - s.x), color: "teal" },
          ],
          points: [
            [s.x, s.x * s.x, "blue", 5],
            [s.x + s.h, (s.x + s.h) ** 2, "amber", 5],
          ],
        }),
      ),
      panel(
        "The exact quotient",
        eq(`\\frac{(x+h)^2-x^2}{h}=2x+h=${f(m)}`) +
          eq(`f'(x)=2x=${f(2 * s.x)}`),
        "Amber is the finite secant. Teal is the limiting tangent. The discarded contribution to the rise is h², and to the quotient it is h.",
      ),
    );
  },
  caption:
    "The derivative is a limit of ratios, not division by a zero step. We only evaluate the finite difference at positive h.",
});
register("D2", descentSpec);

register("D3", {
  title: "Multiply along paths; add across paths",
  question:
    "The same input reaches the loss twice. What happens if you forget the direct path?",
  controls: [
    range("x", "Input x", -0.8, 1, 0.02, 0.4),
    range("bias", "Bias b", -1, 1, 0.02, 0.3),
  ],
  draw(s) {
    const u = 2 * s.x + s.bias,
      y = u * u + s.x,
      loss = 0.5 * (y - 1) ** 2;
    const node = (x, top, width, math) =>
      `<rect x="${x}" y="${top}" width="${width}" height="42" rx="5" fill="var(--surface)" stroke="var(--line)"/>` +
      `<foreignObject x="${x}" y="${top}" width="${width}" height="42"><div xmlns="http://www.w3.org/1999/xhtml" style="height:100%;display:grid;place-items:center;color:var(--ink);font-size:13px">${tex(math)}</div></foreignObject>`;
    const arrow = (d, role = "teal") =>
      `<path d="${d}" fill="none" stroke="var(--${role})" stroke-width="1.6" stroke-linejoin="round" marker-end="url(#d3-${role})"/>`;
    const graph = svg(
      `<defs><marker id="d3-teal" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="var(--teal)"/></marker><marker id="d3-amber" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="var(--amber)"/></marker></defs>` +
        arrow("M70 46L120 73") +
        arrow("M70 130L120 88") +
        arrow("M212 76L226 130") +
        arrow("M70 130H90V177H207L226 148", "amber") +
        arrow("M286 156V204") +
        node(20, 25, 50, "b") +
        node(20, 109, 50, "x") +
        node(120, 55, 92, "u=2x+b") +
        node(226, 114, 124, "y=u^2+x") +
        node(226, 204, 124, "L=\\tfrac12(y-1)^2") +
        text(111, 196, "direct path: +x", "amber"),
      "Computation graph. Both b and x feed u equals 2x plus b. The value u is squared on its way to y; x also reaches y directly along the amber bypass. Then y feeds the loss.",
      360,
      255,
    );
    return (
      row(
        panel("One input, two routes to y", graph),
        panel(
          "Trace the gradient backward",
          eq(`\\frac{dy}{dx}=(2u)(2)+1=${f(4 * u + 1)}`) +
            eq(`\\frac{dL}{dx}=(y-1)(4u+1)=${f((y - 1) * (4 * u + 1))}`),
        ),
      ) +
      results(["u", f(u)], ["y", f(y)], ["Loss", f(loss)]) +
      takeaway(
        "The amber bypass contributes the +1. Leaving it out changes the gradient even when the forward values look correct.",
      )
    );
  },
  caption:
    "Read the graph forward to compute values, then backward to accumulate sensitivities. The chain rule multiplies local effects; shared paths require addition.",
});
register("D4", jacobianSpec);

register("D5", {
  title: "A local approximation has a neighborhood",
  question: "How far from the base point would you trust each approximation?",
  controls: [range("radius", "Neighborhood radius", 0.1, 2, 0.05, 1)],
  draw(s) {
    return row(
      panel(
        "Exponential and its approximations",
        plot({
          xmin: -s.radius,
          xmax: s.radius,
          ymin: -1,
          ymax: 8,
          curves: [
            { fn: Math.exp, color: "blue" },
            { fn: () => 1, color: "amber" },
            { fn: (x) => 1 + x, color: "violet" },
            { fn: (x) => 1 + x + (x * x) / 2, color: "teal" },
          ],
          ylabel: "value",
        }),
      ),
      panel(
        "At the right endpoint",
        eq("e^h\\approx1+h+\\tfrac12h^2") +
          number("Linear error", f(Math.exp(s.radius) - 1 - s.radius, 5)) +
          number(
            "Quadratic error",
            f(Math.exp(s.radius) - 1 - s.radius - (s.radius * s.radius) / 2, 5),
          ),
        "The second-order remainder is of order h³ near zero. That local statement does not give small error for arbitrary h.",
      ),
    );
  },
  caption:
    "Blue is the exact exponential, amber the constant, violet the tangent, and teal the quadratic. The endpoint errors are computed from the same formulas.",
});
register("D6", {
  title: "Variance as a function of direction",
  question:
    "Rotate the direction. How does the local tangent reveal a peak or trough?",
  controls: [range("angle", "Direction · radians", 0, 6.28, 0.01, 0.7)],
  draw(s) {
    const v = (a) => 3 * Math.cos(a) ** 2 + Math.sin(a) ** 2;
    const dv = (a) => -2 * Math.sin(2 * a);
    const cx = 180 + 75 * Math.cos(s.angle),
      cy = 125 - 75 * Math.sin(s.angle);
    const span = Math.PI / 6;
    const trend =
      Math.abs(dv(s.angle)) < 0.08
        ? "nearly flat"
        : dv(s.angle) > 0
          ? "rising"
          : "falling";
    return (
      row(
        panel(
          "Projected variance and its tangent",
          plot({
            xmin: -0.15,
            xmax: 2 * Math.PI + 0.15,
            xTicks: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 2 * Math.PI],
            xTickFormat: (x) =>
              ["0", "π/2", "π", "3π/2", "2π"][Math.round(x / (Math.PI / 2))],
            ymin: 0.7,
            ymax: 3.3,
            yTicks: [1, 2, 3],
            snapDomain: false,
            curves: [
              { fn: v, color: "violet" },
              {
                data: [
                  [s.angle - span, v(s.angle) - dv(s.angle) * span],
                  [s.angle + span, v(s.angle) + dv(s.angle) * span],
                ],
                color: "teal",
              },
            ],
            points: [[s.angle, v(s.angle), "amber", 5]],
            xlabel: "angle α · radians",
            ylabel: "variance",
            height: 240,
          }),
        ),
        panel(
          "One direction in the cloud",
          svg(
            `<ellipse cx="180" cy="125" rx="104" ry="60" fill="none" stroke="var(--violet)"/><circle cx="180" cy="125" r="75" fill="none" stroke="var(--plot-line)"/>` +
              line(180, 125, cx, cy, "amber") +
              dot(cx, cy, 4, "amber") +
              line(
                cx + 30 * Math.sin(s.angle),
                cy + 30 * Math.cos(s.angle),
                cx - 30 * Math.sin(s.angle),
                cy - 30 * Math.cos(s.angle),
                "teal",
              ) +
              text(180, 27, "spread along each direction", "violet", "middle") +
              text(180, 225, "directions have unit length", "muted", "middle"),
            "Covariance ellipse, unit direction and its tangent",
            360,
            240,
          ),
        ),
      ) +
      results(
        ["Variance at this direction", f(v(s.angle))],
        ["Change per radian", f(dv(s.angle))],
      ) +
      `<div class="visual-formula-row">${tex("u^\\top Cu=3\\cos^2\\alpha+\\sin^2\\alpha")}${tex("\\frac{d}{d\\alpha}u^\\top Cu=-2\\sin(2\\alpha)")}</div>` +
      takeaway(
        `The teal tangent is ${trend} here. It is flat at both a peak (variance 3 along the horizontal axis) and a trough (variance 1 along the vertical axis); slope zero alone cannot tell which one.`,
      )
    );
  },
  caption:
    "Here C = diag(3, 1). The amber direction and teal tangent share the same angle in both panels. The violet ellipse has semiaxes in the ratio √3:1. The preceding text proves that a maximum is attained and leads to an eigenvector.",
});
export const activations = {
  Linear: { fn: (x) => x, df: () => 1, tex: "x" },
  ReLU: {
    fn: (x) => Math.max(0, x),
    df: (x) => (x > 0 ? 1 : 0),
    tex: "\\max(0,x)",
  },
  tanh: { fn: Math.tanh, df: (x) => 1 - Math.tanh(x) ** 2, tex: "\\tanh x" },
  GELU: {
    fn: (x) => x * cdf(x),
    df: (x) => cdf(x) + (x * Math.exp((-x * x) / 2)) / Math.sqrt(2 * Math.PI),
    tex: "x\\Phi(x)",
  },
  SiLU: {
    fn: (x) => x / (1 + Math.exp(-x)),
    df: (x) => {
      let p = 1 / (1 + Math.exp(-x));
      return p + x * p * (1 - p);
    },
    tex: "x/(1+e^{-x})",
  },
};
register("N1", neuronSpec);

register("N2", {
  title: "Activation and local sensitivity",
  question:
    "Compare an activation with its derivative on the same axes. Where does the slope nearly vanish?",
  controls: [
    choices("kind", "Activation", Object.keys(activations), "tanh"),
    range("probe", "Input x", -3, 3, 0.02, 1),
  ],
  draw(s) {
    const a = activations[s.kind];
    const interpretation = {
      Linear:
        "The slope stays at 1. Stacking linear maps without a nonlinear activation still gives a linear map.",
      ReLU: "The negative half is flat; positive inputs pass with slope 1. At zero the mathematical derivative does not exist.",
      tanh: "At large positive or negative inputs, the output approaches ±1 and the slope approaches 0.",
      GELU: "The smooth gate attenuates negative inputs and approaches the identity for large positive inputs.",
      SiLU: "The sigmoid gate gives a small negative dip and approaches the identity for large positive inputs.",
    }[s.kind];
    return (
      `<div style="max-width:410px;margin:0 auto">${panel(
        `${s.kind} · output and slope`,
        plot({
          xmin: -4,
          xmax: 4,
          ymin: -4.3,
          ymax: 4.3,
          height: 240,
          xTicks: [-4, -2, 0, 2, 4],
          yTicks: [-4, -2, 0, 2, 4],
          snapDomain: false,
          curves: [
            { fn: a.fn, color: "teal" },
            { fn: a.df, color: "rose" },
          ],
          points: [[s.probe, a.fn(s.probe), "amber", 5]],
          xlabel: "input x",
          ylabel: "value / slope",
        }),
      )}</div>` +
      `<div class="visual-formula-row">${tex(`\\sigma(x)=${a.tex}`)}</div>` +
      results(
        [`Output at x = ${f(s.probe)}`, f(a.fn(s.probe))],
        [
          "Local slope",
          s.kind === "ReLU" && s.probe === 0 ? "undefined" : f(a.df(s.probe)),
        ],
      ) +
      takeaway(interpretation)
    );
  },
  caption:
    "Teal is the activation, rose its derivative, and amber the selected input and output. The axes stay fixed across choices. At ReLU’s kink, the rose plot shows the conventional value 0 although the mathematical derivative is undefined. GELU uses the exact xΦ(x), not a tanh approximation.",
});
