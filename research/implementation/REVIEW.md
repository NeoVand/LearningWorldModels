# Completed visual and laboratory revision

21 September 2026. This record supersedes the missing-figure status in the earlier editorial review. It covers the approved 97-brief plan across all 20 chapters. It is a critical authoring review supported by source comparisons, numerical checks, browser inspection and print inspection; it is not an independent human review or evidence from beginner user testing.

## Coverage

All 97 briefs have a source and reader anchor in `book/figure-plan.json`: 92 teaching figures and five integrations in the real training laboratory. `figure-atlas.html` links to every brief. The book also retains its 15 architecture/geometry diagrams, foundational numerical desks and reference code. Six new selected generated plates join the existing probability illustration. Each new subject has four or five composition alternatives in `illustration-gallery.html`; corrected editorial selections are embedded, so choosing alternatives is optional.

A few presentations differ from the initial sketches. G3 uses a selectable outer-product cell rather than timed animation. Several architecture comparisons use editable equation/role cards alongside existing diagrams. E4 computes neighborhood probabilities and KL contributions rather than running a full t-SNE optimizer. E6 is an explicitly constructed intervention example, not a claimed measurement of a trained network. These distinctions are recorded in the ledger and figure text.

## Chapter review

| Chapter | Question challenged | Implementation / finding |
|---|---|---|
| Opening | Can the reader see observation, hidden velocity and possible futures before the notation? | Exact two-link geometry, a moving simulator and sensor image, same-pose/opposite-velocity replay, three action branches. Introductory coordinates are explicitly hand-designed; learned forecasts are in the lab. |
| Philosophy | Does self-supervision have a concrete purpose and an honest scope? | Occlusion alternatives, appearance-versus-pose comparison and hierarchical time scales. Captions distinguish LeCun's broader proposal from the small implemented learner. |
| Geometry | Do coordinates, products, projections and rank have visible consequences? | Tiny-image encoding, inner/outer products, rotating projection, rank collapse and distance examples. Equal SVG scales preserve circles. |
| Probability | Are density, conditioning and uncertainty explained as operations? | Area rather than height, repeated sampling, Bayes mass accounting, mixture averages, Gaussian transformations and entropy calculations. |
| Clouds | Are isotropy and Gaussianity being conflated? | Centering/covariance, eigen-directions, finite-batch rank, whitening and a non-Gaussian isotropic counterexample. |
| Calculus | Can the reader inspect the local approximation and proof geometry? | Secants/tangents, finite differences, Jacobian columns, a locally transformed grid, ellipse constrained extrema and nested-box construction. Removed an abbreviated “immediate” justification. |
| Learning | Are neurons and training more than static terminology? | Neuron circuit, comparable activation/derivative plots, an actual small-network optimizer, chain rule, optimizer trajectories, ridge tradeoff and normalization axes. |
| JEPA | Is collapse visible, including its less obvious forms? | Pixel versus representation prediction, action alignment, one-direction collapse, shared-gradient paths and explicitly constructed variance/decorrelation transformations. |
| Testing | Is a penalty being confused with a calibrated decision? | Empirical CDF including ties, Monte Carlo null, fitted-null distinction, power and test-versus-training comparisons. Expanded the geometric explanation. |
| SIGReg | Can the reader connect complex averages, projections, integration and gradients? | Phasors, full-complex discrepancy, finite-batch floor, hidden projection dependence, quadrature, closed-form cross-check and gradient/collapse example. Split a cramped gradient display. |
| Implementation | Do the illustrated numbers match the manuscript and source? | Corrected the two-by-two trace to the exact manuscript batch. Each stage highlights the corresponding executable reference line. Tensor-axis, shared-gradient and episode-split figures remain explicit. |
| Laboratory | Is a fresh page useful, and does training really continue? | Actual random model evaluated at update zero; visible future candidates, embeddings and forecasts. Default training runs until paused. Resume preserves the model and optimizer. Shared replay compares simulator and learned futures. |
| Planning | Can action search be followed through its intermediate states? | Exhaustive-search growth, real CEM candidates/elites/refit, receding horizon, rollout-error recurrence and expectile asymmetry. |
| Evaluation | Are probes, prediction, geometry and control being treated as different evidence? | Computed linear probes, angle wrapping, neighborhood calculations, energy normalization, constructed interventions and the limits of straightness/probe evidence. |
| Theory | Are Gaussian arguments being advertised beyond their assumptions? | Sampling variance, isotropy assumptions, weighted local regression, score bias, Fisher information and a counterexample. Regularity and scope qualifications remain in the prose. |
| Transformers | Are tensor roles and masking understandable and theme-safe? | Pixel patch/token example, real causal attention, normalization comparison, AdaLN identity and self-/cross-attention roles. Canvas palettes refresh before redraw, including programmatic theme changes. |
| Lineage | Does the artwork invent a dependency or target flow? | Target/update/action comparisons plus corrected generated vignettes. Rejected misleading drafts are not embedded. |
| Paper | Are figures faithful to v1 and explicit about settings? | Architecture dimensions, action-block versus physical-step timing and reported results. Figure 6 rates, Figure 3 latency and Table 5 three-seed results are separated. The paper's printed spread convention is retained without inventing confidence intervals. |
| Capstone | Can the reader inspect failures and export actual evidence? | Live measurement report and JSON export; control is “not evaluated” until executed. Historical multi-seed and distant-goal failures remain visible. |
| Reference | Can a difficult equation be traced back to its prerequisites? | Semantic notation key and prerequisite route. Variables receive roles by context; constants and operators intentionally remain neutral. |

