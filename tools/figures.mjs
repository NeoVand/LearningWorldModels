import katex from "katex";
import { macros, mathTrust } from "../book/edition2/notation.mjs";
const C = {
  obs: "#245ca6",
  lat: "#7044ad",
  pred: "#13796f",
  act: "#986009",
  loss: "#b34832",
  ink: "#394549",
  line: "#aab3b0",
};
const text = (x, y, s, color = C.ink, size = 13, anchor = "middle") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="${size}">${s}</text>`;
function math(x, y, tex, width = 150, height = 42, size = 18) {
  return `<foreignObject class="diagram-math" x="${x - width / 2}" y="${y - height / 2}" width="${width}" height="${height}" data-tex="${tex.replaceAll('"', "&quot;")}"><div xmlns="http://www.w3.org/1999/xhtml" style="height:100%;display:flex;align-items:center;justify-content:center;font-size:${size}px;color:${C.ink};line-height:1.2">${katex.renderToString(tex, { macros, trust: mathTrust, throwOnError: true, strict: "ignore", output: "htmlAndMathml" })}</div></foreignObject>`;
}
const node = (x, y, w, h, title, formula, role = "ink") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${C[role]}09" stroke="${C[role]}35" stroke-width="1"/>${text(x + w / 2, y + 25, title, C[role], 12)}${formula ? math(x + w / 2, y + 55, formula, w - 12, 40, 18) : ""}`;
const plain = (x, y, w, h, title, sub, role = "ink") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${C[role]}09" stroke="${C[role]}35"/>${text(x + w / 2, y + 29, title, C[role], 14)}${text(x + w / 2, y + 49, sub, C.ink, 10)}`;
const arrow = (id, d, role = "ink", dash = false) =>
  `<path class="diagram-arrow" d="${d}" fill="none" stroke="${C[role]}" stroke-opacity=".7" stroke-width="1.25" ${dash ? 'stroke-dasharray="4 5"' : ""} marker-end="url(#${id}-${role})"/>`;
