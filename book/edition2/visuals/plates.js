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
  takeaway,
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
  title: "A subgoal narrows the next search",
  question:
    "Once the route fixes a crossing, which foot-level alternatives still need to be considered?",
  draw: () => {
    const branch = (x, y, dx, dy, color) =>
      path(
        [
          [x, y],
          [x + dx, y + dy],
        ],
        color,
        1.7,
      );
    const tree = (root, offsets, color) => {
      let level = [root],
        drawing = "";
      offsets.forEach((offset, depth) => {
        const next = [];
        for (const x of level)
          for (const sign of [-1, 1]) {
            const child = x + sign * offset;
            drawing += branch(x, 37 + depth * 32, sign * offset, 32, color);
            next.push(child);
          }
        level = next;
      });
      return (
        drawing +
        level.map((x) => dot(x, 37 + offsets.length * 32, 3, color)).join("")
      );
    };
    return (
      row(
        panel(
          "Compare the remaining local choices",
          svg(
            text(87, 17, "No subgoal", "ink", "middle") +
              text(269, 17, "Crossing chosen", "ink", "middle") +
              tree(87, [42, 20, 9], "blue") +
              tree(269, [42, 20], "teal") +
              text(87, 168, "8 three-step paths", "blue", "middle") +
              text(269, 168, "4 local paths", "teal", "middle"),
            "A three-step binary action tree has eight leaves. After a high-level crossing has been selected, the illustrated two-step local search has four leaves. Selecting the crossing has its own cost.",
            360,
            184,
          ),
        ),
      ) +
      takeaway(
        "A chosen subgoal can narrow the short-range question. Finding a good subgoal also takes work.",
      )
    );
  },
  caption:
    "This is a toy conditional search, not a general savings theorem. The book’s learner and the target model use a single planning scale; the hierarchy above is a proposal.",
});
register("J1", {
  title: "A learned target can move toward the prediction",
  question: "If the encoder changes, which target changes with it?",
  draw: () => {
    const box = (x, y, a, b, color = "line") =>
      `<rect x="${x}" y="${y}" width="107" height="50" rx="5" fill="var(--surface-raised)" stroke="var(--${color})"/>` +
      text(x + 53.5, y + 20, a, "ink", "middle") +
      text(x + 53.5, y + 38, b, "muted", "middle");
    const inward = (y) =>
      line(123, y, 158, y, "muted") +
      `<path d="M158 ${y}l-6-4v8z" fill="var(--muted)"/>` +
      line(237, y, 202, y, "muted") +
      `<path d="M202 ${y}l6-4v8z" fill="var(--muted)"/>`;
    const diagram =
      text(12, 17, "PIXEL TARGET", "blue") +
      box(14, 27, "Predicted", "image", "teal") +
      inward(52) +
      `<circle cx="180" cy="52" r="19" fill="var(--surface-raised)" stroke="var(--rose)"/>` +
      text(180, 57, "loss", "rose", "middle") +
      box(239, 27, "Observed", "future · fixed", "blue") +
      line(12, 101, 348, 101) +
      text(12, 124, "REPRESENTATION TARGET", "violet") +
      box(14, 135, "Predicted", "embedding", "teal") +
      inward(160) +
      `<circle cx="180" cy="160" r="19" fill="var(--surface-raised)" stroke="var(--rose)"/>` +
      text(180, 165, "loss", "rose", "middle") +
      box(239, 135, "Encoded", "future · learned", "violet") +
      text(
        180,
        209,
        "Both latent branches depend on the encoder.",
        "ink",
        "middle",
      );
    return (
      row(
        panel(
          "What each prediction is compared with",
          svg(
            diagram,
            "A pixel prediction is compared with a fixed observed future image. A latent prediction is compared with an embedding of the future image; that target changes when the shared encoder learns.",
            360,
            225,
          ),
        ),
      ) +
      `<div class="visual-formula-row"><span>${tex("\\objective{L}_{\\rm pixel}=\\|\\predicted{\\hat o}-\\observed{o}'\\|^2")}</span><span>${tex("\\objective{L}_{\\rm latent}=\\|\\predicted{\\hat z}-f_\\theta(\\observed{o}')\\|^2")}</span></div>` +
      takeaway(
        "The future image is fixed data. Its learned embedding can move, so agreement alone can reward making both sides constant.",
      )
    );
  },
  caption:
    "The latent target is trainable because the same encoder is applied to the future observation. This permits nuisance suppression, but prediction loss alone does not guarantee a useful embedding.",
});
