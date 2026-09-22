# Editorial review implementation

Source: the reader-supplied BOOK-REVIEW.md, 22 September 2026.

## Correctness

- Checked the 18% claim against §4.2 and Table 5 in the locally stored paper. Corrected attribution and named PLDM.
- Data actions now use lowercase a, distinct from advantage A.
- The scalar Laplacian uses nabla squared, distinct from finite changes.
- Implementation uses t for time and rho for eigenvalues; the notation reference explains earlier lambda conventions.
- Expanded LeWM, MLP, MSE and EMA on first use. Restored the missing divisor and number separators. Removed an unused reference-code import.

## Reader preferences retained

- No chapter-end pager: the reader explicitly requested its removal.
- Preserve selected generated illustrations and the pending banner shortlist; improve their presentation without replacing those choices.

## Notation and equation layout

Removed the runtime single-letter color maps. Authors now mark observations, representations, predictions, actions and objectives explicitly. Projection directions, frequency, characteristic functions and attention matrices use a separate muted analytical palette with local legends. The symbol-reference figure agrees with that distinction; matrix emphasis has its own neutral highlight.

Reworked long displays into aligned derivations, preserving terms and equality/inequality direction. At 375 and 390 px, every manuscript display fits, including expanded exercises. A modest phone font adjustment and keyboard-accessible edge fade handle larger reader zoom settings. Automated regression checks cover bare mathematical letters, semantic macros and equation widths.

## Charts and teaching structure

- Round axis ticks, exact π labels for directions and proper superscripts on log charts.
- Training curves fit observed history with a minimum three-decade range.
- The regularization figure now uses the manuscript’s observation (1, 1), with scales that reveal its curves.
- One control run executes 40 actions, matching the documented criterion.
- Figure atlas follows document order without changing stable figure IDs.
- Every chapter exposes its existing learning outcome below the lead; removed the repetitive running subtitle and figure eyebrow.
- Added direct links to the promised spectral theorem, rollout-error calculation, quadrature, planner and SIGReg derivations.

## Voice and accessibility

Revised routine caveats into concrete statements of what a measurement establishes or what experiment is needed. Retained and emphasized the exact-collapse gradient, adaptively selected samples and upper-bound minimization warnings. “It/This does not” constructions decreased from 31 to 6; “not automatically” from 12 to 5. Converted prose apostrophes while protecting formulas, code and tag attributes.

Strengthened light-theme colors; the lowest measured small-text contrast across semantic/analytical colors and the two reading surfaces is 4.67:1. Added intrinsic dimensions to all seven images, slightly softened generated plates in dark mode, gave charts panel-specific accessible descriptions, and moved the local revision notice out of the phone masthead.

## Recommendation not adopted after testing

The proposed `content-visibility:auto; contain-intrinsic-size:auto 12000px` rule caused deep chapter anchors to shift about 87 px after arrival and document height to change by 3,000–3,800 px. The normal page had zero shift in the same trial, with similar timings. See `performance-trial.json`. Preserving a reader’s place takes priority over this unproven optimization. The existing visible-only animation and lazy laboratory initialization remain in use.
