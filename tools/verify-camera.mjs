import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
// Exercise the same configurable core as the browser with a small CPU model.
fs.mkdirSync("tmp/camera", { recursive: true });
await build({
  stdin: {
    contents: `export {WorldCore} from './book/world/engine.ts'; export {renderSensor,SENSOR_SIZE} from './book/world/sensor.ts'; export {WORLD_CONFIG,parameterCount} from './book/world/model.ts';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: "esm",
  platform: "node",
  packages: "external",
  outfile: "tmp/camera/core.mjs",
});
const { WorldCore, renderSensor, SENSOR_SIZE, WORLD_CONFIG, parameterCount } =
  await import("../tmp/camera/core.mjs");
const { defaultDevice } = await import("@jax-js/jax");
defaultDevice("cpu");
assert.equal(SENSOR_SIZE, 64);
assert.equal(WORLD_CONFIG.resolution, 64);
assert.equal(parameterCount(WORLD_CONFIG), 545680);
const core = new WorldCore({
  seed: 19,
  trainEpisodes: 1,
  stepsPerEpisode: 3,
  hidden: 4,
  predictorHidden: 4,
  latent: 2,
  batch: 4,
});
let baseline;
try {
  const initial = await core.init();
  const checkFrames = (info) => {
    assert.equal(info.config.resolution, 64);
    assert.equal(info.preview.frames.length, info.preview.states.length * 4096);
    for (let i = 0; i < info.preview.states.length; i++)
      assert.deepEqual(
        info.preview.frames.slice(i * 4096, (i + 1) * 4096),
        renderSensor(info.preview.states[i]),
      );
  };
  checkFrames(initial);
  assert.equal((await core.train(2)).step, 2);
  const evaluated = await core.evaluate();
  assert.ok(Number.isFinite(evaluated.predictionLoss));
  for (const example of evaluated.futureMatching.examples) {
    assert.equal(example.current.length, 4096);
    for (const frame of example.candidates) assert.equal(frame.length, 4096);
  }
  const reset = await core.reset(23);
  checkFrames(reset);
  assert.equal(reset.step, 0);
  assert.notDeepEqual(reset.preview.frames, initial.preview.frames);
  baseline = await core.createUnregularizedBaseline();
  assert.equal(baseline.config.resolution, 64);
  assert.equal((await baseline.train(1)).step, 1);
  console.log(
    "64 × 64 camera checks passed: native frames, training, evaluation, seed reset, matched baseline.",
  );
} finally {
  baseline?.dispose();
  core.dispose();
}
