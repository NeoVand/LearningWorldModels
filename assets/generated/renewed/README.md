# Scene illustrations — 21 September 2026

Created with the built-in image-generation tool. It does not expose a model selector or report a model ID; Sunburst cannot be verified. Each selected output was inspected at full size. These images illustrate questions about the physical world and are labeled generated scenes in the book. They are not training data, measured rollouts, or precise mathematical diagrams.

- `occlusion.png`: hidden motion behind an opaque screen. Exact prompt: `occlusion-prompt.txt`.
- `branch.png`: two possible outcomes whose mean need not be possible. Exact prompt: `branch-prompt.txt`.
- `hierarchy.png`: nearby steps, a middle-distance bridge, and a distant doorway. Exact prompt: `hierarchy-prompt.txt`.

The robot artwork is now SVG, adapted from Jaxverse's `Instrument.svelte` and driven by the shared simulator's `armPoints` geometry. See `tools/arm-plates.mjs`. The two raster-arm attempts made earlier in this revision were rejected and are not included in the book. Their original tool outputs remain in the generation history. The older three plates in the parent directory are retained as source history but are no longer embedded.
