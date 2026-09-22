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
  title: "Three questions that keep returning",
  question:
    "Each mathematical tool earns its place by answering a question about this experiment.",
  draw: () =>
    cards([
      [
        "Seeing",
        "What did the image keep?<br>Vectors → projections → probability",
      ],
      [
        "Learning",
        "What distinguishes a useful representation?<br>Covariance → gradients → collapse → SIGReg",
      ],
      [
        "Acting",
        "Can its predictions guide a choice?<br>Rollouts → planning → physical evaluation",
      ],
    ]),
  caption:
    "The later transformer and theory chapters revisit this same chain at research scale.",
});
register("G1", {
  title: "Four pixels, two coordinates",
  question: "Swap the bright pixels. Does this encoder notice?",
  controls: [
    choices("image", "Image", ["Diagonal", "Other diagonal"]),
    range("pixel", "Inspect flattened entry", 1, 4, 1, 1),
  ],
  draw(s) {
    const a = s.image === "Diagonal" ? [1, 0, 0, 1] : [0, 1, 1, 0];
    return row(
      panel(
        "Image → row-major list",
        svg(
          a
            .map(
              (v, i) =>
                `<rect x="${75 + (i % 2) * 100}" y="${35 + Math.floor(i / 2) * 100}" width="88" height="88" rx="5" fill="var(--${v ? "blue" : "surface"})" stroke="var(--${i === s.pixel - 1 ? "amber" : "line"})" stroke-width="3"/>` +
                text(
                  119 + (i % 2) * 100,
                  84 + Math.floor(i / 2) * 100,
                  `${v} · entry ${i + 1}`,
                  v ? "paper" : "ink",
                  "middle",
                ),
            )
            .join(""),
          "Two by two image with highlighted flattened entry",
        ),
      ),
      panel(
        "Flattening preserves; encoding loses",
        eq(`\\obs=(${a.join(",")})^\\top`) +
          eq(
            `f(\\obs)=\\begin{pmatrix}o_1+o_2\\\\o_3+o_4\\end{pmatrix}=\\begin{pmatrix}1\\\\1\\end{pmatrix}`,
          ),
        "Both images have the same row sums. The list is invertible given its shape; this encoder is not.",
      ),
    );
  },
  caption:
    "An embedding is a representation, not a promise that all distinctions survive. Here the lost distinction is the left–right arrangement inside a row.",
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
  question:
    "Why does one multiplication give a number and another give four numbers?",
  controls: [range("entry", "Outer-product entry", 1, 4, 1, 1)],
  draw(s) {
    const a = [
        [3, 4],
        [6, 8],
      ],
      i = Math.floor((s.entry - 1) / 2),
      j = (s.entry - 1) % 2;
    return row(
      panel(
        "A row times a column",
        eq(
          "\\begin{pmatrix}1&2\\end{pmatrix}\\begin{pmatrix}3\\\\4\\end{pmatrix}=1\\cdot3+2\\cdot4=11",
        ),
        "The shared axis is summed away: (1 × 2)(2 × 1) → (1 × 1).",
      ),
      panel(
        "A column times a row",
        matrix(
          a.map((r, ri) =>
            r.map((v, cj) =>
              ri === i && cj === j ? "\\htmlClass{math-act}{" + v + "}" : v,
            ),
          ),
        ) +
          eq(
            `(xy^\\top)_{${i + 1},${j + 1}}=${[1, 2][i]}\\cdot${[3, 4][j]}=${a[i][j]}`,
          ),
        "No sum over two coordinates here: (2 × 1)(1 × 2) → (2 × 2).",
      ),
    );
  },
  caption:
    "The highlighted entry uses its row’s coordinate from the left factor and its column’s coordinate from the right factor. Always write the shapes before multiplying.",
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
    return row(
      panel(
        "Discrete mass",
        plot({
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
        "Masses 0.2 + 0.5 + 0.3 = 1. Each number is a probability.",
      ),
      panel(
        "Continuous density",
        plot({
          xmin: -2,
          xmax: 2,
          ymin: 0,
          ymax: 3,
          curves: [
            { fn: density, color: "violet" },
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
        `For ordered interval endpoints, area from −1 to ${f(s.bound)} is ${f(area, 3)}.`,
      ),
      panel(
        "Accumulated area",
        plot({
          xmin: -2,
          xmax: 2,
          ymin: 0,
          ymax: 1,
          curves: [{ fn: (x) => cdf(x / s.sigma) }],
          points: [[s.bound, cdf(s.bound / s.sigma), "amber", 5]],
          ylabel: "CDF",
        }),
        "The CDF is always between 0 and 1. Subtract two CDF values for interval probability.",
      ),
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
    return row(
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
            `<path d="M180 190L165 250H195Z" fill="var(--teal)"/>`,
          "Symmetric probability weights balanced at zero",
        ),
      ),
      panel(
        "Weighted contributions",
        eq(
          `\\mathbb E[X]=${f(p[0])}(-${f(s.distance)})+${f(p[2])}(${f(s.distance)})=0`,
        ) +
          eq(
            `\\operatorname{Var}(X)=${f(s.mass)}\\cdot ${f(s.distance)}^2=${f(s.mass * s.distance * s.distance)}`,
          ),
        "The center stays fixed; the average squared distance from it changes.",
      ),
    );
  },
  caption:
    "Equal weights at opposite positions cancel in the mean. They add in the variance because both squared deviations are positive.",
});
register("B3", {
  title: "A positive report filters the population",
  question: "Among the 26 positive reports, how many describe a real event?",
  controls: [choices("filter", "Show", ["All 100", "Positive reports"])],
  draw(s) {
    let g = "";
    for (let i = 0; i < 100; i++) {
      const event = i < 10,
        positive = i < 8 || (i >= 10 && i < 28),
        visible = s.filter === "All 100" || positive;
      g += dot(
        42 + (i % 10) * 30,
        14 + Math.floor(i / 10) * 26,
        6,
        event ? "blue" : "amber",
        visible ? 1 : 0.08,
      );
      if (positive && visible)
        g += `<circle cx="${42 + (i % 10) * 30}" cy="${14 + Math.floor(i / 10) * 26}" r="9" fill="none" stroke="var(--teal)"/>`;
    }
    return row(
      panel(
        "100 equally likely states",
        svg(
          g,
          "Ten real events, eight true positives and eighteen false positives",
        ),
        "Blue: real event. Amber: no event. Teal ring: positive report.",
      ),
      panel(
        "Condition on the report",
        eq("P(E\\mid +)=\\frac{8}{8+18}=\\frac{4}{13}\\approx0.308"),
        "The denominator is the filtered population, not the original 100. A sensitive sensor can still produce many false positives when the event is uncommon.",
      ),
    );
  },
  caption:
    "Count first, then recognize Bayes’ rule. For an event indicator, this conditional probability is also its conditional expectation.",
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
    return row(
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
          ymax: 6,
          curves: [{ fn: L, color: "rose" }],
          points: [
            [s.guess, L(s.guess), "amber", 5],
            [mu, L(mu), "teal", 6],
          ],
          xlabel: "prediction",
          ylabel: "expected squared error",
        }),
        `Optimal prediction ${f(mu)}. Proposed loss ${f(L(s.guess))}; minimum ${f(L(mu))}.`,
      ),
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
    "Repeated test cases under one shared model seed are not the same as independent model trainings.",
  controls: [
    range("n", "Trials per experiment", 10, 200, 10, 50),
    range("seed", "Resampling seed", 1, 50, 1, 17),
  ],
  draw(s) {
    const r = rng(s.seed),
      rates = Array.from(
        { length: 120 },
        () =>
          Array.from({ length: s.n }, () => (r() < 0.7 ? 1 : 0)).reduce(
            (a, b) => a + b,
          ) / s.n,
      );
    return row(
      panel(
        "Independent Bernoulli experiments",
        plot({
          xmin: 0,
          xmax: 120,
          ymin: 0,
          ymax: 1,
          points: rates.map((v, i) => [i, v, "blue"]),
          xlabel: "independent repeat",
          ylabel: "success fraction",
        }),
        `True p = 0.7. Standard error √(0.7·0.3/${s.n}) = ${f(Math.sqrt(0.21 / s.n), 3)}.`,
      ),
      panel(
        "Shared training seed",
        cards([
          ["Seed A", "One learned model → many task outcomes"],
          ["Seed B", "A second learned model → many task outcomes"],
          [
            "Correct unit",
            "Keep model-level variability visible; do not count dependent tasks as independent retrainings.",
          ],
        ]),
      ),
    );
  },
  caption:
    "This is a Bernoulli simulation, not an estimate of the book model’s success rate. Its purpose is to identify the unit of repetition before quoting uncertainty.",
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
  question: "If the centered rows sum to zero, can all B rows be independent?",
  draw: () =>
    row(
      panel(
        "Two points",
        scatter([
          [-1, -0.7],
          [1, 0.7],
        ]),
        eq("x_2-\\bar x=-(x_1-\\bar x)") + "Only one independent direction.",
      ),
      panel(
        "Three points",
        scatter([
          [-1, -1],
          [1, 0],
          [0, 1],
        ]),
        eq("\\tilde x_3=-\\tilde x_1-\\tilde x_2") +
          "At most two independent directions.",
      ),
      panel(
        "General batch",
        eq("\\sum_{b=1}^B\\tilde x_b=0") +
          eq("\\operatorname{rank}(\\tilde X)\\leq\\min(d,B-1)"),
        "The final row is fixed once the others are known. More coordinates cannot remove this dependency.",
      ),
    ),
  caption:
    "A small batch cannot exhibit full-rank sample covariance in a feature space larger than B − 1. This is a finite-sample constraint, not evidence that the population is collapsed.",
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
    "All three populations have zero mean and identity covariance. Which one is Gaussian?",
  controls: [range("seed", "Sample seed", 1, 40, 1, 7)],
  draw: (s) =>
    row(
      ...["gaussian", "ring", "lines"].map((k) =>
        panel(
          k === "lines" ? "Crossing lines" : k[0].toUpperCase() + k.slice(1),
          scatter(cloud(k, 220, s.seed)),
          "Population covariance I; finite samples fluctuate.",
        ),
      ),
    ),
  caption:
    "The ring has fixed radius. Crossing lines concentrate all mass on two lines. Neither becomes Gaussian merely because its first two moments match those of a Gaussian.",
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
register("D2", {
  title: "Two knobs, one downhill direction",
  question:
    "Increase the step size. Does a step opposite the gradient always lower the loss?",
  controls: [
    range("x", "First parameter", -2, 2, 0.05, 1.4),
    range("y", "Second parameter", -2, 2, 0.05, 0.8),
    range("eta", "Learning rate", 0, 1, 0.01, 0.15),
  ],
  draw(s) {
    const grad = [2 * s.x, 8 * s.y],
      next = [s.x - s.eta * grad[0], s.y - s.eta * grad[1]],
      loss = (x, y) => x * x + 4 * y * y;
    let contour = "";
    for (let k = 1; k <= 7; k++)
      contour += `<ellipse cx="180" cy="140" rx="${18 * k}" ry="${9 * k}" fill="none" stroke="var(--line)"/>`;
    return row(
      panel(
        "Contours and one update",
        svg(
          contour +
            path(
              [
                [180 + 45 * s.x, 140 - 45 * s.y],
                [180 + 45 * next[0], 140 - 45 * next[1]],
              ],
              "teal",
              3,
            ) +
            dot(180 + 45 * s.x, 140 - 45 * s.y, 5, "blue"),
          "Elliptic contours and a gradient update",
        ),
      ),
      panel(
        "The two coordinate slices",
        eq("L(x,y)=x^2+4y^2") +
          eq(`\\nabla L=(${f(grad[0])},${f(grad[1])})^\\top`) +
          number(
            "Loss before → after",
            `${f(loss(s.x, s.y))} → ${f(loss(...next))}`,
          ),
        "The y direction has four times the curvature. A large step overshoots even though the initial direction is downhill.",
      ),
    );
  },
  caption:
    "This explicit quadratic is an illustration. The gradient combines two partial derivatives; curvature determines which finite step sizes remain safe.",
});
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
      y = u * u + s.x;
    return row(
      panel(
        "Forward values",
        cards([
          ["Scale and offset", tex(`u=2x+b=${f(u)}`)],
          ["Two paths", tex(`y=u^2+x=${f(y)}`)],
          [
            "Squared target error",
            tex(`L=\\tfrac12(y-1)^2=${f(0.5 * (y - 1) ** 2)}`),
          ],
        ]),
      ),
      panel(
        "Backward sensitivities",
        eq(`\\frac{dy}{dx}=2u\\cdot2+1=${f(4 * u + 1)}`) +
          eq(`\\frac{dL}{dx}=(y-1)(4u+1)=${f((y - 1) * (4 * u + 1))}`),
        "The +1 comes from the direct x → y path. The two contributions add because both paths change when x changes.",
      ),
    );
  },
  caption:
    "Read the graph forward to compute values, then backward to accumulate sensitivities. The chain rule multiplies local effects; shared paths require addition.",
});
function localGrid(s, J) {
  const M = ([x, y]) => [180 + 100 * x, 140 - 100 * y],
    transform = (a, b) => [
      (s.x + a) ** 2 + s.y + b - s.x * s.x - s.y,
      (s.x + a) * (s.y + b) - s.x * s.y,
    ];
  let body = line(20, 140, 340, 140) + line(180, 10, 180, 270);
  for (const v of [-0.2, -0.1, 0, 0.1, 0.2])
    for (const axis of [0, 1]) {
      const inputs = Array.from({ length: 25 }, (_, i) =>
        axis ? [v, -0.2 + i / 60] : [-0.2 + i / 60, v],
      );
      body +=
        path(
          inputs.map(([a, b]) => M(transform(a, b))),
          "blue",
        ) +
        path(
          inputs.map(([a, b]) =>
            M([J[0][0] * a + J[0][1] * b, J[1][0] * a + J[1][1] * b]),
          ),
          "teal",
          1,
        );
    }
  return svg(
    body,
    "True nonlinear image and Jacobian approximation of the same local input grid",
  );
}
register("D4", {
  title: "Each Jacobian column answers one perturbation",
  question:
    "Change only one input coordinate. Compare the true output displacement with its linear approximation.",
  controls: [
    range("x", "Base x", -0.8, 1.5, 0.02, 0.8),
    range("y", "Base y", -0.8, 1.5, 0.02, 0.6),
    range("h", "Perturbation", -0.5, 0.5, 0.01, 0.1),
    choices("axis", "Change", ["x", "y"]),
  ],
  draw(s) {
    const J = [
        [2 * s.x, 1],
        [s.y, s.x],
      ],
      dx = s.axis === "x" ? s.h : 0,
      dy = s.axis === "y" ? s.h : 0,
      actual = [
        (s.x + dx) ** 2 + s.y + dy - s.x * s.x - s.y,
        (s.x + dx) * (s.y + dy) - s.x * s.y,
      ],
      pred = [2 * s.x * dx + dy, s.y * dx + s.x * dy];
    return row(
      panel(
        "Function and local table",
        eq("f(x,y)=(x^2+y,xy)^\\top") +
          matrix(
            J.map((r) =>
              r.map((v, i) =>
                i === (s.axis === "x" ? 0 : 1)
                  ? "\\htmlClass{math-act}{" + f(v, 2) + "}"
                  : v,
              ),
            ),
          ),
      ),
      panel(
        "Displacements",
        plot({
          xmin: -1.5,
          xmax: 1.5,
          ymin: -1.5,
          ymax: 1.5,
          points: [
            [...actual, "blue", 6],
            [...pred, "teal", 4],
          ],
          xlabel: "first output change",
          ylabel: "second output change",
        }),
        `Actual (${actual.map((x) => f(x, 3)).join(", ")}); linear (${pred.map((x) => f(x, 3)).join(", ")}).`,
      ),
      panel(
        "A small grid near the base point",
        localGrid(s, J),
        "Blue curves are the true output of a 0.4 × 0.4 input grid. Teal lines are its Jacobian image, centered at the same output. Equal units on both axes.",
      ),
    );
  },
  caption:
    "A Jacobian is a table of partial derivatives. Its first column predicts changes caused by the first input alone. The linearization error shrinks with the perturbation.",
});
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
    "A full turn covers every unit direction. Where is projected variance stationary?",
  controls: [range("angle", "Direction", 0, 6.28, 0.01, 0.7)],
  draw(s) {
    const v = (a) => 3 * Math.cos(a) ** 2 + Math.sin(a) ** 2;
    return row(
      panel(
        "Projected variance",
        plot({
          xmin: 0,
          xmax: 6.28,
          ymin: 0,
          ymax: 3.5,
          curves: [{ fn: v, color: "violet" }],
          points: [[s.angle, v(s.angle), "amber", 5]],
          xlabel: "angle in radians",
          ylabel: "uᵀCu",
        }),
      ),
      panel(
        "The extremum and existence",
        eq("u^\\top Cu=3\\cos^2\\alpha+\\sin^2\\alpha") +
          eq("\\frac{d}{d\\alpha}u^\\top Cu=-2\\sin(2\\alpha)") +
          number("Tangential derivative", f(-2 * Math.sin(2 * s.angle))),
        "The circle is closed and bounded; the variance is continuous. Nested boxes can select a convergent subsequence from any maximizing sequence, so a maximum is attained. At its stationary direction, the tangential change vanishes.",
      ),
      panel(
        "Direction and tangent",
        svg(
          `<ellipse cx="180" cy="140" rx="104" ry="60" fill="none" stroke="var(--violet)"/><circle cx="180" cy="140" r="75" fill="none" stroke="var(--plot-line)"/>` +
            line(
              180,
              140,
              180 + 75 * Math.cos(s.angle),
              140 - 75 * Math.sin(s.angle),
              "amber",
            ) +
            line(
              180 + 75 * Math.cos(s.angle) + 30 * Math.sin(s.angle),
              140 - 75 * Math.sin(s.angle) + 30 * Math.cos(s.angle),
              180 + 75 * Math.cos(s.angle) - 30 * Math.sin(s.angle),
              140 - 75 * Math.sin(s.angle) - 30 * Math.cos(s.angle),
              "teal",
            ),
          "Covariance ellipse, unit direction and its tangent",
        ),
        "The violet ellipse has semiaxes proportional to square-root variance. The amber direction stays on the unit circle; the teal tangent is a legal first-order change.",
      ),
      panel(
        "Why a limit remains available",
        svg(
          [160, 80, 40, 20, 10]
            .map(
              (w, i) =>
                `<rect x="${180 - w / 2}" y="${140 - w / 2}" width="${w}" height="${w}" fill="none" stroke="var(--violet)" opacity="${0.3 + i * 0.15}"/>`,
            )
            .join("") + dot(180, 140, 3, "amber"),
          "Schematic nested boxes converging to a point",
        ),
        "Repeatedly keep a closed sub-box containing infinitely many terms of the bounded sequence. Their diameters shrink to zero. The inset illustrates that construction, not these particular iterates.",
      ),
    );
  },
  caption:
    "Here C = diag(3, 1). The maximum is 3 along the first coordinate axis. The existence argument in the text explains why a maximizing direction exists before identifying it as an eigenvector.",
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
register("N1", {
  title: "A neuron is a circuit and a curve",
  question:
    "Weight changes the input scale; bias shifts the transition; amplitude changes the output scale.",
  controls: [
    range("w", "Weight w", -4, 4, 0.05, 2),
    range("b", "Bias b", -2, 2, 0.05, 0),
    range("v", "Amplitude v", -2, 2, 0.05, 1),
    range("probe", "Input probe", -2, 2, 0.02, 0.4),
    choices("activation", "Activation", Object.keys(activations), "tanh"),
  ],
  draw(s) {
    const a = activations[s.activation],
      z = s.w * s.probe + s.b,
      y = s.v * a.fn(z);
    return row(
      panel(
        "Follow the signal",
        svg(
          line(50, 65, 160, 140, "blue") +
            line(50, 215, 160, 140, "violet") +
            line(180, 140, 280, 140, "teal") +
            [
              [50, 65, "x"],
              [50, 215, "1"],
              [170, 140, "Σ"],
              [285, 140, "σ"],
            ]
              .map(
                ([x, y, t]) =>
                  `<circle cx="${x}" cy="${y}" r="23" fill="var(--surface)" stroke="var(--line)"/>` +
                  (t === "σ"
                    ? path(
                        Array.from({ length: 41 }, (_, i) => {
                          const q = -2 + i * 0.1;
                          return [
                            x + q * 8,
                            y - 8 * Math.max(-2, Math.min(2, a.fn(q))),
                          ];
                        }),
                        "teal",
                        1.5,
                      ) + text(x, y + 43, "σ", "teal", "middle")
                    : text(x, y + 4, t, "ink", "middle")),
              )
              .join("") +
            formula(67, 20, 105, `w=${f(s.w)}`) +
            formula(67, 215, 105, `b=${f(s.b)}`) +
            formula(185, 78, 145, `wx+b=${f(z)}`) +
            formula(182, 190, 165, `y=v\\sigma(wx+b)`),
          "Neuron circuit with rim-trimmed edges",
        ),
        `Input ${f(s.probe)} → preactivation ${f(z)} → activation ${f(a.fn(z))} → output ${f(y)}.`,
      ),
      panel(
        "The whole neuron",
        plot({
          xmin: -2,
          xmax: 2,
          ymin: -3,
          ymax: 3,
          curves: [{ fn: (x) => s.v * a.fn(s.w * x + s.b), color: "teal" }],
          points: [[s.probe, y, "amber", 5]],
          ylabel: "output",
        }),
      ),
    );
  },
  caption:
    "Adapted from Jaxverse’s circuit-and-curve demonstration. GELU uses xΦ(x), with a numerically evaluated normal CDF; ReLU has no ordinary derivative at zero.",
});
register("N2", {
  title: "Activation and local sensitivity",
  question:
    "Find a saturated region. A large input change there can produce only a small output change.",
  controls: [range("probe", "Common probe", -3, 3, 0.02, 1)],
  draw: (s) =>
    row(
      ...Object.entries(activations).map(([name, a]) =>
        panel(
          name,
          plot({
            xmin: -4,
            xmax: 4,
            ymin: -1.6,
            ymax: 2.4,
            curves: [
              { fn: a.fn, color: "teal" },
              { fn: a.df, color: "rose" },
            ],
            points: [[s.probe, a.fn(s.probe), "amber", 5]],
          }),
          tex(a.tex) +
            ` · value ${f(a.fn(s.probe))}; derivative ${name === "ReLU" && s.probe === 0 ? "undefined at zero" : f(a.df(s.probe))}.`,
        ),
      ),
    ),
  caption:
    "Identical axes make shapes comparable. Teal is activation; rose is its derivative. Curves outside the displayed vertical range are clipped. GELU is xΦ(x), not the common tanh approximation.",
});
