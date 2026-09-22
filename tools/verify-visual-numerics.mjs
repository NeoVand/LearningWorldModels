import { traceLines } from "../book/edition2/visuals/pipeline.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { registry, stateFor } from "../book/edition2/visuals/core.js";
import "../book/edition2/visuals/arm.js";
import "../book/edition2/visuals/foundations.js";
import "../book/edition2/visuals/learning.js";
import { attention } from "../book/edition2/visuals/research.js";
import { cem } from "../book/edition2/visuals/pipeline.js";
import { trajectory } from "../book/edition2/visuals/arm.js";
import { ep, closedEP, rng, normal } from "../book/edition2/numerics.js";
const report = {};
const initial = { q1: -1.9, q2: 1.45, v1: 0.45, v2: -0.55 };
const a = trajectory(initial, [0.2, 0.08], 60),
  b = trajectory({ ...initial, v1: -0.45, v2: 0.55 }, [0.2, 0.08], 60);
assert.equal(a[0].q1, b[0].q1);
assert.ok(Math.abs(a[60].q1 - b[60].q1) > 0.1);
report.oppositeVelocitySeparation = Math.abs(a[60].q1 - b[60].q1);
for (const query of [0, 1]) {
  const a = attention({ query, mask: true, future: -5 }),
    b = attention({ query, mask: true, future: 5 });
  assert.deepEqual(a.out, b.out);
  assert.ok(Math.abs(a.w.reduce((a, b) => a + b) - 1) < 1e-12);
}
report.causalFutureInvariant = true;
const c0 = cem(0),
  c5 = cem(5),
  cost = (p) => (p[0] - 0.8) ** 2 + 2 * (p[1] + 0.6) ** 2;
assert.ok(cost(c5.next) < cost(c0.mu));
assert.ok(c5.spread.every((v) => v >= 0.08));
report.cemFinalCost = cost(c5.next);
const spec = registry.N3,
  s = stateFor(spec);
spec.draw(s);
const mse = () =>
  Array.from({ length: 41 }, (_, i) => {
    let x = -2 + 0.1 * i;
    return (
      (s.fit.w.reduce(
        (a, w, j) => a + s.fit.v[j] * Math.tanh(w * x + s.fit.c[j]),
        0,
      ) -
        Math.sin(2 * x)) **
      2
    );
  }).reduce((a, b) => a + b) / 41;
const before = mse();
for (let k = 0; k < 10; k++) spec.action(s, "train");
const after = mse();
assert.ok(after < before * 0.1);
report.neuronTraining = { updates: s.fit.steps, before, after };
const h = [-0.8, 0.2, 1.4],
  analytic = ep(h, { gradient: true });
let error = 0;
h.forEach((_, i) => {
  const a = [...h],
    b = [...h];
  a[i] += 1e-5;
  b[i] -= 1e-5;
  error = Math.max(
    error,
    Math.abs((ep(a) - ep(b)) / 2e-5 - analytic.gradient[i]),
  );
});
assert.ok(error < 1e-7);
report.sigregGradientError = error;
const random = rng(314),
  B = 32,
  values = Array.from(
    { length: 500 },
    () => B * closedEP(Array.from({ length: B }, () => normal(random))),
  ),
  mean = values.reduce((a, b) => a + b) / values.length,
  target = Math.sqrt(2 * Math.PI) * (1 - 1 / Math.sqrt(3)),
  sd = Math.sqrt(
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1),
  );
assert.ok(Math.abs(mean - target) < (4 * sd) / Math.sqrt(values.length));
report.nullFloor = {
  mean,
  target,
  standardError: sd / Math.sqrt(values.length),
};
fs.writeFileSync(
  "research/implementation/visual-numerics.json",
  JSON.stringify(report, null, 2),
);
console.log(report);

const source = fs.readFileSync("book/edition2/sigreg_reference.py", "utf8");
for (const [, line] of traceLines)
  assert.ok(
    source.includes(line),
    "Trace excerpt differs from reference: " + line,
  );
