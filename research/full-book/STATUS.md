# Earlier manuscript delivery record

This is the archived status of the manuscript before its pedagogical restructuring. Counts and reading order below describe that earlier snapshot. See [the current restructuring record](../pedagogy/STATUS.md) for the current book; both HTML entry points now show that book. Browser and math check files in this directory are refreshed independently.

# Complete book status

The complete manuscript is delivered in `second-edition.html`, with a 151-page print companion at `output/pdf/before-the-move-complete.pdf`. The earlier SIGReg and training workshop is included within the full narrative. No chapter is a placeholder.

## Content delivered

17 chapters connect LeCun's self-supervised-learning philosophy to linear algebra, probability, optimization, JEPA collapse and remedies, the research lineage, vision transformers, the full SIGReg derivation, qualified Gaussian downstream theory, implementation, actual training, planning, guided paper reading, evaluation, capstone solutions, and reference maps. The final paper's main text, numbered equations 1–9, and Appendices A–I have teaching locations in the reference chapter.

The artifact contains 1,117 inline/display math expressions, 15 SVG diagrams with 79 KaTeX labels, three generated conceptual plates, six tested Python code blocks, five foundational interactive desks, the SIGReg experiments, and the genuine browser training/control laboratory. Semantic colors and notation are shared by prose and diagrams. All reader assets and the numerical runtime are embedded.

## Verification completed

- The manual learner's encoder, predictor, and both biases agree with central finite differences to a maximum absolute error below 2.4e-11. One hundred Adam updates reduce its fixed-data objective from 0.06337 to 0.01913.
- The reference attention implementation has normalized rows and zero future leakage. The reference CEM optimizer matches an analytic quadratic optimum within 3.1e-7 in cost.
- The existing three-seed, 5,000-update training records, matched prediction-only baseline, pause/resume, local and distant control trials, and small Wasm fallback test are preserved in `../edition2/verification.json`. The learning core was not changed by the manuscript expansion.
- The final expanded package completed a fresh 20-update WebGPU training smoke test with finite loss, recorded in `training-smoke.json`.
- Browser checks cover 1,400-, 820-, and 390-pixel widths, circular canvas geometry, math rendering, code highlighting, offline requests, navigation/search, SIGReg controls, and all five new desks. No broken internal anchors, JavaScript errors, page-width overflow, or SVG arrow/label intersections were found.
- Every print page was visually reviewed at contact-sheet scale. Diagrams and code were separately inspected at larger scale. Code pagination, reference-table flow, chapter-ending orphans, and one incorrectly escaped architecture label were corrected. The final changed chapter ending was re-rendered and inspected. PDF boundary checks found no text outside page bounds.

## Scope and scientific boundaries

The manuscript is complete as an authored educational book. It is not an independent human mathematical or novice-reader review. The browser MLP demonstrates actual representation learning and learned-model planning; it does not reproduce the research paper's transformer benchmarks. Published benchmark experiments were not rerun.

The recorded browser trials include failures: all nine local goals were reached at least once, seven remained within tolerance at the final observation, and all three distant stress trials failed. These distinctions are retained in the book. A diagnostic suite is not a population success-rate estimate.

The reader can export measurements; weight checkpoints and persistent optimizer state are not implemented in the UI. Full-size CPU training performance is not established by the small Wasm test.

## Source and artifact records

`content-audit.json` records manuscript counts and artifact hashes. The target PDF is explicitly version 1. Primary papers, the full 62-page LeCun position paper, extracted text, and a pinned author-code archive are retained under `papers/` and `research/`. The guide distinguishes paper equations from code reductions, quadrature choices, and configuration defaults. Generated image provenance and exact prompts are in `assets/generated/README.md`.
