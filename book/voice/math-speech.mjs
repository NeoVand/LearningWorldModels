// Speech for source mathematics. The surrounding sentence is supplied by the
// index builder: a formula is introduced in context, never as a string of TeX.
const words = new Map([
  ["\\obs", "the observation"],
  ["\\lat", "the latent representation"],
  ["\\pred", "the predicted representation"],
  ["\\act", "the action"],
  ["\\loss", "the loss"],
  ["\\reg", "the regularization penalty"],
  ["\\Z", "the batch of embeddings"],
  ["\\U", "the projection directions"],
  ["\\uvec", "a unit direction"],
  ["\\proj", "a projected embedding"],
  ["\\cf", "the characteristic function"],
  ["\\ecf", "the empirical characteristic function"],
  ["\\target", "the Gaussian target"],
  ["\\freq", "frequency omega"],
  ["\\disc", "the discrepancy"],
  ["\\stat", "the test statistic"],
  ["\\theta", "theta"],
  ["\\psi", "psi"],
  ["\\phi", "phi"],
  ["\\varphi", "phi"],
  ["\\omega", "omega"],
  ["\\alpha", "alpha"],
  ["\\beta", "beta"],
  ["\\gamma", "gamma"],
  ["\\delta", "delta"],
  ["\\epsilon", "epsilon"],
  ["\\lambda", "lambda"],
  ["\\mu", "mu"],
  ["\\nu", "nu"],
  ["\\pi", "pi"],
  ["\\sigma", "sigma"],
  ["\\tau", "tau"],
  ["\\rho", "rho"],
  ["\\eta", "eta"],
  ["\\xi", "xi"],
  ["\\odot", " elementwise multiplied by "],
  ["\\ldots", " through "],
  ["\\cdots", " and so on "],
  ["\\mathbf1", " the indicator "],
  ["\\infty", "infinity"],
  ["\\mathbb E", "the expectation of"],
  ["\\mathbb{E}", "the expectation of"],
  ["\\mathbb R", "the real numbers"],
  ["\\mathbb{R}", "the real numbers"],
  ["\\operatorname{Var}", "the variance of"],
  ["\\operatorname{Cov}", "the covariance of"],
  ["\\operatorname{KL}", "the K L divergence"],
  ["\\operatorname{Re}", "the real part of"],
  ["\\operatorname{Im}", "the imaginary part of"],
  ["\\mathcal N", "a Gaussian distribution"],
  ["\\mathcal{N}", "a Gaussian distribution"],
]);

function readGroup(source, start) {
  let i = start;
  while (source[i] === " ") i++;
  if (source[i] !== "{") return { value: source[i] ?? "", end: i + 1 };
  let depth = 0;
  for (let j = i; j < source.length; j++) {
    if (source[j] === "{" && source[j - 1] !== "\\") depth++;
    if (source[j] === "}" && source[j - 1] !== "\\") {
      depth--;
      if (depth === 0) return { value: source.slice(i + 1, j), end: j + 1 };
    }
  }
  return { value: source.slice(i + 1), end: source.length };
}

function expandStructured(source) {
  let result = "";
  for (let i = 0; i < source.length; ) {
    const rest = source.slice(i);
    const aggregate = rest.match(/^\\(sum|prod|int)/);
    if (aggregate) {
      let next = i + aggregate[0].length;
      let lower = "",
        upper = "";
      for (let count = 0; count < 2; count++) {
        if (source[next] === "_") {
          const part = readGroup(source, next + 1);
          lower = mathToSpeech(part.value);
          next = part.end;
        } else if (source[next] === "^") {
          const part = readGroup(source, next + 1);
          upper = mathToSpeech(part.value);
          next = part.end;
        }
      }
      const noun = { sum: "sum", prod: "product", int: "integral" }[
        aggregate[1]
      ];
      const lowerLink =
        lower && !upper && aggregate[1] !== "int" ? " over " : " from ";
      result += ` the ${noun}${lower ? `${lowerLink}${lower}` : ""}${upper ? ` to ${upper}` : ""} of `;
      i = next;
      continue;
    }
    if (rest.startsWith("\\|")) {
      const end = source.indexOf("\\|", i + 2);
      if (end > i) {
        result += ` the length of ${mathToSpeech(source.slice(i + 2, end))} `;
        i = end + 2;
        continue;
      }
    }
    const fraction = rest.match(/^\\(?:dfrac|tfrac|frac)/);
    if (fraction) {
      const top = readGroup(source, i + fraction[0].length);
      const bottom = readGroup(source, top.end);
      result += ` the quantity ${mathToSpeech(top.value)} divided by ${mathToSpeech(bottom.value)} `;
      i = bottom.end;
      continue;
    }
    if (rest.startsWith("\\sqrt")) {
      const inner = readGroup(source, i + 5);
      result += ` the square root of ${mathToSpeech(inner.value)} `;
      i = inner.end;
      continue;
    }
    const semantic = rest.match(
      /^\\(observed|encoded|predicted|action|objective|auxone|auxtwo|auxthree)/,
    );
    if (semantic) {
      const inner = readGroup(source, i + semantic[0].length);
      const role =
        {
          observed: "observed",
          encoded: "encoded",
          predicted: "predicted",
          action: "action",
          objective: "objective",
        }[semantic[1]] ?? "";
      result += ` ${role} ${mathToSpeech(inner.value)} `;
      i = inner.end;
      continue;
    }
    if (rest.startsWith("\\mathcal")) {
      const inner = readGroup(source, i + 8);
      result += ` ${inner.value === "L" ? "loss" : inner.value === "R" ? "regularizer" : inner.value} `;
      i = inner.end;
      continue;
    }
    if (
      rest.startsWith("\\text") ||
      rest.startsWith("\\mathrm") ||
      rest.startsWith("\\mathbf") ||
      rest.startsWith("\\mathsf")
    ) {
      const length = rest.match(/^\\(?:text|mathrm|mathbf|mathsf)/)[0].length;
      const inner = readGroup(source, i + length);
      result += ` ${inner.value} `;
      i = inner.end;
      continue;
    }
    result += source[i++];
  }
  return result;
}

