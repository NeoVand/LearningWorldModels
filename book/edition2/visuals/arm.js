import {
  register,
  row,
  panel,
  svg,
  text,
  dot,
  path,
  line,
  range,
  button,
  choices,
  takeaway,
  tex,
  f,
} from "./core.js";
import { armDrawing, armGeometry } from "../../../tools/arm-plates.mjs";
import { stepArm } from "../../world/simulator.ts";
import { renderSensor, SENSOR_SIZE } from "../../world/sensor.ts";
// Draw the native sensor samples; omit white background pixels to keep animation light.
function cameraImage(pixels) {
  return (
    `<g class="sensor-image"><rect width="${SENSOR_SIZE}" height="${SENSOR_SIZE}" fill="white"/>` +
    Array.from(pixels, (v, i) =>
      v >= 1
        ? ""
        : `<rect x="${i % SENSOR_SIZE}" y="${Math.floor(i / SENSOR_SIZE)}" width="1" height="1" fill="rgb(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)})"/>`,
    ).join("") +
    "</g>"
  );
}
const initial = { q1: -1.9, q2: 1.45, v1: 0.45, v2: -0.55 };
export function trajectory(start, action, steps = 240) {
  let p = { ...start };
  return [
    p,
    ...Array.from(
      { length: steps },
      () => (p = stepArm(p, action, { dt: 1 / 60, damping: 0 })),
    ),
  ];
}
const histories = [
  trajectory(initial, [0.2, 0.08]),
  trajectory({ ...initial, v1: -initial.v1, v2: -initial.v2 }, [0.2, 0.08]),
];
const mechanism = (p, extra = "") =>
  svg(
    `<circle cx="180" cy="140" r="111" class="reach-guide"/>${extra}${armDrawing(p, 180, 140, 130)}`,
    "Two-link mechanism, with one shoulder joint and one elbow",
  );
