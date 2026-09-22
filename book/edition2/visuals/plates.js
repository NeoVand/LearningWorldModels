import {
  register,
  range,
  button,
  row,
  panel,
  svg,
  text,
  dot,
  line,
  path,
  choices,
  tex,
} from "./core.js";
register("P1", {
  title: "The object continues; the image loses it",
  question:
    "Play one possible passage behind the screen. The camera cannot observe the ball during the middle interval.",
  controls: [
    button("play", "Play"),
    button("reset", "Replay"),
    range("time", "Time", 0, 240, 1, 45),
  ],
  animate: true,
  draw(s) {
    const x = 80 + (560 * s.time) / 240,
      hidden = x > 267 && x < 453;
    return svg(
      `<defs><linearGradient id="screen-depth" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--surface-raised)"/><stop offset="1" stop-color="var(--inset)"/></linearGradient><radialGradient id="ball-light" cx=".3" cy=".25"><stop stop-color="var(--surface)"/><stop offset=".3" stop-color="var(--blue)"/><stop offset="1" stop-color="var(--teal)"/></radialGradient></defs>` +
        line(35, 137, 685, 137) +
        `<circle cx="${x}" cy="118" r="13" fill="url(#ball-light)"/><rect x="255" y="35" width="210" height="102" rx="3" fill="url(#screen-depth)" stroke="var(--line)"/>` +
        text(360, 82, "Screen in the foreground", "muted", "middle") +
        text(
          360,
          105,
          hidden ? "Ball fully hidden" : "Ball enters or leaves view",
          "muted",
          "middle",
        ) +
        text(35, 165, "The track runs behind the screen; it never meets it."),
      "Camera view of one ball moving behind an opaque screen",
      720,
      182,
    );
  },
  caption:
    "This animation supplies one possible physical continuation, not a learned prediction. When the ball is hidden, images alone cannot establish whether an unseen interaction changes its motion.",
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
