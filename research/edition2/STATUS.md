# Archived workshop milestone status

**Superseded by [the complete-book status](../full-book/STATUS.md).** The remainder records the earlier milestone and its then-outstanding work; it does not describe the current complete manuscript.

The second edition is developed in `second-edition.html`. The original `world-models.html` remains the first-edition reference. Neither artifact should be described as the completed second edition.

## Delivered in the first implementation milestone

- New opening organized around observation, learned representation, prediction, and action.
- Original generated explanatory plate, with its conceptual status stated in the caption.
- Five editable vector diagrams: joint-embedding training, the predictive-agent loop, Gaussian families, the SIGReg computation, and model-predictive control.
- Extended SIGReg chapter with 18 sections, proofs, worked exercises, tested Python reference code, an empirical characteristic-function experiment, and a distribution/gradient experiment.
- Semantic mathematical macros and build-time syntax highlighting.
- A real image-based learning laboratory adapted from Jaxverse: 152,464 parameters, 32 × 32 observations, eight latent coordinates, training from random initialization, matched prediction-only baseline, held-out diagnostics, and learned-model planning.
- Embedded JAX-style runtime in a blob worker. No external runtime download is needed. Pause/resume and local measurement export are supported.
- Responsive equal-scale canvas geometry and a revision notification that avoids automatically resetting an active learning experiment.

## Visual refinement following the design review

- Studied Pattern's typography, quiet surfaces, segmented controls, and minimal slider treatment without modifying that repository.
- Diagram equations now use KaTeX and the exact same semantic macros as the manuscript. Encoder/predictor subscripts, time indices, hats, and matrix dimensions are typeset rather than approximated with plain text.
- Reworked arrow routing and spacing. Automated path sampling found no intersections between arrow paths and actual label/math bounds in the five diagrams; all five were also visually inspected.
- Replaced visible dropdowns with compact choice groups; added thin custom sliders, subtle keyboard focus treatment, and HugeIcons action icons.
- Added embedded DM Sans and JetBrains Mono. Code has its own line height, aligned line numbers, syntax colors, and a separate copy action.
- Removed edition-history and construction-status prose from the reader-facing book. Development status remains here.
- Inspected desktop/mobile screenshots and every page of the rendered print companion at contact-sheet scale, with diagrams and code checked separately at larger scale.

Training verification is in `verification.json`; visual-only checks use `visual-verification.json` so rerunning presentation checks does not overwrite the learning measurements.

## Mathematical dependency map for the exemplar

| Needed result | Introduced/derived in the exemplar | Used in |
|---|---|---|
| Squared norm, nonnegative loss | §1 | Collapse construction |
| Regularization and a scalar convex optimum | §2 | Combined objective |
| Linearity of expectation and second moments | §3–4 | Naive target failure, covariance |
| Covariance, independence versus uncorrelatedness | §4 | Gaussian geometry and counterexamples |
| Gaussian normalization, Gaussian second moment | §4 proof | Density and characteristic function |
| KL nonnegativity and maximum entropy under moment constraints | §5 proof | Qualified Gaussian motivation |
| Complex arithmetic, conjugate, squared magnitude | §6 | Characteristic-function discrepancy |
| Euler identity via convergent series | §6 proof | Sample phasors |
| Differentiation under an integrable bound; integration by parts | §7 with conditions | Gaussian characteristic function |
| Independence of centered sample errors | §9 | Finite-batch sampling floor |
| Unit projection, independent Gaussian coordinates | §10 | Standard Gaussian projection |
| Gaussian smoothing and uniqueness | §10 proof | Cramér–Wold argument |
| Symmetry and trapezoid integration | §11 | Finite statistic |
| Tail and interpolation-error bounds | §11 proof | Approximation limits |
| Gaussian integral applied to pairwise terms | §12 | Independent numerical oracle |
| Multivariable chain rule | §13 | Sample and embedding gradients |
| Taylor expansion near collapse | §13 proof | Zero gradient versus escape directions |
| Linear dependence of centered samples | §16 | Covariance rank bound |

These derivations have numerical checks where applicable and an author audit. They have not received an independent human mathematical or novice-reader review. The broader prerequisite map will also need the learning, attention, planning, and downstream-theory chapters.

## Target-paper coverage that remains to be rewritten

| Paper/subject | Existing material | Second-edition work outstanding |
|---|---|---|
| LeCun 2022 position paper | Introductory functional diagram; public-source context | Obtain and read full primary text; expanded philosophy, EBM, latent variables, hierarchy |
| VICReg | First-edition lessons | Developed failure examples and exact penalty derivations |
| I-JEPA / V-JEPA | First-edition lessons | Architecture comparison and masking/target-branch teaching |
| V-JEPA 2 / DINO-WM / PLDM | First-edition lessons | Explain action conditioning and latent planning in the narrative |
| LeJEPA motivation/theorems | Gaussian geometric and entropy motivation; SIGReg derivation | Downstream probing assumptions, function classes, kernel/score arguments; full theorem audit |
| LeWM §3 / implementation | Objective and a small implemented learner | Full ViT, attention, normalization and action-conditioning prerequisites |
| LeWM planning | Working small-model CEM/MPC demonstration | Complete CEM derivation, uncertainty and long-horizon error chapter |
| LeWM evaluation and appendices | First-edition paper map and discrepancy notes | Rewrite each result with explicit baselines, assumptions, evidence and exercises |

## Engineering work still planned

- Model checkpoint save/load, including clearly specified optimizer/RNG state semantics. The current export saves measurements, not model weights.
- A displayed batch inspector and persistent experiment state across reloads.
- Further generated illustrations and the complete architecture comparison series.
- Wider browser/device support measurements. A small Wasm smoke test is not a full-speed CPU training benchmark.
- A full-book print edition with natural pagination once chapters are integrated.

## Initial failed control trial

The first packaged run used distant goals `(0.3, 0.25)`, `(-0.2, 0.55)`, `(0.65, -0.25)` from initial pose `(-1.35, 1.65)`. The tested first goal failed: minimum circular joint RMS error was about 1.558 rad over 40 actions. The raw record is retained in `first-training-run.json`.

The current first three goals are copied from Jaxverse's pre-existing local validation suite, before measuring this package: `(-0.9,1.0)`, `(-1.8,1.8)`, and `(-1.05,2.25)`. The original failed goal `(0.3,0.25)` remains selectable as the fourth, distant stress test. This change separates a local-control demonstration from a stress test; it does not erase the failed trial or establish general control reliability. The CEM seed sequence now matches the earlier Jaxverse suite. Both changes are recorded so results are not presented as a pure UI-only comparison.