function speakIndex(index) {
  const cleaned = index.replaceAll("\\mathrm", "").replace(/[{}]/g, "").trim();
  if (/^t(?:[+-]\d+)?$/.test(cleaned))
    return ` at time ${cleaned.replace("+", " plus ").replace("-", " minus ")}`;
  if (/^[a-zA-Z]$/.test(cleaned)) return ` indexed by ${cleaned}`;
  return ` indexed by ${mathToSpeech(cleaned)}`;
}

function speakPower(power) {
  const cleaned = power.replace(/[{}]/g, "").trim();
  if (cleaned === "2") return " squared";
  if (cleaned === "3") return " cubed";
  if (cleaned === "-1") return " inverse";
  if (cleaned === "\\top" || cleaned === "T") return " transpose";
  return ` to the power ${mathToSpeech(cleaned)}`;
}

function expandScripts(source) {
  let out = "";
  for (let i = 0; i < source.length; ) {
    if (source[i] === "_" || source[i] === "^") {
      const isSub = source[i] === "_";
      const group = readGroup(source, i + 1);
      out += isSub ? speakIndex(group.value) : speakPower(group.value);
      i = group.end;
      continue;
    }
    out += source[i++];
  }
  return out;
}

// A short authored explanation takes priority for the formulas that carry the
// argument of the book. The general reader below still covers every formula.
export const authoredMath = [
  [
    /\\mathbb\s*E\[aX\+bY\]=a\\mathbb\s*E\[X\]\+b\\mathbb\s*E\[Y\]/,
    "Expectation is linear: scale each random variable's average by its coefficient, then add. X and Y need not be independent.",
  ],
  [
    /\\operatorname\{Var\}\(X\)=\\mathbb\s*E\[X\^2\]-\\mu\^2/,
    "Variance equals the average of X squared minus the square of X's average. This follows by expanding the squared distance from the mean.",
  ],
  [
    /P\(A\\mid B\)=\\frac\{P\(B\\mid A\)P\(A\)\}\{P\(B\)\}/,
    "Bayes' rule updates the chance of A after observing B. Multiply the likelihood of B under A by the prior chance of A, then divide by the overall chance of B.",
  ],
  [
    /\\mathbb\s*E\[\(Y-c\)\^2\\mid x\]=\\operatorname\{Var\}/,
    "Conditional mean squared error has two parts: the irreducible spread of possible futures and the squared distance between our prediction and their mean. The second part is smallest when we predict the mean.",
  ],
  [
    /\\cf_X\(\\freq\).*?\\mathbb\s*E\[e\^\{i\\freq X\}\]/s,
    "A characteristic function averages a unit arrow for each sample. Its real coordinate averages cosines; its imaginary coordinate averages sines. Changing frequency reveals different structure in the distribution.",
  ],
  [
    /\\target\(\\freq\).*?e\^\{-\\freq\^2\/2\}/,
    "The standard Gaussian's characteristic function starts at one and decays as exponential of negative frequency squared over two. This is the target shape for each normalized projection.",
  ],
  [
    /\\reg\(\\Z\).*?\\sum_\{m=1\}/s,
    "SIGReg projects each embedding batch along sampled directions. At each frequency it compares the empirical complex average with the Gaussian target, squares both real and imaginary error, weights the result, and averages over directions. The batch factor keeps the loss scale meaningful.",
  ],
  [
    /\\objective\{L\}_\{\\mathrm\{pred\}\}.*?\\pred.*?\\lat/s,
    "The prediction loss is the squared distance between the predictor's next latent vector and the encoder's latent vector for the actual next observation. Both sides are learned; the regularizer prevents the trivial constant-vector solution.",
  ],
  [
    /\\operatorname\{softmax\}/,
    "Softmax turns each attention row's similarity scores into nonnegative weights that sum to one. A mask removes forbidden positions before exponentiation and normalization.",
  ],
];