## Defects found and repaired

- Replaced the static opening scenario with synchronized physical motion, camera pixels and three possible action branches.
- Removed blank cold-start laboratory displays by evaluating actual random weights; no invented trained values are used.
- Removed the short training limit; paused after 5,075 updates and resumed to 5,095 without reset.
- Repaired the SIGReg trace's mismatch with the prose, its wrong reference-code selector, and a grid/margin combination that cropped code.
- Preserved SVG aspect ratios, separated occlusion path segments and clipped plots at their axes rather than clamping out-of-range curves into false plateaus.
- Corrected the cost shown for one-direction collapse and labeled hand-constructed transformations separately from optimizer results.
- Corrected generated JEPA arrows/labels and matching vector dimensions; clarified compatibility energy versus physical energy and magnitude illustration versus complex SIGReg loss.
- Unified math-role coloring, inline-code backgrounds, attention weights and canvas theme refresh. Neutral symbols are deliberate, not unprocessed math.
- Reworked print sizing and break rules after finding split teaching figures and orphaned labels; removed unusable print buttons.

## Verification evidence

- `visual-audit.json`: all 92 teaching figures at 1,440 and 390 pixels in both themes (368 figure captures); 186 slider endpoints; no invalid SVG coordinates, detected text outside SVG viewboxes, KaTeX errors, JavaScript errors or page-width overflow. All contact sheets were visually inspected. On phones, 44 long manuscript formulas use local horizontal scrolling; none of the new teaching figures overflow their math containers.
- `completion-check.json`: 67 choice states; true update-zero initialization and 14 future-image canvases; forecast playback/scrubbing; pause/resume; frozen-checkpoint forecasts; exact code-line highlighting; both themes; preserved SVG circle geometry; reduced-motion stepping. No browser errors.
- `continuous-training.json`: a separate real run from zero through 5,075 updates, then resume to 5,095, with three learned forecasts. The short completion check does not substitute for this long-run evidence.
- `visual-numerics.json`: opposite-velocity divergence; causal future-token invariance; CEM convergence and variance floor; actual neuron-model MSE improvement from 0.8771 to 0.0130 after 2,000 updates; SIGReg finite-difference error below 8e-12; finite-batch null floor consistent with the derived expectation. Trace excerpt lines are checked against the Python reference.
- `research/full-book/math-verification.json`: full reference learner, Adam, attention and planner checks. `verify-book-math.py` and `verify-pedagogy.mjs` passed again after the revision.
- `research/full-book/browser-inspection.json`: all chapters and existing diagrams, no broken anchors, malformed math or detected diagram collisions; foundational desk interactions work. The reader check covers responsive contents, keyboard behavior, both themes and real training/control.
- `print-audit.json`: 234-page PDF, no extracted characters outside page bounds and no pages with fewer than 100 extracted characters. All pages were visually surveyed in contact sheets; sensitive diagrams, code and forecast pages were checked at larger size. Recorded training and forecast snapshots are labeled with their actual update counts.

## Limits that remain scientific or editorial

The local model is a teaching experiment, not a reproduction of the paper's 15-million-parameter benchmark. Published benchmark experiments have not been rerun. General mathematical results and empirical claims are distinguished from derivations and definitions; the book should not be described as proving empirical findings or every theorem from axioms. The CF uniqueness and Fisher-information sections still warrant testing with real beginner readers. Automated checks and an authoring review do not establish human comprehension, formal accessibility certification or mathematical infallibility.

The PDF is 234 pages, exceeding the original approximate 100-page estimate to retain the expanded explanations and figures. Generated artwork remains illustrative, never experimental evidence. Generation provenance and corrections are in `assets/generated/infographics/README.md`; no unavailable model identity is claimed. Weight-checkpoint import/export is outside the reader UI; the export contains measurements. WebGPU performance depends on the browser and hardware, and the smaller tested Wasm fallback is not a promise of full-size CPU speed.
