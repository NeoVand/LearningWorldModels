(() => {
  const $ = (s) => document.querySelector(s);
  const rail = $(".rail");
  $(".menu-button").onclick = () => {
    const on = rail.classList.toggle("shown");
    $(".menu-button").setAttribute("aria-expanded", String(on));
  };
  $(".focus-button").onclick = () => document.body.classList.toggle("focus");
  $("#search").oninput = (e) => {
    const q = e.target.value.toLowerCase();
    rail
      .querySelectorAll("a")
      .forEach((a) =>
        a.classList.toggle(
          "toc-hidden",
          !a.textContent.toLowerCase().includes(q),
        ),
      );
    rail.querySelectorAll("details").forEach((d) => {
      d.open = true;
      d.classList.toggle("toc-hidden", !d.querySelector("a:not(.toc-hidden)"));
    });
  };
  rail.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      rail.classList.remove("shown");
      $(".menu-button").setAttribute("aria-expanded", "false");
    }),
  );
  let printState = [];
  function beforePrint() {
    document.querySelectorAll('.lab select').forEach(select => {
      let value = select.nextElementSibling;
      if (!value?.classList.contains('print-select')) {
        value = document.createElement('span');
        value.className = 'print-select';
        select.after(value);
      }
      value.textContent = select.selectedOptions[0].textContent;
    });
    printState = [...document.querySelectorAll("main details")].map((d) => [
      d,
      d.open,
    ]);
    printState.forEach(([d]) => (d.open = true));
  }
  function afterPrint() {
    printState.forEach(([d, o]) => (d.open = o));
  }
  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
  $("#print").onclick = () => window.print();
  const obs = new IntersectionObserver(
    (es) => {
      for (const e of es)
        if (e.isIntersecting) {
          const n = e.target.dataset.number;
          rail
            .querySelectorAll("a.active")
            .forEach((a) => a.classList.remove("active"));
          rail.querySelector(`[data-page="${n}"]`)?.classList.add("active");
          $(".progress-fill").style.width = n + "%";
        }
    },
    { rootMargin: "-10% 0px -65% 0px" },
  );
  document.querySelectorAll(".page").forEach((p) => obs.observe(p));
})();