const ghost = (p, c = "teal") => {
  const a = armGeometry(p, 180, 140, 130);
  return path(
    Object.values(a).map((p) => [p.x, p.y]),
    c,
    1,
  );
};
register("O1", {
  title: "Observe → encode → imagine",
  question:
    "Play the camera sequence and change the command. Which parts are seen, constructed, or simulated?",
  controls: [
    button("play", "Play"),
    button("reset", "Replay"),
    range("time", "Time", 0, 240, 1, 0),
    choices("command", "Proposed action", ["Push", "Reverse", "Release"]),
  ],
  animate: true,
  draw(s) {
    const p = histories[0][Math.round(s.time)],
      pixels = renderSensor(p),
      vals = [
        ["\\sin q_1", Math.sin(p.q1)],
        ["\\cos q_1", Math.cos(p.q1)],
        ["\\sin q_2", Math.sin(p.q2)],
        ["\\cos q_2", Math.cos(p.q2)],
      ];
    const coordinates =
      '<div style="display:grid;gap:0.4rem;padding:0.4rem 0">' +
      vals
        .map(([label, value]) => {
          const left = 50 + Math.min(0, value) * 46,
            width = Math.abs(value) * 46;
          return (
            '<div style="display:grid;grid-template-columns:4.7em minmax(0,1fr) 3.1em;gap:0.4rem;align-items:center;font:400 0.77rem/1.3 DM Sans,sans-serif">' +
            `<span>${tex(label)}</span>` +
            '<span style="position:relative;height:13px;border-bottom:1px solid var(--plot-line)">' +
            '<i style="position:absolute;left:50%;top:1px;width:1px;height:12px;background:var(--line)"></i>' +
            `<i style="position:absolute;left:${left}%;top:2px;width:${width}%;height:10px;border-radius:2px;background:var(--violet)"></i>` +
            "</span>" +
            `<span style="text-align:right;white-space:nowrap;color:var(--violet);font-variant-numeric:tabular-nums">${f(value)}</span>` +
            "</div>"
          );
        })
        .join("") +
      "</div>";
    const action =
        s.command === "Push"
          ? [0.55, -0.45]
          : s.command === "Reverse"
            ? [-0.55, 0.45]
            : [0, 0],
      future = trajectory(p, action, 90);
    return (
      "<style>@media screen and (max-width:620px){#visual-O1 .visual-panel:first-child>svg{max-height:205px}#visual-O1 .visual-panel:last-child>svg{max-height:155px}}</style>" +
      '<div class="visual-panels" data-panels="3" style="--panel-count:3;--graphic-count:2;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr))">' +
      panel(
        `Observe · ${SENSOR_SIZE} × ${SENSOR_SIZE} camera`,
        svg(
          cameraImage(pixels),
          `Actual ${SENSOR_SIZE} by ${SENSOR_SIZE} grayscale camera image of the arm`,
          SENSOR_SIZE,
          SENSOR_SIZE,
        ),
      ) +
      `<div class="visual-panel"><h4>Constructed pose code · not trained</h4>${coordinates}</div>` +
      panel(
        `Simulator reveal · ${s.command.toLowerCase()}`,
        mechanism(p, [30, 60, 90].map((k) => ghost(future[k])).join("")),
      ) +
      "</div>" +
      takeaway(
        "Only the camera image is observed. The pose bars and exposed arm use simulator state.",
      )
    );
  },
  caption:
    "The hand-built code omits velocity. The faint arms show consequences simulated for the selected action; the laboratory later learns its own encoder and predictor from pixels.",
});
register("O2", {
  title: "The picture hides the velocity",
  question:
    "The first images match exactly. Will the same motor command produce the same next image?",
  controls: [
    button("play", "Play"),
    button("reset", "Replay"),
    range("time", "Elapsed frames", 0, 240, 1, 0),
    choices("history", "Earlier frames", ["Hidden", "Revealed"]),
  ],
  animate: true,
  draw(s) {
    return row(
      ...histories.map((h, i) => {
        let extra = "";
        if (s.history === "Revealed") {
          let back = trajectory(
            { ...h[0], v1: -h[0].v1, v2: -h[0].v2 },
            [0, 0],
            36,
          );
          extra = [12, 24, 36].map((k) => ghost(back[k], "amber")).join("");
        }
        return panel(
          i ? "Opposite velocity" : "Initial velocity",
          mechanism(h[Math.round(s.time)], extra),
          `Same action [0.20, 0.08]. Frame ${Math.round(s.time)}. ${i ? "Initially clockwise at the shoulder." : "Initially counterclockwise at the shoulder."}`,
        );
      }),
    );
  },
  caption:
    "The two mechanisms start at the same joint angles with opposite velocities. Amber outlines reveal earlier poses. The future differs because the current image does not specify the complete physical state.",
});
register("P3", {
  title: "Keep a distinction; ignore a distraction",
  question:
    "Change the surface, then change the elbow. Which difference should a motion code keep?",
  controls: [
    choices("surface", "New surface", ["Striped", "Dotted"]),
    range("angle", "Elbow angle", -0.8, 2.2, 0.01, 1.45),
  ],
  draw(s) {
    const reference = { ...initial, q2: 0.25 },
      changed = { ...initial, q2: s.angle },
      position = (angle) => 65 + ((angle + 0.8) / 3) * 245;
    const scene = (x, pose, surface, name, color) => {
      const { base, elbow, tip } = armGeometry(pose, x + 51, 51, 60);
      const texture =
        surface === "Striped"
          ? Array.from({ length: 7 }, (_, i) =>
              line(x + 16 + i * 12, 24, x + 16 + i * 12, 109),
            ).join("")
          : surface === "Dotted"
            ? Array.from({ length: 30 }, (_, i) =>
                dot(
                  x + 17 + (i % 6) * 14,
                  29 + Math.floor(i / 6) * 17,
                  1.2,
                  "plot-line",
                ),
              ).join("")
            : "";
      return (
        text(x + 51, 17, name, color, "middle") +
        `<rect x="${x + 7}" y="22" width="88" height="90" rx="5" fill="var(--surface-raised)" stroke="var(--line)"/>` +
        texture +
        `<path d="M${base.x} ${base.y}L${elbow.x} ${elbow.y}L${tip.x} ${tip.y}" fill="none" stroke="var(--ink)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<circle cx="${base.x}" cy="${base.y}" r="5" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>` +
        dot(elbow.x, elbow.y, 3, "ink") +
        dot(tip.x, tip.y, 3.5, color)
      );
    };
    const picture =
      scene(0, reference, "Plain", "A · plain", "blue") +
      scene(
        120,
        reference,
        s.surface,
        `A′ · ${s.surface.toLowerCase()}`,
        "violet",
      ) +
      scene(
        240,
        changed,
        s.surface,
        Math.abs(s.angle - reference.q2) < 0.005
          ? "B · same pose"
          : "B · new pose",
        "amber",
      ) +
      text(8, 139, "Keep the elbow angle", "ink") +
      line(50, 174, 315, 174) +
      dot(position(reference.q2), 174, 7, "blue") +
      `<circle cx="${position(reference.q2)}" cy="174" r="11" fill="none" stroke="var(--violet)" stroke-width="2"/>` +
      dot(position(s.angle), 174, 6.5, "amber") +
      text(8, 219, "Erase everything", "ink") +
      line(50, 250, 315, 250) +
      dot(180, 250, 6, "blue") +
      `<circle cx="180" cy="250" r="10" fill="none" stroke="var(--violet)" stroke-width="2"/>` +
      `<circle cx="180" cy="250" r="14" fill="none" stroke="var(--amber)" stroke-width="2"/>`;
    return (
      row(
        panel(
          "Three pictures, two maps",
          svg(
            picture,
            "A and A prime show the same arm pose on different surfaces; B changes the elbow. The pose code overlaps A and A prime but separates B, while the constant code merges all three.",
          ),
        ),
      ) +
      takeaway(
        "The surface change disappears in the first code; the elbow change remains. A constant code erases both.",
      )
    );
  },
  caption:
    "The first line uses the elbow angle as a hand-designed code for this one comparison; it is not a complete motion state. The second line is a constant code. Neither line shows learned encoder output.",
});
