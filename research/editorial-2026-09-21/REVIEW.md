# Editorial and visual review — 21 September 2026

> Historical record, superseded by `research/implementation/REVIEW.md`. Subsequent visual-coverage audit: the checks below inspected existing content but missed missing teaching figures, the blank cold-start controller, inline-code dark-mode styling, and the absent moving opening scenario. This record must not be read as a visual-completeness claim. See `book/FIGURE_PLAN.md` and `research/visual-planning/baseline.json` for the current gaps and plan.

This is a critical review and revision of all 20 chapters by the authoring assistant, supported by primary-source comparison, numerical checks, and browser/print inspection. It is not an independent human review or a claim that a novice has successfully learned the whole course.

## Reader and illustration changes

- Removed every chapter-end “Before moving on / Continue” block. The next chapter follows directly.
- Rebuilt the contents panel as compact chapter groups. It opens and closes on desktop and mobile, supports section search and Escape, and removes closed content from keyboard navigation. Mobile opening makes the reading surface inert. Desktop preference is saved.
- Adopted Pattern's cool blue-gray surfaces and a persistent day/night switch. Semantic colors remain consistent across text, KaTeX, SVG, plots, and highlighted code. Print uses white paper regardless of the reader theme.
- Used HugeIcons for reader controls, kept segmented choices instead of exposed native dropdowns, retained subtle keyboard focus cues, and respected reduced-motion preferences.
- Replaced raster robot illustrations with SVG geometry adapted from Jaxverse's `src/lib/components/demos/world/Instrument.svelte`. Tapered links, bearing layers, base ticks, and the simple tip are shared between the opening plate, appearance comparison, and live control instrument. Positions come from the same simulator geometry as the laboratory. There are two links, two rotating joints, and no invented wrist or gripper.
- Replaced the three old generated plates with scene illustrations of occlusion, branching outcomes, and planning at multiple scales. These are labeled illustrations, never measurements or learned forecasts. Prompts and provenance: `assets/generated/renewed/README.md`. The built-in generator did not expose or verify a Sunburst model ID.

## Chapter-by-chapter findings

| Chapter | Challenge applied | Result / correction |
|---|---|---|
| 1. Opening | Does the running example match the real experiment? Can the opening be understood before formulas? | Replaced anatomically misleading generated arm with exact simulator geometry. Pose and hidden velocity remain the concrete first question. |
| 2. Philosophy | Are self-supervision, action labels, goals, and LeCun's broader proposal being conflated? | Retained their explicit separation; new occlusion scene and identical-pose SVG comparison make the distinctions visible. Hierarchy image illustrates scales without pretending that the browser implements H-JEPA. |
| 3. Geometry | Are embeddings explained as operations, rather than assumed to contain named physical quantities? | Checked the tiny-image map, matrix multiplication, projection and distance derivations; equal-axis diagrams retained. |
| 4. Probability | Is conditioning on a continuous value being justified by dividing by a zero-probability event? | Added joint/marginal/conditional densities and their normalization, a numeric conditional-mean example, and an explicit definition of joint mass and independence. |
| 5. Clouds | Are whitening, isotropy, rank and Gaussianity incorrectly equated? | Checked the rank bound, B versus B−1 derivation, eigendecomposition example, and whitening counterexample. The general spectral proof remains after calculus. |
| 6. Calculus | Are advanced claims hidden in phrases such as “a convergent subsequence exists”? | Expanded the nested-cube argument. Added a logarithm/exponential bridge proving derivatives and the product-to-sum identity needed by later likelihoods. |
| 7. Learning | Does code use an activation before teaching it? Are optimizer steps confused with environment time? | Added GELU and its derivative before implementation; changed Adam's update index to k; removed the inflated “theorems of intelligence” heading. Checked the hand update and ridge derivation. |
| 8. JEPA | Does an anti-collapse term's positive value imply a nonzero escape gradient? | Retained and checked the distinction, shared-target gradient paths, contrastive/teacher/variance mechanisms, and action alignment. |
| 9. Testing | Does the sorted KS proof handle ties? Is the training penalty being sold as a calibrated test? | Corrected the proof for tied samples; replaced the overly broad gradient claim with piecewise differentiability and the maximum's concentrated gradient. Null calibration, fitted-null changes, and power remain separate. |
| 10. SIGReg | Are entropy, factorials and probability limit arguments silently assumed? Is finite matching being mistaken for a population theorem? | Added discrete entropy and examples, factorial notation and the exponential Taylor remainder; expanded the bounded-expectation limit in CF uniqueness. Removed “honest claims” wording. Retained finite-batch floors, quadrature/truncation errors, independent closed-form check and collapse stationarity analysis. |
| 11. Implementation | Do axes, target gradients and reductions agree with the executable learner? | Checked three positions, batch-axis empirical CF, batch multiplier, feature-averaged MSE, and all-parameter numerical gradients. |
| 12. Laboratory | Are the curves real? Is simulator state leaking into planning? | Fresh 20-update WebGPU run and two executed control actions passed. The live arm is now SVG. Existing three-seed 5,000-update measurements remain explicitly labeled historical measurements, not rerun claims. |
| 13. Planning | Is “maximum likelihood” used before it has an explanation? What happens if all elites coincide? | Replaced the abbreviated CEM argument with the Gaussian product likelihood, logarithm, mean and variance derivatives, and the zero-variance edge case. Used n_e for elite count instead of SIGReg's K. |
| 14. Evaluation | Is rotational symmetry exact for fixed random projections? Is t-SNE defined only through jargon? | Qualified invariance for population/expected SIGReg versus finite fixed directions. Added explicit normalized neighborhood probabilities and their sum-to-one argument. Retained separation of probe, prediction and control evidence. |
| 15. Theory | Does minimizing a Fisher-information bound prove optimality for every downstream task? | Retained the explicit negative answer and regularity/tail conditions; clarified the expectation of a squared bias term, and replaced the generic theorem-themed opening with the actual statistical question. |
| 16. Transformers | Are softmax and permutation equivariance asserted rather than derived? Can a projector magically restore dimension? | Expanded the quotient-rule calculation; proved unmasked permutation equivariance; added v>0 to the zero-epsilon LayerNorm calculation and clarified that a smooth deterministic projector cannot create independent degrees of freedom. |
| 17. Lineage | Does the chapter still promise derivations already taught? Does it compare methods as a simplistic ranking? | Corrected stale future tense and replaced “contracts” language with training setups. Targets, encoder updates, and action inputs remain explicit. |
| 18. Paper | Are v1's claims being conflated with later versions or pinned-code defaults? | Rechecked pinned SIGReg reduction, 17 nodes/1,024 directions, transformer dimensions, projector and defaults. Retained documented paper/code differences and restrictions on empirical claims. No benchmark reproduction claim. |
| 19. Capstone | Does a worked solution admit failures and specify information boundaries? | Checked shapes, historical numbers, comparisons, and distinctions between first arrival and final occupancy. The distant-goal failures remain visible. |
| 20. Reference | Do colors, links and dependencies match the revised book? | Updated the loss role to rose; regenerated the learning-route table and verified all internal anchors. The full v1 coverage map is preserved. |

