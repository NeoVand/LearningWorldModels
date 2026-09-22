# Comparison layouts and plot readability

Revision date: 2026-09-22.

The reader's four examples exposed a shared layout problem: a fixed minimum panel width and a forced two-column print grid orphaned the last member of three- and four-panel comparisons. The shared row helper now declares the number of panels. Related graphical panels remain in one row, with their aspect ratios preserved. Long explanations move into a full-width group below the comparison. On phones, accompanying equations and tables move below the graphical row rather than being squeezed into a narrow column.

## Revised demonstrations

- **B1, probability:** mass, density, and CDF share one compact row. The density range follows its peak. Peak density, interval probability, and total probability are prominent readouts; the distinction between height and area is stated beside them.
- **B2, variance:** a second curve shows variance growing with outcome distance, alongside the probability masses. Mean and variance are explicit readouts.
- **B4, squared error:** the best prediction and the two relevant losses are prominent. The curve range includes all slider states.
- **D6, principal directions:** variance, its derivative, and the direction/tangent geometry share one row. A useful derivative curve replaces the equation-only column. The separate nested-box drawing is removed; the full existence proof remains in the preceding text. The explanation explicitly distinguishes stationary maxima from stationary minima.
- **S5, quadrature:** the integrand has a fixed range suited to its actual amplitude. A second curve shows numerical grid error against knot count, using an explicitly labeled logarithmic scale. Grid error, discarded-tail error, and the computed integral are distinct readouts. Plotted grid errors are floored at 1e-12, documented in the figure. The underlying finite sums and independent full-line calculation are retained.
- **L6, recorded control:** all four goals share one row. The three local goals share a vertical scale; the distant stress goal has its own explicitly disclosed scale. Each plot states the outcome and final error. Recorded trajectories and the 0.15-radian tolerance are unchanged.
- **N2, activations:** all five curves stay together. Identical axes now include the full linear activation rather than clipping it.
- **R1, slope estimation:** two plots compare a fixed reference design with the selected input spacing, using identical noise draws and a shared vertical range. The range adapts to retain all points; this is disclosed. Theoretical variance and standard-deviation amplification remain visible, so scaling cannot conceal the statistical effect.
- **H2, research lineage:** the frozen-encoder path is typeset on two lines so it fits at intermediate widths.

Shared SVG axis margins now accommodate small decimal tick labels. The rollout uncertainty band was moved with its axis mapping. Panel headings, explanations, numerical readouts, and print heights are compact and consistent across themes.

## Verification

- `node tools/verify-visual-numerics.mjs`: passed. Includes SIGReg finite differences, causal attention, neuron fitting, and planning numerics.
- `node tools/verify-pedagogy.mjs`: passed. Checks declared dependencies and selected probability computations, not reader comprehension.
- `npm run verify:layout`: all 92 figures checked at 1440/light, 800/dark, 390/light, 390/dark, and 615/print. No wrapped graphical comparisons, clipped SVG text, distorted circles, overflowing figure equations, JavaScript errors, or screen-wide horizontal overflow. Machine-readable results are in `verification.json`.
- `npm run audit:visuals`: screenshots of all 92 figures in desktop and phone layouts, both themes, plus 200 slider-endpoint states. Results are in `../implementation/visual-audit.json`. Long manuscript equations still scroll within their own containers on phones; they do not widen the page.
- Visually reviewed contact sheets for all figures in desktop/light and phone/dark, plus enlarged screenshots of the changed and potentially affected figures in screen and print layouts.
- Regenerated the complete **226-page PDF**. Visually reviewed all page contact sheets and enlarged pages 23, 54, 104, 135, 165, and 193. No text crosses page boundaries; `print-audit.json` records all pages. Print formulas also pass the exporter's column-overflow check.

The visual checks target the reported layout and scale problems. They are not a claim of a fresh independent scientific or pedagogical review of every paragraph. Existing training measurements, manuscript proofs, and reader-selected generated illustrations remain intact.

Screenshots and rendered page images are reproducible working artifacts under `tmp/layout-review/` and `tmp/implementation/`; they are not bundled into the repository. The HTML aliases are identical generated outputs.