function wrap(id, title, h, body, caption) {
  return `<svg viewBox="0 0 900 ${h}" role="img" aria-labelledby="${id}-title"><title id="${id}-title">${title}</title><defs>${Object.entries(
    C,
  )
    .map(
      ([k, c]) =>
        `<marker id="${id}-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="${c}"/></marker>`,
    )
    .join("")}</defs>${body}</svg><figcaption>${caption}</figcaption>`;
}
export function diagram(id) {
  if (id === "jepa")
    return wrap(
      id,
      "Training a joint-embedding predictive world model",
      458,
      text(
        450,
        24,
        "LEARN TO PREDICT, WHILE PRESERVING DISTINCTIONS",
        C.ink,
        10,
      ) +
        node(
          15,
          65,
          155,
          82,
          "Past and present",
          "\\obs_{t-1},\\;\\obs_t",
          "obs",
        ) +
        node(225, 65, 135, 82, "Encoder", "f_\\theta", "lat") +
        node(435, 65, 150, 82, "Predictor", "g_\\psi", "pred") +
        node(705, 65, 170, 82, "Predicted future", "\\pred_{t+1}", "pred") +
        node(15, 228, 155, 82, "Future image", "\\obs_{t+1}", "obs") +
        node(225, 228, 135, 82, "Encoder", "f_\\theta", "lat") +
        node(435, 228, 150, 82, "Target embedding", "\\lat_{t+1}", "lat") +
        node(
          705,
          228,
          170,
          82,
          "Prediction loss",
          "\\loss_{\\mathrm{pred}}",
          "loss",
        ) +
        arrow(id, "M170 106H225", "obs") +
        arrow(id, "M360 106H435", "lat") +
        arrow(id, "M585 106H705", "pred") +
        arrow(id, "M170 269H225", "obs") +
        arrow(id, "M360 269H435", "lat") +
        arrow(id, "M585 269H705", "lat") +
        arrow(id, "M790 147V228", "pred") +
        math(510, 187, "\\act_{t-1},\\;\\act_t", 155, 35, 17) +
        arrow(id, "M510 165V147", "act") +
        `<path d="M292 147V228" stroke="${C.lat}" stroke-opacity=".4" stroke-dasharray="3 5"/>` +
        text(308, 189, "shared weights", C.lat, 11, "start") +
        math(397, 75, "\\lat_{t-1},\\lat_t", 110, 31, 13) +
        `<path d="M15 341H875" stroke="#e3e5df"/>` +
        text(245, 369, "REGULARIZE THE ENCODER OUTPUTS", C.ink, 10) +
        math(
          245,
          411,
          "\\frac13\\sum_{r\\in\\{t-1,t,t+1\\}}\\reg(\\Z_r)",
          400,
          60,
          19,
        ) +
        text(681, 369, "OPTIMIZE THE COMBINED OBJECTIVE", C.ink, 10) +
        math(
          681,
          410,
          "\\loss=\\loss_{\\mathrm{pred}}+\\lambda\\reg",
          350,
          50,
          22,
        ),
      "Both branches use the same encoder and receive gradients. The prediction loss compares the predicted and observed future embeddings. Separately, SIGReg constrains the batch of encoder outputs at each of the three time positions. The dotted line denotes shared weights, not a flow of observations.",
    );
  if (id === "agent")
    return wrap(
      id,
      "A predictive agent considers consequences before acting",
      382,
      plain(15, 55, 160, 76, "Environment", "camera observations", "obs") +
        plain(235, 55, 145, 76, "Perception", "encode observations", "lat") +
        plain(440, 55, 170, 76, "World model", "imagine consequences", "pred") +
        plain(
          680,
          55,
          195,
          76,
          "Cost / preference",
          "compare with a goal",
          "loss",
        ) +
        plain(235, 225, 145, 76, "Memory", "retain useful context", "lat") +
        plain(
          440,
          225,
          170,
          76,
          "Actor / planner",
          "choose an action sequence",
          "act",
        ) +
        plain(680, 225, 195, 76, "Goal", "desired observation", "obs") +
        arrow(id, "M175 93H235", "obs") +
        arrow(id, "M380 93H440", "lat") +
        arrow(id, "M610 93H680", "pred") +
        arrow(id, "M307 225V131", "lat") +
        arrow(id, "M777 225V131", "obs") +
        arrow(id, "M713 131V182H588V225", "loss") +
        arrow(id, "M500 225V131", "act") +
        text(482, 179, "candidate", C.act, 10, "end") +
        text(482, 195, "actions", C.act, 10, "end") +
        arrow(id, "M440 263H406V347H94V131", "act") +
        text(245, 337, "execute, then observe again", C.act, 11),
      "A functional introduction to LeCun’s broader proposal. Perception, prediction, preference, and action selection play distinct roles. This small laboratory implements one limited loop; configuration and hierarchical reasoning require additional mechanisms.",
    );
  if (id === "sigreg")
    return wrap(
      id,
      "SIGReg turns a batch into a distributional discrepancy",
      282,
      node(
        15,
        52,
        165,
        86,
        "Embedding batch",
        "\\Z\\in\\mathbb R^{B\\times d}",
        "lat",
      ) +
        node(245, 52, 160, 86, "Project", "H=\\Z\\U", "lat") +
        node(470, 52, 165, 86, "Average phasors", "\\ecf_m(\\freq_k)", "pred") +
        node(700, 52, 180, 86, "Compare and integrate", "\\reg(\\Z)", "loss") +
        arrow(id, "M180 95H245", "lat") +
        arrow(id, "M405 95H470", "lat") +
        arrow(id, "M635 95H700", "pred") +
        math(325, 172, "H\\in\\mathbb R^{B\\times M}", 180, 36, 15) +
        math(552, 172, "\\freq_0,\\ldots,\\freq_{K-1}", 190, 36, 15) +
        math(790, 172, "\\target(\\freq)=e^{-\\freq^2/2}", 210, 36, 15) +
        text(
          450,
          230,
          "Average examples before squaring. Integrate frequencies. Average directions.",
          C.ink,
          12,
        ) +
        text(
          450,
          253,
          "The batch-size multiplier determines the final scaling.",
          C.ink,
          11,
        ),
      "One time position, with the same symbols used in the derivation. The projection matrix has unit-length columns. Averaging individual squared errors would define a different objective from squaring the discrepancy of the empirical mean.",
    );
  if (id === "families") {
    let body = "";
    const xs = [150, 450, 750],
      titles = ["Isotropic", "Diagonal covariance", "Full covariance"];
    xs.forEach((x, i) => {
      body += `<path d="M${x - 97} 155H${x + 97}M${x} 55V250" stroke="#dcded7"/>`;
      for (let j = 3; j >= 1; j--)
        body += `<ellipse cx="${x}" cy="155" rx="${i === 0 ? j * 25 : j * 32}" ry="${i === 0 ? j * 25 : j * 15}" ${i === 2 ? `transform="rotate(-32 ${x} 155)"` : ""} fill="none" stroke="${C.lat}" stroke-opacity="${0.22 + j * 0.17}" stroke-width="1.2"/>`;
      body +=
        text(x, 27, titles[i], C.ink, 14) +
        math(
          x,
          281,
          [
            "\\Sigma=\\sigma^2 I_2",
            "\\Sigma=\\operatorname{diag}(\\sigma_1^2,\\sigma_2^2)",
            "\\Sigma=\\begin{pmatrix}\\sigma_1^2 & c\\\\ c & \\sigma_2^2\\end{pmatrix}",
          ][i],
          285,
          42,
          16,
        );
    });
    return wrap(
      id,
      "Gaussian covariance geometry with equal horizontal and vertical units",
      313,
      body,
      "Equal-density contours with equal units on both axes. The isotropic covariance is a scalar multiple of the identity. Different diagonal variances stretch the axes. The off-diagonal entry c is the covariance between the two coordinates; a nonzero value tilts the contours.",
    );
  }
  if (id === "mpc")
    return wrap(
      id,
      "Plan through the learned model, then observe again",
      285,
      plain(15, 52, 170, 76, "Observed history", "two encoded images", "lat") +
        plain(
          245,
          52,
          170,
          76,
          "Imagine futures",
          "learned predictor",
          "pred",
        ) +
        plain(
          475,
          52,
          170,
          76,
          "Score candidates",
          "goal and action effort",
          "loss",
        ) +
        plain(
          705,
          52,
          180,
          76,
          "Execute an action",
          "physical environment",
          "act",
        ) +
        arrow(id, "M185 90H245", "lat") +
        arrow(id, "M415 90H475", "pred") +
        arrow(id, "M645 90H705", "act") +
        math(560, 164, "\\|\\pred-\\lat_{\\mathrm{goal}}\\|^2", 230, 42, 16) +
        arrow(id, "M795 128V231H99V128", "obs") +
        text(
          450,
          217,
          "Observe again; replace an imagined history with a measured one.",
          C.obs,
          12,
        ),
      "Model-predictive control. The displayed latent-distance expression is one component of the full horizon cost. The planner also accounts for action effort, executes one real action, and then replans from a new camera observation.",
    );
  const extra = extraDiagram(id);
  if (extra) return extra;
  throw Error("Unknown diagram " + id);
}

function extraDiagram(id) {
  if(id === 'projection') return wrap(id,'Projection is the closest point on a measuring line',350,
    `<path d="M90 285H780M140 310V30" stroke="#bcc4be" fill="none"/><path d="M140 285L660 60" stroke="${C.lat}" stroke-width="2"/><path d="M450 75L478 139" stroke="${C.line}" stroke-dasharray="5 5"/><circle cx="450" cy="75" r="6" fill="${C.obs}"/><circle cx="478" cy="139" r="6" fill="${C.lat}"/>`+
    arrow(id,'M140 285L450 75','obs')+arrow(id,'M140 285L478 139','lat')+
    math(426,43,'x',60,40,23)+math(578,151,'(u^\\top x)u',210,45,22)+math(711,66,'u',60,40,22)+
    text(450,326,'The perpendicular residual changes no coordinate along the measuring direction.',C.ink,13),
    'A projection retains one signed coordinate. The perpendicular residual contains distinctions this one measurement cannot see. The geometry uses equal units on both axes.');
  if(id === 'objectives') return wrap(id,'Three different learning targets',390,
    text(450,25,'THE TARGET DETERMINES WHAT AN ERROR MEANS',C.ink,11)+
    node(25,52,205,78,'Supervised input','\\obs','obs')+node(348,52,205,78,'Classifier','f_\\theta','lat')+node(670,52,205,78,'Supplied label','y','loss')+
    node(25,167,205,78,'Generative context','\\obs_t','obs')+node(348,167,205,78,'Pixel predictor','g_\\psi','pred')+node(670,167,205,78,'Future pixels','\\obs_{t+1}','obs')+
    node(25,282,205,78,'JEPA context','f_\\theta(\\obs_t)','lat')+node(348,282,205,78,'Latent predictor','g_\\psi','pred')+node(670,282,205,78,'Encoded target','f_\\theta(\\obs_{t+1})','lat')+
    [91,206,321].map(y=>arrow(id,`M230 ${y}H348`)+arrow(id,`M553 ${y}H670`)).join(''),
    'The rows compare information flow, not equivalent training procedures. A JEPA target is itself produced by an encoder; that creates the extra responsibility of preventing collapse. Actions can condition either kind of future predictor.');
  if(id === 'collapse') return wrap(id,'Prediction can be perfect after every distinction is erased',275,
    node(25,65,185,86,'Different images','\\obs^{(1)},\\obs^{(2)}','obs')+node(345,65,185,86,'Constant encoder','f_\\theta(\\obs)=c','lat')+node(685,65,190,86,'Constant predictor','g_\\psi(c,\\act)=c','pred')+
    arrow(id,'M210 108H345','obs')+arrow(id,'M530 108H685','lat')+math(450,219,'\\loss_{\\mathrm{pred}}=\\|c-c\\|^2=0',500,50,25),
    'Zero prediction error can coexist with zero useful information. The regularizer must make this representation undesirable without relying on target labels.');
  if(id === 'teacher') return wrap(id,'An online encoder and a moving-average target encoder',352,
    node(25,45,165,84,'Visible context','\\obs_{\\mathrm{ctx}}','obs')+node(275,45,165,84,'Online encoder','f_\\theta','lat')+node(525,45,165,84,'Predictor','g_\\psi','pred')+node(740,45,140,84,'Compare','\\loss','loss')+
    node(25,218,165,84,'Target input','\\obs','obs')+node(275,218,165,84,'Target encoder','f_{\\bar\\theta}','lat')+node(525,218,165,84,'Stop gradient','\\mathrm{sg}(\\lat)','lat')+
    arrow(id,'M190 87H275','obs')+arrow(id,'M440 87H525','lat')+arrow(id,'M690 87H740','pred')+arrow(id,'M190 260H275','obs')+arrow(id,'M440 260H525','lat')+arrow(id,'M690 260H810V129','lat')+
    `<path d="M357 129V218" stroke="${C.line}" stroke-dasharray="4 5"/>`+math(472,171,'\\bar\\theta\\leftarrow m\\bar\\theta+(1-m)\\theta',350,45,16),
    'Solid arrows carry data. The dashed connection denotes a parameter update, not backpropagation through the target. I-JEPA and V-JEPA use variants of this teacher pattern; LeWM instead differentiates through both shared encoder branches.');
  if(id === 'vicreg') return wrap(id,'VICReg constrains three different geometric properties',245,
    node(20,56,250,88,'Invariance','\\|\\lat-\\lat^{\\prime}\\|^2','pred')+node(325,56,250,88,'Variance floor','\\max(0,\\gamma-\\sigma_j)','lat')+node(630,56,250,88,'Off-diagonal covariance','\\sum_{j\\ne k}C_{jk}^2','loss')+
    text(145,183,'Related views agree.',C.ink,13)+text(450,183,'Each coordinate varies.',C.ink,13)+text(755,183,'Coordinates avoid redundancy.',C.ink,13),
    'Each box answers a different failure mode. These are illustrative component formulas; the chapter defines their batch averages and coefficients. None of these moment constraints alone establishes Gaussianity.');
  if(id === 'attention') return wrap(id,'Attention computes content-dependent weighted averages',375,
    node(20,50,170,88,'Token sequence','X','obs')+node(300,50,270,88,'Learned projections','Q=XW_Q,\\ K=XW_K','lat')+node(670,50,210,88,'Pairwise scores','QK^\\top/\\sqrt{d_k}','lat')+
    node(670,243,210,88,'Normalize rows','A=\\mathrm{softmax}(S)','pred')+node(335,243,235,88,'Weighted values','Y=AV','pred')+node(20,243,205,88,'Value projection','V=XW_V','obs')+
    arrow(id,'M190 94H300','obs')+arrow(id,'M570 94H670','lat')+arrow(id,'M775 138V243','lat')+arrow(id,'M670 287H570','pred')+arrow(id,'M105 138V243','obs')+arrow(id,'M225 287H335','obs')+
    text(450,194,'A causal mask excludes future positions before normalization.',C.ink,13),
    'Queries ask which information to retrieve; keys determine relevance; values provide the retrieved content. A row of A sums to one over allowed positions. The arithmetic, scaling, and masking are derived in the chapter.');
  if(id === 'rollout') return wrap(id,'Teacher forcing and free rollout use different histories',340,
    text(450,30,'TRAINING: OBSERVED CONTEXT',C.ink,11)+
    node(25,60,170,83,'Encode observation','\\lat_t','lat')+node(345,60,210,83,'Predict one step','g_\\psi(\\lat_t,\\act_t)','pred')+node(705,60,170,83,'Compare target','\\lat_{t+1}','lat')+
    arrow(id,'M195 102H345','lat')+arrow(id,'M555 102H705','pred')+
    text(450,202,'PLANNING: PREDICTIONS BECOME THE NEXT CONTEXT',C.ink,11)+
    node(25,231,170,83,'Observed start','\\lat_t','lat')+node(345,231,210,83,'First prediction','\\pred_{t+1}','pred')+node(705,231,170,83,'Next prediction','\\pred_{t+2}','pred')+
    arrow(id,'M195 273H345','act')+arrow(id,'M555 273H705','act')+
    math(265,248,'\\act_t',80,30,16)+math(625,248,'\\act_{t+1}',80,30,16),
    'The upper arrow into the target box denotes a comparison. In the lower row the predicted representation is actually fed forward. Thus one-step training accuracy does not by itself bound the quality of long imagined futures.');
  if(id === 'cem') return wrap(id,'Cross-entropy planning updates a distribution over action sequences',320,
    node(20,48,185,88,'Sample plans','A^{(i)}\\sim q_{\\mu,\\sigma}','act')+node(250,48,185,88,'Roll out','\\pred_{t+1:t+H}','pred')+node(480,48,185,88,'Rank by cost','J(A^{(i)})','loss')+node(710,48,170,88,'Keep elites','\\mathcal E','act')+
    arrow(id,'M205 92H250','act')+arrow(id,'M435 92H480','pred')+arrow(id,'M665 92H710','loss')+
    arrow(id,'M795 136V259H112V136','act')+math(450,227,'\\mu\\leftarrow\\operatorname{mean}_{i\\in\\mathcal E}A^{(i)}',470,50,21)+
    text(450,299,'Refit the spread as well. Repeat, execute, observe, and replan.',C.ink,13),
    'No gradient through the learned model is required by CEM. The model still determines every candidate score. This is action optimization with fixed model parameters, not additional representation training.');
  if(id === 'paper-architecture') return wrap(id,'LeWorldModel encodes patches into one projected frame token',365,
    node(20,50,170,86,'Image patches','224\\times224','obs')+node(245,50,170,86,'ViT-Tiny tokens','256+1','lat')+node(470,50,170,86,'CLS readout','\\mathbb R^{192}','lat')+node(705,50,175,86,'Projector + BN','\\lat_t\\in\\mathbb R^d','lat')+
    arrow(id,'M190 93H245','obs')+arrow(id,'M415 93H470','lat')+arrow(id,'M640 93H705','lat')+
    node(245,237,240,88,'History + causal predictor','g_\\psi(\\lat_{t-N+1:t},\\act)','pred')+node(610,237,270,88,'Predictor projector','\\pred_{t+1}','pred')+
    arrow(id,'M792 136V184H365V237','lat')+arrow(id,'M485 281H610','pred')+math(104,281,'\\act',90,40,21)+arrow(id,'M151 281H245','act'),
    'The patch count is (224/14)² = 256, plus one CLS token. Only the compact projected frame representation enters temporal prediction. BN means Batch Normalization. This is the paper architecture, distinct from the smaller browser MLP.');
  if(id === 'evidence') return wrap(id,'Three complementary tests of a learned representation',245,
    node(20,55,250,88,'Read out physical state','r_\\eta(\\lat)\\approx s','lat')+node(325,55,250,88,'Predict held-out transitions','\\pred_{t+1}\\approx\\lat_{t+1}','pred')+node(630,55,250,88,'Control the environment','s_{\\mathrm{final}}\\approx s_g','act')+
    text(145,185,'Information is accessible.',C.ink,13)+text(450,185,'Dynamics transfer to new data.',C.ink,13)+text(755,185,'The entire loop is useful.',C.ink,13),
    'A probe can succeed while planning fails. Each test addresses a different link in the perception–prediction–action chain; none can replace the others.');
  return null;
}