export function mathToSpeech(latex) {
  let s = String(latex).trim();
  if (!s) return "";
  s = s
    .replace(
      /\\begin\{(?:aligned|align\*?|gathered|cases|pmatrix|bmatrix)\}/g,
      " ",
    )
    .replace(
      /\\end\{(?:aligned|align\*?|gathered|cases|pmatrix|bmatrix)\}/g,
      " ",
    )
    .replaceAll("\\left", "")
    .replaceAll("\\right", "")
    .replaceAll("\\bigl", "")
    .replaceAll("\\bigr", "")
    .replaceAll("\\quad", " ")
    .replaceAll("\\qquad", " ")
    .replaceAll("\\,", " ")
    .replaceAll("\\;", " ")
    .replaceAll("\\!", "")
    .replaceAll("\\\\", "; then ")
    .replaceAll("&", " ");
  s = s.replace(
    /\\operatorname\{KL\}\(([^()]+)\\\|([^()]+)\)/g,
    (_, from, to) =>
      ` the K L divergence from ${mathToSpeech(from)} to ${mathToSpeech(to)} `,
  );
  s = s.replace(
    /(?<!\\)\|([^|\n]+)(?<!\\)\|/g,
    (_, inside) => ` the absolute value of ${mathToSpeech(inside)} `,
  );
  s = expandStructured(s);
  // Longest-first replacement prevents a short macro from cutting into one
  // with the same prefix (for example \cf and \ecf).
  for (const [symbol, spoken] of [...words].sort(
    (a, b) => b[0].length - a[0].length,
  ))
    s = s.replaceAll(symbol, ` ${spoken} `);
  s = s
    .replace(/\\sum/g, " the sum of ")
    .replace(/\\prod/g, " the product of ")
    .replace(/\\int/g, " the integral of ")
    .replace(/\\partial/g, " partial ")
    .replace(/\\nabla/g, " gradient of ")
    .replace(/\\exp/g, " exponential of ")
    .replace(/\\log/g, " logarithm of ")
    .replace(/\\sin/g, " sine of ")
    .replace(/\\cos/g, " cosine of ")
    .replace(/\\tanh/g, " hyperbolic tangent of ")
    .replace(/\\argmin/g, " the argument that minimizes ")
    .replace(/\\argmax/g, " the argument that maximizes ")
    .replace(/\\min/g, " minimum of ")
    .replace(/\\max/g, " maximum of ")
    .replace(/\\mathrm\{([^}]*)\}/g, "$1")
    .replace(/\\operatorname\{([^}]*)\}/g, "$1");
  s = expandScripts(s);
  s = s
    .replace(/\\(?:leq?|leqslant)/g, " is less than or equal to ")
    .replace(/\\(?:geq?|geqslant)/g, " is greater than or equal to ")
    .replace(/\\approx/g, " is approximately ")
    .replace(/\\neq/g, " is not equal to ")
    .replace(/\\in/g, " belongs to ")
    .replace(/\\mid/g, " given ")
    .replace(/\\cdot|\\times/g, " times ")
    .replace(/\\top/g, " transpose ")
    .replace(/\\to\b|\\rightarrow/g, " tends to ")
    .replace(/\\propto/g, " is proportional to ")
    .replace(/\\Vert|\\\|/g, " the length of ")
    .replace(/\\overline/g, " conjugate of ")
    .replace(/\\bar/g, " mean ")
    .replace(/\\hat/g, " predicted ")
    .replace(/\\\{/g, " if ")
    .replace(/\\\}/g, " ")
    .replace(/\\[A-Za-z]+/g, (unknown) =>
      unknown.slice(1).replace(/([a-z])([A-Z])/g, "$1 $2"),
    )
    .replace(/[{}]/g, "")
    .replace(/\^/g, " to the power ")
    .replace(/=/g, " equals ")
    .replace(/\+/g, " plus ")
    .replace(/−|-/g, " minus ")
    .replace(/\*/g, " times ")
    .replace(/\/+/g, " divided by ")
    .replace(/\|/g, " given ")
    .replace(/\[/g, " of ")
    .replace(/\]/g, " ")
    .replace(/[(),:;]/g, (punctuation) => (punctuation === ";" ? "; " : " "))
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

export function explainEquation(latex, context = "") {
  const authored = authoredMath.find(([pattern]) => pattern.test(latex));
  if (authored) return authored[1];
  const spoken = mathToSpeech(latex);
  const surrounding = context.trim();
  return surrounding
    ? `${surrounding} In the equation, ${spoken}.`
    : `The equation says ${spoken}.`;
}
