// Semantic classes, shared by prose, diagrams and live figures. Colors come from
// the reader theme; mathematical operators and unassigned dimensions stay neutral.
const colored = (role, body) => `\\htmlClass{math-${role}}{${body}}`;
export const macros = {
  "\\obs": colored("obs", "\\mathbf{o}"),
  "\\lat": colored("lat", "\\mathbf{z}"),
  "\\pred": colored("pred", "\\hat{\\mathbf{z}}"),
  "\\act": colored("act", "\\mathbf{a}"),
  "\\loss": colored("loss", "\\mathcal{L}"),
  "\\reg": colored("loss", "\\mathcal{R}"),
  "\\Z": colored("lat", "Z"),
  "\\U": colored("act", "U"),
  "\\uvec": colored("act", "\\mathbf{u}"),
  "\\proj": colored("lat", "h"),
  "\\cf": colored("pred", "\\varphi"),
  "\\ecf": colored("pred", "\\widehat\\varphi"),
  "\\target": colored("obs", "q"),
  "\\freq": colored("act", "\\omega"),
  "\\disc": colored("loss", "D"),
  "\\stat": colored("loss", "T"),
};
export const mathTrust = (context) => context.command === "\\htmlClass";
// Only declared variables receive a role. Protect prose/operator names and LaTeX
// environment arguments before walking single variable tokens. This never colors
// letters inside words such as “softmax”, “pmatrix”, or “training”.
const base = {
  x: "obs",
  X: "obs",
  y: "pred",
  z: "lat",
  Z: "lat",
  h: "lat",
  u: "act",
  L: "loss",
  "\\omega": "act",
  "\\varphi": "pred",
  "\\lambda": "act",
};
const scoped = {
  geometry: { y: "obs" },
  calculus: { y: "obs" },
  clouds: { y: "lat" },
  probability: { y: "obs", p: "obs" },
  testing: { D: "loss", T: "loss" },
  sigreg: { D: "loss", T: "loss", q: "obs" },
  implementation: { q: "obs" },
  theory: { p: "obs", m: "pred", h: "act" },
  transformers: { Q: "act", K: "obs", V: "lat" },
};
export function semanticLatex(source, chapter = "") {
  if (source.includes("\\htmlClass") || source.includes("\\textcolor"))
    return source;
  const saved = [];
  let s = source.replace(
    /\\(?:text|operatorname|mathrm|mathsf|begin|end)\*?\{[^{}]*\}/g,
    (m) => "§" + (saved.push(m) - 1) + "§",
  );
  const roles = { ...base, ...scoped[chapter] };
  s = s.replace(/\\[A-Za-z]+|[A-Za-z]/g, (t) =>
    roles[t] ? "{" + colored(roles[t], t) + "}" : t,
  );
  return s.replace(/§(\d+)§/g, (_, i) => saved[+i]);
}