(() => {
  "use strict";
  const colors = {
    green: "#326756",
    blue: "#315eb1",
    orange: "#a04b27",
    purple: "#7653a2",
    ink: "#323b36",
    muted: "#747d74",
    line: "#ccd3c8",
  };
  function rng(seed = 1) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function normal(r) {
    return (
      Math.sqrt(-2 * Math.log(Math.max(1e-12, r()))) *
      Math.cos(2 * Math.PI * r())
    );
  }
  function mean(a) {
    return a.reduce((s, v) => s + v, 0) / a.length;
  }
  function stats(a) {
    const mx = mean(a.map((x) => x[0])),
      my = mean(a.map((x) => x[1]));
    let xx = 0,
      yy = 0,
      xy = 0;
    for (const [x, y] of a) {
      xx += (x - mx) ** 2;
      yy += (y - my) ** 2;
      xy += (x - mx) * (y - my);
    }
    const n = a.length - 1;
    return { mx, my, xx: xx / n, yy: yy / n, xy: xy / n };
  }
  function ep(h, gradient = false) {
    const B = h.length,
      K = 17,
      dt = 3 / 16;
    let val = 0;
    const grad = new Float64Array(B);
    for (let k = 0; k < K; k++) {
      const t = k * dt,
        q = Math.exp((-t * t) / 2),
        weight = (k === 0 || k === K - 1 ? dt : 2 * dt) * q;
      let c = 0,
        s = 0;
      for (const v of h) {
        c += Math.cos(t * v) / B;
        s += Math.sin(t * v) / B;
      }
      val += B * weight * ((c - q) ** 2 + s * s);
      if (gradient)
        for (let b = 0; b < B; b++)
          grad[b] +=
            2 *
            weight *
            t *
            (-(c - q) * Math.sin(t * h[b]) + s * Math.cos(t * h[b]));
    }
    return gradient ? { value: val, grad } : val;
  }
  function closedEP(h) {
    let s = 0;
    for (const x of h) for (const y of h) s += Math.exp(-((x - y) ** 2) / 2);
    return (
      (Math.sqrt(2 * Math.PI) * s) / h.length ** 2 -
      2 * Math.sqrt(Math.PI) * mean(h.map((x) => Math.exp((-x * x) / 4))) +
      Math.sqrt((2 * Math.PI) / 3)
    );
  }
  function directions(M, seed = 112) {
    const r = rng(seed);
    return Array.from({ length: M }, () => {
      const a = normal(r),
        b = normal(r),
        l = Math.hypot(a, b);
      return [a / l, b / l];
    });
  }
  function sigreg(points, M = 32) {
    return mean(
      directions(M).map((u) =>
        ep(points.map((z) => z[0] * u[0] + z[1] * u[1])),
      ),
    );
  }
  function cloud(kind, n = 128, seed = 10) {
    const r = rng(seed);
    return Array.from({ length: n }, () => {
      const x = normal(r),
        y = normal(r);
      if (kind === "shift") return [x + 1.3, y + 0.5];
      if (kind === "thin") return [x, 0.08 * y];
      if (kind === "lines") return [x, (r() < 0.5 ? -1 : 1) * x];
      if (kind === "zero") return [0, 0];
      return [x, y];
    });
  }
  function init(name, title, controls, note) {
    const el = document.querySelector(`[data-lab="${name}"]`);
    el.innerHTML = `<div class="lab-title">${title}</div><div class="lab-controls">${controls}</div><canvas width="1280" height="400" role="img" aria-label="${title}"></canvas><output aria-live="polite"></output><div class="lab-note">${note}</div>`;
    const canvas = el.querySelector("canvas"),
      ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    return {
      el,
      ctx,
      canvas,
      out: el.querySelector("output"),
      q: (s) => el.querySelector(s),
      clear() {
        ctx.clearRect(0, 0, 640, 200);
        ctx.font = "11px system-ui";
        ctx.lineWidth = 1;
      },
    };
  }
  function line(c, points, color = colors.line, width = 1, dash = []) {
    c.beginPath();
    c.strokeStyle = color;
    c.lineWidth = width;
    c.setLineDash(dash);
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.setLineDash([]);
  }
  function dot(c, x, y, r = 3, color = colors.green) {
    c.beginPath();
    c.fillStyle = color;
    c.arc(x, y, r, 0, 2 * Math.PI);
    c.fill();
  }
  function label(c, text, x, y, color = colors.muted) {
    c.fillStyle = color;
    c.font = "11px system-ui";
    c.fillText(text, x, y);
  }
  function scatter(c, pts, ox = 165, oy = 100, scale = 23) {
    line(c, [
      [ox - 100, oy],
      [ox + 100, oy],
    ]);
    line(c, [
      [ox, oy - 82],
      [ox, oy + 82],
    ]);
    for (const [x, y] of pts)
      dot(c, ox + x * scale, oy - y * scale, 2, colors.green);
  }
  function curve(
    c,
    fn,
    x0 = 0,
    x1 = 4,
    box = { x: 330, y: 20, w: 270, h: 150 },
    color = colors.blue,
    ymin = -1,
    ymax = 1,
  ) {
    const p = [];
    for (let i = 0; i <= 180; i++) {
      const x = x0 + ((x1 - x0) * i) / 180,
        y = fn(x);
      p.push([
        box.x + (box.w * i) / 180,
        box.y + (box.h * (ymax - y)) / (ymax - ymin),
      ]);
    }
    line(c, p, color, 1.6);
  }
  function fmt(x) {
    return Number.isFinite(x) ? x.toFixed(3) : "undefined";
  }
  const h = init(
    "history",
    "01 · The missing moment",
    '<button type="button">Reveal the previous positions</button>',
    "Known constant-velocity mechanics. Both pucks occupy the same position now.",
  );
  let reveal = false;
  function drawHistory() {
    h.clear();
    [55, 137].forEach((y, i) => {
      line(h.ctx, [
        [70, y],
        [570, y],
      ]);
      dot(h.ctx, 310, y, 11, colors.green);
      label(h.ctx, i ? "moving left" : "moving right", 75, y - 21);
      if (reveal) {
        dot(h.ctx, i ? 415 : 205, y, 6, colors.muted);
        line(
          h.ctx,
          [
            [i ? 415 : 205, y],
            [310, y],
          ],
          colors.muted,
          1,
          [3, 4],
        );
        label(h.ctx, "previous", i ? 395 : 180, y + 25);
      }
      line(
        h.ctx,
        [
          [310, y],
          [i ? 235 : 385, y],
        ],
        colors.blue,
        2,
        [4, 4],
      );
      dot(h.ctx, i ? 235 : 385, y, 5, colors.blue);
    });
    h.out.textContent = reveal
      ? "History distinguishes +v from −v, even with identical present images."
      : "Same current observation; different next positions under zero action.";
  }
  h.q("button").onclick = () => {
    reveal = !reveal;
    h.q("button").textContent = reveal
      ? "Hide history"
      : "Reveal the previous positions";
    drawHistory();
  };
  drawHistory();
  const pr = init(
    "projection",
    "02 · Rotate the shadow",
    '<label>Direction <input aria-label="Projection direction" type="range" min="0" max="180" value="30"><span></span></label>',
    "A projection is a signed dot product with a unit direction.",
  );
  const pts = cloud("gaussian", 80, 15).map(([x, y]) => [
    x * 1.4 + 0.3 * y,
    0.5 * y,
  ]);
  function drawProjection() {
    pr.clear();
    const deg = +pr.q("input").value,
      a = (deg * Math.PI) / 180,
      u = [Math.cos(a), Math.sin(a)],
      v = pts.map((z) => z[0] * u[0] + z[1] * u[1]);
    pr.q("span").textContent = deg + "°";
    scatter(pr.ctx, pts, 155, 95, 23);
    line(
      pr.ctx,
      [
        [155 - 85 * u[0], 95 + 85 * u[1]],
        [155 + 85 * u[0], 95 - 85 * u[1]],
      ],
      colors.orange,
      2,
    );
    line(
      pr.ctx,
      [
        [365, 125],
        [600, 125],
      ],
      colors.line,
    );
    for (let i = 0; i < v.length; i++)
      dot(pr.ctx, 480 + v[i] * 28, 120 - (i % 7) * 7, 2, colors.orange);
    label(pr.ctx, "two-dimensional cloud", 85, 190);
    label(pr.ctx, "one-dimensional projections", 383, 174);
    pr.out.textContent = `Direction = (${fmt(u[0])}, ${fmt(u[1])}) · projected mean ${fmt(mean(v))} · variance ${fmt(mean(v.map((x) => (x - mean(v)) ** 2)))}`;
  }
  pr.q("input").oninput = drawProjection;
  drawProjection();
  const me = init(
    "mean",
    "03 · The best prediction can be impossible",
    '<label>Chance of left future <input aria-label="Probability of left future" type="range" min="0" max="100" value="50"><span></span></label>',
    "Exact expected squared error for a two-point distribution; no fitted model.",
  );
  function drawMean() {
    me.clear();
    const p = +me.q("input").value / 100,
      m = 1 - 2 * p;
    me.q("span").textContent = Math.round(p * 100) + "%";
    line(me.ctx, [
      [50, 135],
      [600, 135],
    ]);
    dot(me.ctx, 170, 135, 6 + 20 * p, colors.green);
    dot(me.ctx, 490, 135, 6 + 20 * (1 - p), colors.green);
    dot(me.ctx, 330 + 160 * m, 83, 9, colors.blue);
    label(me.ctx, "−1", 165, 175);
    label(me.ctx, "+1", 485, 175);
    label(me.ctx, "best squared-error prediction", 235, 35, colors.blue);
    line(
      me.ctx,
      [
        [330 + 160 * m, 94],
        [330 + 160 * m, 135],
      ],
      colors.blue,
      1,
      [3, 3],
    );
    me.out.textContent = `Optimal prediction ${fmt(m)} · minimum expected loss ${fmt(4 * p * (1 - p))}`;
  }
  me.q("input").oninput = drawMean;
  drawMean();
  const co = init(
    "collapse",
    "04 · Shrink the world, shrink the error",
    '<label>Representation scale <input aria-label="Representation scale" type="range" min="0" max="100" value="100"><span></span></label>',
    "Algebraic scaling demonstration. Relative forecast error stays fixed; there is no training here.",
  );
  const base = cloud("gaussian", 60, 21);
  function drawCollapse() {
    co.clear();
    const w = +co.q("input").value / 100;
    co.q("span").textContent = fmt(w);
    scatter(
      co.ctx,
      base.map((z) => z.map((x) => w * x)),
      205,
      98,
      26,
    );
    const loss = 0.25 * w * w;
    line(co.ctx, [
      [410, 160],
      [600, 160],
    ]);
    co.ctx.fillStyle = colors.blue;
    co.ctx.fillRect(450, 160 - loss * 400, 65, loss * 400);
    label(co.ctx, "prediction error", 425, 185);
    label(co.ctx, "embedding cloud", 143, 190);
    co.out.textContent = `Scale ${fmt(w)} · squared prediction error ${fmt(loss)} · all inputs become identical at zero.`;
  }
  co.q("input").oninput = drawCollapse;
  drawCollapse();
  const cv = init(
    "covariance",
    "05 · Two varying features, one shared direction",
    '<label>Correlation <input aria-label="Population correlation" type="range" min="-100" max="100" value="85"><span></span></label>',
    "Seeded synthetic Gaussian cloud, 128 examples. Values below are sample estimates.",
  );
  const gaussian = cloud("gaussian", 128, 3);
  function drawCov() {
    cv.clear();
    const rho = +cv.q("input").value / 100;
    cv.q("span").textContent = rho.toFixed(2);
    const p = gaussian.map(([x, y]) => [
        x,
        rho * x + Math.sqrt(Math.max(0, 1 - rho * rho)) * y,
      ]),
      s = stats(p);
    scatter(cv.ctx, p, 210, 100, 25);
    label(cv.ctx, "population eigenvalues", 390, 63);
    label(
      cv.ctx,
      `${fmt(1 + rho)} and ${fmt(1 - rho)}`,
      390,
      87,
      colors.orange,
    );
    label(cv.ctx, "coordinate variances both 1", 390, 125);
    cv.out.textContent = `Sample covariance [[${fmt(s.xx)}, ${fmt(s.xy)}], [${fmt(s.xy)}, ${fmt(s.yy)}]] · covariance penalty ${fmt(s.xy * s.xy)}`;
  }
  cv.q("input").oninput = drawCov;
  drawCov();
  const mo = init(
    "moments",
    "06 · Same mean, same variance, different fingerprint",
    '<label>Frequency <input aria-label="Characteristic-function frequency" type="range" min="0" max="400" value="200"><span></span></label>',
    "Exact curves: Gaussian exp(−t²/2), in blue; random sign cos(t), in orange.",
  );
  function drawMoments() {
    mo.clear();
    const t = +mo.q("input").value / 100;
    mo.q("span").textContent = t.toFixed(2);
    const box = { x: 45, y: 15, w: 550, h: 150 };
    line(mo.ctx, [
      [45, 90],
      [595, 90],
    ]);
    curve(mo.ctx, (x) => Math.exp((-x * x) / 2), 0, 4, box, colors.blue);
    curve(mo.ctx, Math.cos, 0, 4, box, colors.orange);
    line(
      mo.ctx,
      [
        [45 + (t / 4) * 550, 15],
        [45 + (t / 4) * 550, 165],
      ],
      colors.muted,
      1,
      [3, 3],
    );
    label(mo.ctx, "frequency 0", 45, 192);
    label(mo.ctx, "4", 588, 192);
    mo.out.textContent = `t = ${t.toFixed(2)} · Gaussian ${fmt(Math.exp((-t * t) / 2))} · random sign ${fmt(Math.cos(t))} · both have mean 0 and variance 1.`;
  }
  mo.q("input").oninput = drawMoments;
  drawMoments();
  const di = init(
    "directions",
    "07 · The axes can lie by omission",
    '<label>Projection angle <input aria-label="Counterexample projection angle" type="range" min="0" max="90" value="0"><span></span></label>',
    "Two-line counterexample (G, SG). Compare its projected empirical fingerprint to the Gaussian.",
  );
  const two = cloud("lines", 256, 12);
  function drawDirections() {
    di.clear();
    const a = (+di.q("input").value * Math.PI) / 180,
      u = [Math.cos(a), Math.sin(a)],
      v = two.map((z) => z[0] * u[0] + z[1] * u[1]);
    di.q("span").textContent = di.q("input").value + "°";
    scatter(di.ctx, two, 145, 100, 23);
    line(
      di.ctx,
      [
        [145 - 85 * u[0], 100 + 85 * u[1]],
        [145 + 85 * u[0], 100 - 85 * u[1]],
      ],
      colors.orange,
      2,
    );
    curve(
      di.ctx,
      (t) => mean(v.map((x) => Math.cos(t * x))),
      0,
      3,
      { x: 330, y: 25, w: 270, h: 135 },
      colors.orange,
      -0.1,
      1,
    );
    curve(
      di.ctx,
      (t) => Math.exp((-t * t) / 2),
      0,
      3,
      { x: 330, y: 25, w: 270, h: 135 },
      colors.blue,
      -0.1,
      1,
    );
    label(di.ctx, "projected ECF (orange) / target (blue)", 325, 190);
    di.out.textContent = `Projected B-scaled statistic ${fmt(ep(v))}. At 45°, half the population projects exactly to zero.`;
  }
  di.q("input").oninput = drawDirections;
  drawDirections();
  const si = init(
    "sigreg",
    "08 · The distribution laboratory",
    '<label>Cloud <select aria-label="Embedding distribution"><option value="gaussian">Standard Gaussian</option><option value="shift">Shifted Gaussian</option><option value="thin">Thin Gaussian</option><option value="lines">Two diagonal lines</option><option value="zero">Complete collapse</option></select></label><label>Directions <select aria-label="Number of projections"><option>8</option><option selected>32</option><option>128</option></select></label><button type="button">New sample</button>',
    "128 examples; seeded unit directions; 17 frequencies on [0,3]; factor B included.",
  );
  let seed = 10;
  function drawSigreg() {
    si.clear();
    const selects = si.el.querySelectorAll("select"),
      p = cloud(selects[0].value, 128, seed),
      s = stats(p),
      M = +selects[1].value,
      score = sigreg(p, M);
    scatter(si.ctx, p, 165, 100, 23);
    const ds = directions(Math.min(M, 16));
    ds.forEach((u) =>
      line(
        si.ctx,
        [
          [165, 100],
          [165 + 60 * u[0], 100 - 60 * u[1]],
        ],
        "#a04b2755",
        0.7,
      ),
    );
    label(si.ctx, "finite-batch SIGReg", 365, 55);
    si.ctx.font = "34px Georgia";
    si.ctx.fillStyle = colors.purple;
    si.ctx.fillText(score.toFixed(3), 365, 101);
    label(si.ctx, "lower = closer on this finite sketch", 365, 137);
    si.out.textContent = `Mean (${fmt(s.mx)}, ${fmt(s.my)}) · covariance (${fmt(s.xx)}, ${fmt(s.xy)}, ${fmt(s.yy)}) · seed ${seed}`;
  }
  si.el.querySelectorAll("select").forEach((s) => (s.onchange = drawSigreg));
  si.q("button").onclick = () => {
    seed++;
    drawSigreg();
  };
  drawSigreg();
  const tr = init(
    "training",
    "09 · Actual gradient descent on a scalar encoder",
    '<label>Regularizer weight <input aria-label="Training regularization weight" type="range" min="0" max="100" value="20"><span></span></label><button type="button" data-run>Train 200 steps</button><button type="button" data-reset>Reset</button>',
    "Paired seeded independent Gaussian data. Shared scalar encoder; fixed identity predictor. Analytic gradients, step size 0.005.",
  );
  const rr = rng(456),
    xs = Array.from({ length: 128 }, () => normal(rr)),
    ys = Array.from({ length: 128 }, () => normal(rr)),
    coef = mean(xs.map((x, i) => (x - ys[i]) ** 2));
  let w0 = 0.7,
    w1 = 0.7,
    trace = [[0, w0, w1]],
    steps = 0;
  function drawTrain() {
    tr.clear();
    const lam = +tr.q("input").value / 100;
    tr.q("span").textContent = lam.toFixed(2);
    line(tr.ctx, [
      [45, 165],
      [605, 165],
    ]);
    const xmax = Math.max(200, steps),
      ymax = Math.max(
        1.2,
        ...trace.map((x) => Math.max(Math.abs(x[1]), Math.abs(x[2]))),
      );
    line(
      tr.ctx,
      trace.map(([n, w]) => [
        45 + (n / xmax) * 560,
        165 - (Math.abs(w) / ymax) * 135,
      ]),
      colors.orange,
      2,
    );
    line(
      tr.ctx,
      trace.map(([n, _, w]) => [
        45 + (n / xmax) * 560,
        165 - (Math.abs(w) / ymax) * 135,
      ]),
      colors.green,
      2,
    );
    label(tr.ctx, "encoder scale |w|", 45, 18);
    label(tr.ctx, "prediction only", 380, 23, colors.orange);
    label(tr.ctx, "+ SIGReg", 510, 23, colors.green);
    label(tr.ctx, `${steps} gradient steps`, 450, 191);
    tr.out.textContent = `Without: w=${fmt(w0)}, pred=${fmt(coef * w0 * w0)} · With: w=${fmt(w1)}, pred=${fmt(coef * w1 * w1)}, reg=${fmt(ep(xs.map((x) => w1 * x)))}`;
  }
  tr.q("[data-run]").onclick = () => {
    const lam = +tr.q("input").value / 100;
    for (let i = 0; i < 200; i++) {
      w0 -= 0.005 * 2 * coef * w0;
      const g = ep(
        xs.map((x) => w1 * x),
        true,
      );
      const dw = g.grad.reduce((s, v, i) => s + v * xs[i], 0);
      w1 -= 0.005 * (2 * coef * w1 + lam * dw);
      steps++;
      if (steps % 2 === 0) trace.push([steps, w0, w1]);
    }
    drawTrain();
  };
  tr.q("[data-reset]").onclick = () => {
    w0 = w1 = 0.7;
    steps = 0;
    trace = [[0, w0, w1]];
    drawTrain();
  };
  tr.q("input").oninput = drawTrain;
  drawTrain();
  function dynamics(s, a, damping = 0.9) {
    const v = damping * s[1] + 0.15 * a;
    return [s[0] + v, v];
  }
  function cem(state, goal, H = 10, damping = 0.9, seed = 90) {
    const r = rng(seed),
      N = 96,
      K = 12,
      I = 4;
    let mu = Array(H).fill(0),
      sd = Array(H).fill(1),
      best = null,
      last = [];
    for (let it = 0; it < I; it++) {
      const plans = [];
      for (let n = 0; n < N; n++) {
        const actions = mu.map((m, j) =>
          Math.max(-1, Math.min(1, m + sd[j] * normal(r))),
        );
        let s = state.slice(),
          path = [s],
          effort = 0,
          running = 0;
        for (const a of actions) {
          s = dynamics(s, a, damping);
          path.push(s);
          effort += a * a;
          running += (s[0] - goal) ** 2;
        }
        const cost =
          (s[0] - goal) ** 2 +
          0.5 * s[1] ** 2 +
          0.005 * effort +
          0.03 * running;
        const plan = { actions, path, cost };
        plans.push(plan);
        if (!best || cost < best.cost) best = plan;
      }
      plans.sort((a, b) => a.cost - b.cost);
      const elites = plans.slice(0, K);
      mu = mu.map((_, j) => mean(elites.map((x) => x.actions[j])));
      sd = sd.map((_, j) =>
        Math.max(
          0.08,
          Math.sqrt(mean(elites.map((x) => (x.actions[j] - mu[j]) ** 2))),
        ),
      );
      last = plans.slice(0, 8);
    }
    return { ...best, candidates: last };
  }
  const pl = init(
    "planner",
    "10 · Search, act, observe, repeat",
    '<label>Goal <input aria-label="Planning goal position" data-goal type="range" min="-250" max="250" value="150"><span data-goal-label></span></label><label>Horizon <select aria-label="Planning horizon" data-horizon><option>3</option><option selected>10</option><option>18</option></select></label><label>Model damping <select aria-label="Planner model damping" data-damping><option value=".9">Correct: 0.9</option><option value=".5">Mismatch: 0.5</option><option value="1.08">Mismatch: 1.08</option></select></label><button type="button" data-step>Take one planned action</button><button type="button" data-run>Run 20 actions</button><button type="button" data-reset>Reset</button>',
    "CEM: 96 candidates × 4 iterations; 12 elites. Cost = terminal position error² + 0.5 terminal velocity² + 0.005 action effort + 0.03 accumulated position error².",
  );
  let state = [-1.5, 0],
    history = [state.slice()],
    tick = 0,
    plan = null;
  function getPlan() {
    return cem(
      state,
      +pl.q("[data-goal]").value / 100,
      +pl.q("[data-horizon]").value,
      +pl.q("[data-damping]").value,
      100 + tick,
    );
  }
  function drawPlan() {
    pl.clear();
    const goal = +pl.q("[data-goal]").value / 100;
    pl.q("[data-goal-label]").textContent = goal.toFixed(2);
    plan = getPlan();
    const toX = (x) => Math.max(30, Math.min(610, 320 + x * 82));
    line(pl.ctx, [
      [35, 112],
      [605, 112],
    ]);
    line(
      pl.ctx,
      [
        [toX(goal), 30],
        [toX(goal), 155],
      ],
      colors.orange,
      1.5,
      [4, 4],
    );
    label(pl.ctx, "goal", toX(goal) - 12, 180, colors.orange);
    for (const candidate of plan.candidates)
      line(
        pl.ctx,
        candidate.path.map((s, j) => [
          toX(s[0]),
          110 - (j / plan.actions.length) * 65,
        ]),
        "#315eb12a",
        1,
      );
    line(
      pl.ctx,
      plan.path.map((s, j) => [
        toX(s[0]),
        110 - (j / plan.actions.length) * 65,
      ]),
      colors.blue,
      2,
    );
    history
      .slice(-30)
      .forEach((s, i) => dot(pl.ctx, toX(s[0]), 135, 2, "#32675655"));
    dot(pl.ctx, toX(state[0]), 112, 10, colors.green);
    label(pl.ctx, "candidate future positions rise upward with time", 40, 15);
    pl.out.textContent = `Step ${tick} · x=${fmt(state[0])}, v=${fmt(state[1])} · next action=${fmt(plan.actions[0])} · goal error=${fmt(Math.abs(state[0] - goal))}`;
  }
  function act() {
    plan = getPlan();
    state = dynamics(state, plan.actions[0], 0.9);
    history.push(state.slice());
    tick++;
  }
  pl.q("[data-step]").onclick = () => {
    act();
    drawPlan();
  };
  pl.q("[data-run]").onclick = () => {
    for (let i = 0; i < 20; i++) act();
    drawPlan();
  };
  pl.q("[data-reset]").onclick = () => {
    state = [-1.5, 0];
    history = [state.slice()];
    tick = 0;
    drawPlan();
  };
  pl.el
    .querySelectorAll("input,select")
    .forEach((e) => e.addEventListener("input", drawPlan));
  drawPlan();
  window.BookMath = Object.freeze({
    rng,
    normal,
    ep,
    closedEP,
    sigreg,
    cloud,
    stats,
    cem,
    dynamics,
  });
  window.BookLabs = { count: 10, version: 1 };
})();