## Verification

- `reader-check.json`: 1440, 820 and 390 pixels, both themes; no page overflow, missing images, or distorted SVG circles; contents/search/Escape/mobile keyboard checks; persisted theme; theme-aware plot repaint; fresh WebGPU training and live SVG control.
- `accessibility-check.json`: image alternatives, input labels and exposed button names present. Sampled body/caption/code/eyebrow contrast is at least 4.67:1 in day mode and 7.52:1 in night mode. This is a targeted check, not formal WCAG certification or assistive-technology testing.
- `research/full-book/browser-inspection.json`: all 20 chapters, 15 architecture/geometry diagrams, 79 KaTeX diagram labels, no broken anchors, malformed math, detected arrow/label crossings or desktop equation overflow. Six foundational desks respond. Native selects remain hidden behind labeled choices.
- `research/edition2/visual-verification.json`: browser and mathematical regression checks pass; the packaged HTML makes no remote requests when opened as a local file.
- `research/full-book/math-verification.json`: reference learner, causal attention and planner checks. Largest all-parameter finite-difference error is approximately 2.33e−11; CEM's quadratic cost is within 3.04e−7 of the analytic optimum.
- `npm run verify:pedagogy`: declared prerequisites occur before their dependent chapters, the two HTML outputs match, and normality-simulation checks pass. This verifies declared structure, not comprehension.
- Browser screenshots were visually inspected for the arm, contents, code, JEPA/architecture diagrams, SIGReg controls, and live controller in both themes, plus mobile layouts.
- The 168-page PDF was inspected in full-page contact sheets; representative revised pages were inspected at larger resolution. A final print-only correction removed the reader background color without changing pagination. No extracted text lies outside page bounds. Exercise solutions are expanded; print curves remain labeled recorded data.

## Remaining limits

The full research benchmark was not rerun. This revision used a short new training/control smoke check; the earlier multi-seed experiments remain separate evidence. A critical authoring pass cannot establish beginner comprehension, measure cognitive load, or replace an independent mathematical review. The most demanding material is still the characteristic-function uniqueness proof and the local-regression/Fisher-information argument; they now expose more intermediate steps, but should be tested with an actual reader before calling the pedagogy validated.

The book is 168 print pages. Its breadth is intentionally larger than the original roughly 100-page estimate. It should not be described as proving empirical results or every background theorem from the axioms of mathematics.
