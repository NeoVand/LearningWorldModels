export function rng(seed = 17) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function normal(r) {
  return (
    Math.sqrt(-2 * Math.log(Math.max(1e-12, r()))) * Math.cos(2 * Math.PI * r())
  );
}
export function cloud(kind = "gaussian", n = 128, seed = 17) {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const x = normal(r),
      y = normal(r);
    if (kind === "ring") {
      const a = r() * 2 * Math.PI;
      return [Math.SQRT2 * Math.cos(a), Math.SQRT2 * Math.sin(a)];
    }
    if (kind === "lines") return [x, (r() < 0.5 ? -1 : 1) * x];
    if (kind === "thin") return [x, 0.03 * y];
    if (kind === "zero") return [0, 0];
    if (kind === "shift") return [x + 1.5, y];
    return [x, y];
  });
}
export function directions(m = 32, seed = 501) {
  const r = rng(seed);
  return Array.from({ length: m }, () => {
    const a = 2 * Math.PI * r();
    return [Math.cos(a), Math.sin(a)];
  });
}
export function ecf(h, w) {
  let c = 0,
    s = 0;
  for (const x of h) {
    c += Math.cos(w * x) / h.length;
    s += Math.sin(w * x) / h.length;
  }
  return { c, s, q: Math.exp((-w * w) / 2) };
}
export function ep(
  h,
  { knots = 17, limit = 3, scaled = true, gradient = false } = {},
) {
  const n = h.length,
    delta = limit / (knots - 1),
    g = new Float64Array(n);
  let value = 0;
  for (let k = 0; k < knots; k++) {
    const w = k * delta,
      { c, s, q } = ecf(h, w),
      weight = (k === 0 || k === knots - 1 ? delta : 2 * delta) * q;
    value += weight * ((c - q) ** 2 + s * s);
    if (gradient)
      for (let b = 0; b < n; b++)
        g[b] +=
          (2 *
            weight *
            w *
            (-(c - q) * Math.sin(w * h[b]) + s * Math.cos(w * h[b]))) /
          n;
  }
  if (scaled) {
    value *= n;
    for (let b = 0; b < n; b++) g[b] *= n;
  }
  return gradient ? { value, gradient: Array.from(g) } : value;
}
export function closedEP(h) {
  let pair = 0;
  for (const a of h) for (const b of h) pair += Math.exp(-((a - b) ** 2) / 2);
  return (
    (Math.sqrt(2 * Math.PI) * pair) / h.length ** 2 -
    (2 *
      Math.sqrt(Math.PI) *
      h.reduce((s, x) => s + Math.exp((-x * x) / 4), 0)) /
      h.length +
    Math.sqrt((2 * Math.PI) / 3)
  );
}
export function sigreg(
  points,
  {
    m = 32,
    knots = 17,
    limit = 3,
    seed = 501,
    scaled = true,
    gradient = false,
  } = {},
) {
  let value = 0;
  const grad = points.map(() => [0, 0]);
  for (const u of directions(m, seed)) {
    const h = points.map((z) => z[0] * u[0] + z[1] * u[1]),
      result = ep(h, { knots, limit, scaled, gradient });
    value += (gradient ? result.value : result) / m;
    if (gradient)
      for (let b = 0; b < points.length; b++)
        for (let d = 0; d < 2; d++)
          grad[b][d] += (result.gradient[b] * u[d]) / m;
  }
  return gradient ? { value, gradient: grad } : value;
}
export function covariance(points) {
  const n = points.length,
    mu = [0, 0];
  for (const p of points) for (let j = 0; j < 2; j++) mu[j] += p[j] / n;
  let xx = 0,
    yy = 0,
    xy = 0;
  for (const p of points) {
    const a = p[0] - mu[0],
      b = p[1] - mu[1];
    xx += (a * a) / n;
    yy += (b * b) / n;
    xy += (a * b) / n;
  }
  const trace = xx + yy,
    disc = Math.sqrt((xx - yy) ** 2 + 4 * xy ** 2);
  return {
    mu,
    xx,
    yy,
    xy,
    eigenvalues: [(trace + disc) / 2, (trace - disc) / 2],
  };
}
