import {
  register,
  row,
  panel,
  svg,
  text,
  dot,
  line,
  path,
  range,
  choices,
  tex,
} from "./core.js";
register("P1", {
  title: "A hidden interval leaves several continuations",
  question:
    "The observations constrain a future without necessarily selecting just one.",
  draw: () =>
    row(
      panel(
        "Visible past",
        svg(
          line(20, 180, 340, 180) +
            [55, 95, 135]
              .map((x, i) => dot(x, 150, 10, "blue", 0.25 + i * 0.3))
              .join("") +
            `<rect x="165" y="60" width="90" height="120" fill="var(--surface-raised)" stroke="var(--line)"/>`,
          "Three observed ball positions before an opaque screen",
        ),
        "Earlier positions supply motion evidence; a still image does not.",
      ),
      panel(
        "Unseen continuation",
        svg(
          `<rect x="35" y="60" width="90" height="120" fill="var(--surface-raised)" stroke="var(--line)"/>` +
            path(
              [
                [125, 150],
                [210, 120],
                [310, 110],
              ],
              "teal",
            ) +
            path(
              [
                [125, 150],
                [210, 175],
                [310, 190],
              ],
              "teal",
            ),
          "Two possible paths after occlusion",
        ),
        "The branches stand for uncertainty about hidden interactions. They are possible alternatives, not simultaneous copies of a ball.",
      ),
    ),
  caption:
    "The generated temporal plate makes the missing interval concrete. The editable companion diagram states what is observed and what is hypothesized; no probabilities or trained forecasts are implied.",
});
register("P4", {
  title: "A subgoal connects two time scales",
  question:
    "A route planner need not choose every foot placement. What must it pass to the shorter-scale planner?",
  draw: () =>
    row(
      panel(
        "Minutes",
        svg(
          path(
            [
              [45, 200],
              [45, 60],
              [280, 60],
              [280, 200],
            ],
            "teal",
            4,
          ) +
            dot(45, 200, 7, "blue") +
            dot(280, 200, 7, "amber") +
            text(180, 245, "Reach the next street", "ink", "middle"),
          "A coarse route around a block",
        ),
        "Output: a crossing location.",
      ),
      panel(
        "Seconds",
        svg(
          [0, 1, 2, 3, 4]
            .map(
              (i) =>
                `<rect x="${65 + i * 45}" y="90" width="25" height="100" fill="var(--plot-line)"/>`,
            )
            .join("") +
            path(
              [
                [50, 140],
                [305, 140],
              ],
              "teal",
              3,
            ) +
            text(180, 245, "Reach the far curb", "ink", "middle"),
          "Crossing a street",
        ),
        "Output: a safe landing region.",
      ),
      panel(
        "Fractions of a second",
        svg(
          `<ellipse cx="180" cy="165" rx="85" ry="30" fill="var(--inset)" stroke="var(--blue)"/>` +
            path(
              [
                [50, 170],
                [105, 75],
                [230, 70],
                [305, 170],
              ],
              "amber",
              3,
            ) +
            text(180, 245, "Place the next foot", "ink", "middle"),
          "A foot-placement path over a puddle",
        ),
        "Output: a short action sequence.",
      ),
    ),
  caption:
    "This is the hierarchy proposal illustrated at human scales. The book’s learner and the target model use a single planning scale; the picture does not imply they already implement this hierarchy.",
});
register("J1", {
  title: "Two targets ask for different kinds of agreement",
  question:
    "Which discrepancy punishes a changed shadow even when the object motion is the same?",
  draw: () =>
    row(
      panel(
        "Pixel reconstruction",
        `<div class="visual-equation">${tex("o_t\\to f_\\theta\\to g_\\psi\\to\\hat o_{t+1}", true)}</div><div class="visual-equation">${tex("\\|\\hat o_{t+1}-o_{t+1}\\|^2", true)}</div>`,
        "The target is every observed pixel; nuisance appearance can contribute to the loss.",
      ),
      panel(
        "Latent prediction",
        `<div class="visual-equation">${tex("o_t\\to f_\\theta\\to g_\\psi\\to\\pred_{t+1}", true)}</div><div class="visual-equation">${tex("\\|\\pred_{t+1}-f_\\theta(o_{t+1})\\|^2", true)}</div>`,
        "The target is itself encoded. This creates room to omit details, and creates the collapse loophole.",
      ),
    ),
  caption:
    "The illustration expresses a desired distinction, not a guarantee that a learned embedding retains exactly the useful structure. The loss and data determine what survives.",
});
