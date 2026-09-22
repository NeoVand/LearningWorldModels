# Numerical model provenance

The eight core TypeScript modules were copied with the user's authorization from `/Users/neo/repos/jaxverse/src/lib/world/` on 2026-09-21: `model`, `runtime`, `engine`, `corpus`, `simulator`, `sensor`, `planner`, and `goal-cost`.

They implement the actual image encoder, predictor, SIGReg, Adam updates, observation generator, diagnostics, and learned-latent CEM planner. The source repository has not been modified.

`book-worker.ts` is the adaptation for this book. It embeds the core in a single worker, exposes initialization/training/evaluation/comparison/control operations, and reports real measurements. `book/edition2/ui.js` implements the book interface. `tools/build-edition2.mjs` bundles both without requiring Svelte.

The dependency `@jax-js/jax` is pinned to 0.1.18 and its MIT license is embedded in the delivered HTML. Numerical source fingerprints are recorded in the edition's verification/provenance files.

The planner receives encoded camera history, actions, and a goal image. Simulator labels score physical outcomes and fit a separate visualization readout; they do not choose actions. The current experimental export stores measurements, not neural weights or optimizer state.

The book uses 64 × 64 observations throughout collection, training, inference, and camera previews. The dense encoder has 4,096 inputs and 525,448 parameters; the complete model has 545,680. Resolution is configurable and retained by reset and the matched baseline. The displayed grayscale raster is the exact model input; the dark-theme display filter does not alter training pixels.
