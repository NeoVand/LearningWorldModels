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
  tex,
  f,
} from "./core.js";
import { armDrawing, armGeometry } from "../../../tools/arm-plates.mjs";
import { stepArm, armPoints } from "../../world/simulator.ts";
import { renderSensor } from "../../world/sensor.ts";
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
    "One physical pose; three different descriptions. Play the scene, then change the proposed command.",
  controls: [
    button("play", "Play"),
    button("reset", "Replay"),
    range("time", "Time", 0, 240, 1, 0),
    choices("command", "Proposed action", ["Push", "Reverse", "Release"]),
  ],
  animate: true,
  draw(s) {
    const p = histories[0][Math.round(s.time)],
      pixels = renderSensor(p, 16),
      vals = [
        Math.sin(p.q1),
        Math.cos(p.q1),
        Math.sin(p.q2),
        Math.cos(p.q2),
        Math.sin(p.q1 + p.q2),
        Math.cos(p.q1 + p.q2),
        Math.tanh(p.v1),
        Math.tanh(p.v2),
      ];
    let camera = "";
    pixels.forEach(
      (v, i) =>
        (camera += `<rect x="${124 + (i % 16) * 7}" y="${82 + Math.floor(i / 16) * 7}" width="7" height="7" fill="rgb(${v * 255},${v * 255},${v * 255})"/>`),
    );
    let bars = vals
      .map(
        (v, i) =>
          line(80, 55 + i * 24, 280, 55 + i * 24) +
          `<rect x="${180 + Math.min(0, v) * 85}" y="${48 + i * 24}" width="${Math.abs(v) * 85}" height="14" rx="3" fill="var(--violet)"/>` +
          text(55, 59 + i * 24, String(i + 1)) +
          text(315, 59 + i * 24, f(v), "violet", "end"),
      )
      .join("");
    const action =
        s.command === "Push"
          ? [0.55, -0.45]
          : s.command === "Reverse"
            ? [-0.55, 0.45]
            : [0, 0],
      future = trajectory(p, action, 90);
    return (
      row(
        panel("Observe", mechanism(p), "The camera records pixels."),
        panel(
          "Encode",
          svg(bars, "Eight explicitly constructed illustrative coordinates"),
          "Eight numbers are eight coordinates, not eight joints. Here they are hand-chosen functions of the state.",
        ),
        panel(
          "Imagine",
          mechanism(p, [30, 60, 90].map((k) => ghost(future[k])).join("")),
          s.command + " · simulated consequences, not learned predictions.",
        ),
      ) +
      `<div class="camera-inset">${svg(`<g class="sensor-image">${camera}</g>`, "Actual 16 by 16 sensor image")}<p>The actual camera image. The trainable encoder later receives 32 × 32 pixels.</p></div>`
    );
  },
  caption:
    "A simulator drives this introductory illustration at fixed time intervals. The encoder bars are an explanatory mapping; only the laboratory trains an encoder and forecasts with learned weights.",
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
    "Change the table, then change the elbow. Which change should a motion representation preserve?",
  controls: [
    choices("surface", "Surface", ["Plain", "Striped", "Dotted"]),
    range("angle", "Elbow angle", -0.8, 2.2, 0.01, 1.45),
  ],
  draw(s) {
    const p = { ...initial, q2: s.angle };
    let bg = "";
    for (let i = 0; i < 10; i++)
      bg +=
        s.surface === "Striped"
          ? line(40 + i * 30, 30, 40 + i * 30, 250)
          : s.surface === "Dotted"
            ? Array.from({ length: 8 }, (_, j) =>
                dot(40 + i * 30, 35 + j * 30, 1, "plot-line"),
              ).join("")
            : "";
    return row(
      panel("Pixels", mechanism(p, bg)),
      panel(
        "A useful distinction",
        svg(
          [Math.sin(p.q1), Math.cos(p.q1), Math.sin(p.q2), Math.cos(p.q2)]
            .map(
              (v, i) =>
                `<rect x="70" y="${45 + i * 45}" width="${100 + 80 * v}" height="20" rx="3" fill="var(--violet)"/>` +
                text(60, 60 + i * 45, String(i + 1), "muted", "end"),
            )
            .join(""),
          "Pose-dependent coordinates",
        ),
        "This hand-designed pose code ignores the surface.",
      ),
      panel(
        "Destructive collapse",
        svg(
          [0, 1, 2, 3].map((i) => dot(180, 60 + i * 45, 5, "rose")).join(""),
          "Constant code",
        ),
        "A constant code ignores the surface and the pose. Invariance alone cannot tell these solutions apart.",
      ),
    );
  },
  caption:
    "These are constructed examples, not claims about measured invariance of the trained model. A representation must ignore some changes while preserving others.",
});
