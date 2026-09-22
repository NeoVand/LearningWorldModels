# Reader-feedback revision — 21 September 2026

The public repository was created and the existing work pushed before these changes. Implementation followed in separate commits. This record describes changes already made, not a deferred work list.

## What changed

| Reader concern | Implemented response |
| --- | --- |
| The beginning does not explain what the course teaches | The opening now says “World models, from first principles,” identifies LeCun, JEPA and LeWorldModel, states the starting knowledge, names the mathematics taught along the way, and introduces the moving arm as the running problem. |
| Simple demonstrations occupy too much space | Removed a redundant row of opening-arm panels. Reduced foundational canvas heights and compacted the prediction desk. The selected action still changes the actual simulation. |
| The occlusion illustration appears to show a collision | Replaced it with a top-view spatial schematic and three camera views. Two generated revisions were rejected before selecting the third. Added a compact SVG animation in which a ball is drawn behind an opaque foreground screen. The text labels this as one possible continuation, not a learned forecast. |
| The downhill knob is a weak optimizer demonstration | Replaced it with a shaded contour landscape, clickable starting point, gradient direction, actual update path, one-step control and playback. |
| Momentum merely smooths a prescribed signal | SGD, momentum and Adam now recompute gradients at their own locations on three selectable landscapes. The display shows paths and loss histories. The normalized moving-average convention and Adam bias correction are stated explicitly. |
| The Jacobian grids are tiny and overlap | Put the exact nonlinear map and local linear approximation in separate enlarged panels with equal units and matched magnification. Show the matrix, exact displacement, linear prediction and error. The perturbation stays within the selected neighborhood. |
| The neuron has a missing output edge and too few capabilities | Rebuilt the connected input–sum–activation–output circuit. Added eight activations, weight/bias/amplitude controls, an input probe, optional tangent, saturation levels and numerical signal trace. |
| The neural-network demonstration lacks useful controls | Added target functions, four hidden widths, four activations, per-neuron contributions, parameter count, measured MSE, continuous training/pause, reset and a 200-update action. |
| Some curves are jagged | Increased shared analytical curve sampling to 401 points and added shaded area gradients. Discrete optimization and rollout samples remain discrete and are described that way. |
| Normalization is an unexplained collection of squares | Replaced it with before/after tables labeled by example and feature. Highlights show exactly which values supply the statistics. Changing example B demonstrates the difference between LayerNorm, training-time BatchNorm and stored evaluation statistics. |
| A letter inside “momentum” is colored accidentally | Normalize legacy LaTeX text commands before applying semantic symbol coloring. A regression check protects the text subscript. |
| Camera images stay white in dark mode | Applied a presentation-only sensor-image theme treatment in both the live laboratory and SVG camera views. The learner's input arrays remain unchanged. |
| One-step versus rollout accuracy is visually unclear | Rebuilt the comparison with aligned time indices, identical axes, separate panels, error shading and RMSE. Both use the same stated model; only the source of its next input differs. |
| The figure index goes stale | The normal build now regenerates the atlas from current figure titles/questions and the coverage ledger. |

The liked “Measuring a cloud” illustration remains. Equations and captions identify teaching functions, simulator measurements and learned predictions separately. Rewritten introductions favor concrete actions and numerical examples over claims that an idea is easy.

## Verification performed

- `tools/verify-polish.mjs`: finite-difference checks of landscape gradients and all eight activation derivatives; optimizer convergence; normalization dependence; rollout alignment; text-subscript handling; pointer controls; neural training controls; camera theme styling; desktop/phone geometry in both themes. Results: [verification.json](verification.json).
- `tools/verify-visual-numerics.mjs`: figure numerical checks, including actual neural curve-fitting progress. All 48 target/width/activation combinations were also exercised for 200 updates and remained finite.
- `tools/verify-completed-book.mjs` and `tools/verify-reader.mjs`: untrained forecasts, real short training and resume, control actions, responsive contents, reduced-motion behavior and both themes.
- `tools/audit-visuals.mjs`: all 92 teaching figures at 1440px and 390px in both themes, with 200 slider endpoint states. No JavaScript errors, invalid SVG coordinates or out-of-viewBox SVG text were reported. The phone layout retains local scrolling for 44 long manuscript formulas; these do not widen the page. Results: [visual-audit.json](../implementation/visual-audit.json).
- Visually inspected all desktop-light and phone-dark figure contact sheets, with enlarged screenshots of the rebuilt demonstrations and theme variants. Automated coverage was used to find candidates for inspection, not as a substitute for visual judgment.
- Rebuilt the 232-page PDF, rendered every page, inspected all ten contact sheets and enlarged the revised optimizer, Jacobian, neuron, normalization and rollout pages. Text-boundary checks found no text outside page bounds. Results: [print-audit.json](print-audit.json).
- Prerequisite-order and output-alias checks pass. Both HTML filenames contain the same course.

The previously recorded long world-model training run was not repeated merely for visual changes. Short real training and control checks were rerun. Published research benchmark results were not reproduced in this revision.

## Generated-image provenance

The selected replacement is `assets/generated/infographics/occlusion-clear-path.png`. The exact generation and correction prompts, including the rejected attempts, are in [occlusion-revision-prompts.json](../../assets/generated/infographics/occlusion-revision-prompts.json). Selection metadata and the illustration gallery now point to it. The schematic explains occlusion; it is not a calibrated camera-geometry figure. The animated camera-view example uses editable SVG geometry.

## Limits of this review

This is an implementation and editorial revision informed by the reader's specific criticism. It is not an independent beginner comprehension study, a new proof audit of every manuscript equation, or an assertion that visual taste is settled. The course is a working draft. Its 20 chapters and implemented visual briefs describe coverage; they do not by themselves establish accessibility to every first-year reader. Printed experiments show snapshots, while the HTML retains their controls and animation.
