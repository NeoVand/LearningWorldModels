# Generated conceptual plates

These are generated scientific illustrations, not measured results. The book's calculated plots, mathematical derivations, stateful demonstrations and robot geometry remain editable SVG/HTML/LaTeX.

The built-in `image_gen` tool produced the assets. It does not expose a verifiable model identifier, so these files are **not attributed to Sunburst**. `manifest.json` records the first 25 source paths and project copies. `corrected.json` records four replacement lineage compositions. Three further edits produced two JEPA corrections and one energy correction: 32 generated files in total. The unmodified originals remain available for provenance.

`selection.json` identifies the six editorial selections embedded in the book. User preferences can replace them without delaying a usable edition. `../../../../illustration-gallery.html` presents 4–5 alternatives per subject. It distinguishes raw design drafts from the corrected versions used in the book.

## Review decisions

- **Occlusion 4:** selected for its ordered visible/hidden/possible-future structure. The caption explains that the two exits are alternatives, not simultaneous balls. This is uncertainty about hidden interactions, not a violation of deterministic motion under fully specified conditions.
- **Hierarchy 1:** selected for explicit spatial nesting and three time scales. It illustrates a proposal; the local model does not implement hierarchical planning.
- **JEPA corrected:** original candidates had ambiguous context/target arrows and illustrated hand direction with a ball. A generated edit separated predicted/observed futures and the target-encoder branch. A second precise edit made the predicted and target vectors both four-dimensional. The editable architecture figures remain the source for method-specific gradients and parameter sharing.
- **SIGReg 1:** selected for the six-stage account and correct complex discrepancy formula. The figure caption explicitly distinguishes the magnitude illustration from the full complex difference. This is schematic geometry, not a computed sample. Other composition drafts may contain inaccurate labels or curve shapes and must be corrected before use.
- **Energy final:** the original wording could confuse model compatibility energy with mechanical energy. The edit states explicitly that this is a model score. No probabilities or empirical numbers are invented.
- **Lineage corrected 1:** the first four atlas drafts were rejected because arrows suggested incorrect training paths. Four replacements use task vignettes and short, source-checked target descriptions. The book supplies the exact comparison table separately.

## Prompt records

`subject-briefs.json` preserves the subject-specific brief strings used for the original batches. These are briefs, not a verbatim transcript of every layout/style wrapper. Each subject was generated in several arrangements (horizontal sequence, nested panels, editorial grid, and comparative plate), with a restrained blue/violet/teal/amber palette and large serif headings.

`final-edit-prompts.json` contains the complete JEPA and energy edit prompts and their reference filenames. `dimension-edit-prompt.txt` contains the complete final four-coordinate correction. Together with the reference PNGs these preserve the final prompts for the corrected assets.

The SIGReg production brief was a publication-style six-stage plate: embedding cloud; unit-direction projection h = uᵀz; scalar phase ωh on the unit circle; empirical characteristic-function average; Gaussian characteristic-function comparison q(ω) = exp(−ω²/2); integrate the squared complex discrepancy with a Gaussian window and average directions. Five compositions were requested. This paragraph records the production brief, not an exact recovered transcript of the original tool invocation.

## Change a selection

Update the matching `<img>` in `book/edition2/{chapter}.md` and `selection.json`, review the full-resolution result, then run `npm run build`. The HTML embeds the selected PNG, so it remains self-contained. Never use a raw composition draft as a source for equations or scientific claims.
