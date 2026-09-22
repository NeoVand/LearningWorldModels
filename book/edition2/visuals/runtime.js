import { icon } from "../../../tools/icons.mjs";
import { registry, stateFor } from "./core.js";
import "./arm.js";
import "./foundations.js";
import "./learning.js";
import "./statistics.js";
import "./pipeline.js";
import "./evidence.js";
import "./research.js";
import "./plates.js";
const instances = [];
for (const el of document.querySelectorAll("[data-visual]")) {
  const spec = registry[el.dataset.visual];
  if (!spec) continue;
  const state = stateFor(spec),
    body = el.querySelector(".visual-body");
  let playing =
      el.dataset.visual === "O1" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches,
    visible = false,
    last = 0,
    acc = 0;
  const draw = () => {
    body.innerHTML = spec.draw(state);
    el.querySelectorAll("input[data-key]").forEach((i) => {
      i.value = state[i.dataset.key];
      i.previousElementSibling.querySelector("output").textContent = Number(
        state[i.dataset.key],
      ).toFixed(Number.isInteger(+i.step) ? 0 : 2);
    });
    el.querySelectorAll("[data-value]").forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(state[b.dataset.key] === b.dataset.value),
      ),
    );
  };
  const playLabel = () => {
    let b = el.querySelector("[data-action=play]");
    if (b) {
      b.innerHTML =
        icon(playing ? "pause" : "play") +
        "<span>" +
        (playing ? "Pause" : spec.tick ? "Train" : "Play") +
        "</span>";
      b.setAttribute("aria-pressed", String(playing));
    }
  };
  el.addEventListener("input", (e) => {
    if (e.target.dataset.key) {
      state[e.target.dataset.key] = +e.target.value;
      spec.change?.(state, e.target.dataset.key);
      draw();
    }
  });
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.value) {
      state[b.dataset.key] = b.dataset.value;
      spec.change?.(state, b.dataset.key);
      draw();
      if (el.dataset.visual === "I3") {
        const patterns = {
          Projection: "h = z @ directions",
          Phase: "phase = h",
          Average: ["c = np.cos(phase).mean", "s = np.sin(phase).mean"],
          Discrepancy: ["error = (c - target)", "return batch *"],
        };
        const needles = [patterns[b.dataset.value]].flat();
        document.querySelectorAll("#sigreg .code-line").forEach((line) =>
          line.classList.toggle(
            "trace-active-line",
            needles.some((n) => line.textContent.includes(n)),
          ),
        );
        document.querySelectorAll("#sigreg .code-wrap").forEach((block) => {
          block.classList.toggle(
            "trace-active",
            Boolean(block.querySelector(".trace-active-line")),
          );
          block.dataset.traceStage = b.dataset.value;
        });
      }
    }
    if (b.dataset.action === "play") {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (spec.tick) spec.tick(state);
        else
          state.time = Math.min(
            spec.maxTime ?? 240,
            state.time + (spec.maxTime ? 1 : 30),
          );
        draw();
      } else {
        playing = !playing;
        last = 0;
        playLabel();
      }
    }
    if (b.dataset.action === "reset") {
      state.time = 0;
      playing = false;
      playLabel();
      draw();
    }
    if (b.dataset.action?.startsWith("reset")) {
      playing = false;
      playLabel();
    }
    if (spec.action && b.dataset.action) {
      spec.action(state, b.dataset.action);
      draw();
    }
  });
  if (spec.pointer)
    for (const kind of ["pointermove", "click"])
      el.addEventListener(kind, (e) => {
        const target = e.target.closest("svg[data-interactive]");
        if (!target) return;
        if (kind === "pointermove" && target.dataset.interactive !== "neuron")
          return;
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
          target.getScreenCTM().inverse(),
        );
        const before = state.probe;
        spec.pointer(state, {
          x: p.x,
          y: p.y,
          kind: kind === "click" ? "click" : "move",
          target: target.dataset.interactive,
        });
        if (kind === "pointermove" && before === state.probe) return;
        draw();
      });
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      last = 0;
    },
    { rootMargin: "50px" },
  ).observe(el);
  const tick = (t) => {
    if (playing && visible && !document.hidden) {
      if (last) acc += Math.min(0.05, (t - last) / 1000);
      let changed = false;
      const interval = 1 / (spec.fps ?? 60);
      while (acc >= interval) {
        if (spec.maxTime && state.time >= spec.maxTime) {
          playing = false;
          playLabel();
          acc = 0;
          break;
        }
        if (spec.tick) spec.tick(state);
        else
          state.time = spec.maxTime ? state.time + 1 : (state.time + 1) % 241;
        acc -= interval;
        changed = true;
      }
      if (changed) draw();
      last = t;
    } else last = 0;
    if (spec.animate) requestAnimationFrame(tick);
  };
  if (spec.animate) requestAnimationFrame(tick);
  playLabel();
  instances.push({ el, state, draw });
}
window.BookVisuals = instances;
