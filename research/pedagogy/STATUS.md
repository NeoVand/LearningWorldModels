# Pedagogical restructuring — 21 September 2026

The current book has one manuscript and two identical HTML entry points: `world-models.html` and `second-edition.html`. The print companion is `output/pdf/before-the-move-complete.pdf`, 165 pages. The earlier source and landing page were preserved under `before-restructure/`.

## What changed

The reading order is now explicit in `book/edition2/curriculum.mjs`. Its 20 chapters progress through motivation, vectors, probability, cloud geometry, calculus, learning, JEPA, statistical testing, SIGReg, implementation, training, planning, evaluation, advanced theory, transformers, research lineage, the target paper, a capstone, and references. The same source generates chapter checkpoints and the reference learning route. A build-time check prevents a declared prerequisite from appearing after its dependent chapter.

This was a rewrite as well as a reorder. The opening no longer presents the full objective before teaching its symbols. Philosophy introduces the functional agent diagram; the formal JEPA computation graph appears after learning and differentiation. Vector geometry and distribution geometry are separate lessons. Gaussian normalization is derived when the density is introduced. A new calculus chapter develops partial derivatives, gradients, Jacobians, reverse-mode differentiation, curvature, and approximation notation before their use in optimization and research theory.

A new statistical-testing chapter derives a known-reference Kolmogorov–Smirnov discrepancy, Monte Carlo calibration, p-values, and power. Its experiment distinguishes evidence from an untouched sample from a penalty optimized during training. The SIGReg chapter builds on these prerequisites instead of restarting the book. Required derivations are visible in the main reading flow.

Implementation, real training, and planning precede downstream Gaussian theory. Evaluation teaches probes, coordinate ambiguity, energy, surprise, and the paper's baseline metrics before the guided paper reading. Advanced arguments begin with concrete one-dimensional examples. Transitions and glossary destinations were updated to match the new sequence.

The six foundational canvases now use the reading-column width. Diagrams retain their aspect ratios and LaTeX labels. Existing generated plates, syntax-highlighted code, SIGReg experiments, and the genuine training laboratory are preserved.

## Verification

- `numerics.json`: declared prerequisite order and identical HTML outputs; Gaussian CDF reference error below 1.4e-10 at tested points; a hand-computed KS discrepancy; seeded Gaussian moments; increased estimated power with sample size. Dependency checks are structural checks, not a substitute for a novice reader.
- `../full-book/math-verification.json`: manual-learning gradients agree with finite differences below 2.4e-11; Adam reduces the reference loss; causal attention has no future leakage; CEM agrees with a quadratic optimum within 3.1e-7 in cost.
- `../edition2/visual-verification.json` and `../full-book/browser-inspection.json`: responsive layout, math, code, navigation, all six foundational desks, SIGReg controls, and diagram-label geometry. No broken anchors, malformed math, browser errors, page-width overflow, or detected SVG arrow/label intersections.
- `training-smoke.json`: a fresh 20-update WebGPU run in the canonical HTML completed with finite loss. Existing three-seed, 5,000-update training and control records remain in `../edition2/verification.json`; the numerical training core was unchanged.
- `print.json`: all 165 pages inspected at contact-sheet scale; no text outside page bounds. Changed diagrams and numerical desks were also inspected in the browser. Final short exercises and chapter endings were checked for isolated fragments.
- `content-audit.json`: current ordered chapters, approximate prose counts, build counts, and delivered artifact hashes.

## Scope

This resolves the identified sequencing and integration problems. It does not establish that every beginner will understand every proof on first reading. No independent novice-reader or human mathematical review has been performed. The small browser MLP teaches real representation learning and model-based control; it does not reproduce the paper's transformer benchmarks. The final target remains arXiv:2603.19312v1, with versioned primary papers and pinned author code retained locally.
