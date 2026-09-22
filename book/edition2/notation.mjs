// Semantic classes, shared by prose, diagrams and live figures. Colors come from
// the reader theme; mathematical operators and unassigned dimensions stay neutral.
const colored = (role, body) => `{\\htmlClass{math-${role}}{${body}}}`;
export const macros = {
  "\\observed": colored("obs", "#1"),
  "\\encoded": colored("lat", "#1"),
  "\\predicted": colored("pred", "#1"),
  "\\action": colored("act", "#1"),
  "\\objective": colored("loss", "#1"),
  "\\auxone": colored("aux-one", "#1"),
  "\\auxtwo": colored("aux-two", "#1"),
  "\\auxthree": colored("aux-three", "#1"),
  "\\obs": colored("obs", "\\mathbf{o}"),
  "\\lat": colored("lat", "\\mathbf{z}"),
  "\\pred": colored("pred", "\\hat{\\mathbf{z}}"),
  "\\act": colored("act", "\\mathbf{a}"),
  "\\loss": colored("loss", "\\mathcal{L}"),
  "\\reg": colored("loss", "\\mathcal{R}"),
  "\\Z": colored("lat", "Z"),
  "\\U": colored("aux-one", "U"),
  "\\uvec": colored("aux-one", "\\mathbf{u}"),
  "\\proj": colored("lat", "h"),
  "\\cf": colored("aux-three", "\\varphi"),
  "\\ecf": colored("aux-three", "\\widehat\\varphi"),
  "\\target": colored("aux-one", "q"),
  "\\freq": colored("aux-two", "\\omega"),
  "\\disc": colored("loss", "D"),
  "\\stat": colored("loss", "T"),
};
export const mathTrust = (context) => context.command === "\\htmlClass";
// Authored macros carry meaning. Never infer a role from a letter: h can be
// an activation, a finite-difference step, or a kernel bandwidth.
export function semanticLatex(source) {
  return source.replace(
    /\\rm\s+([A-Za-z][A-Za-z -]*)/g,
    (_, word) => "\\mathrm{" + word.trim() + "}",
  );
}
