# Course banner candidates

Twenty generated banner candidates: ten concepts, two compositions per concept. Open `banner-gallery.html` in the repository root to compare them, preview the course heading, and save a browser-local shortlist. No candidate is applied to the course until the reader chooses.

Generated with the built-in `image_gen` tool on 2026-09-22. The complete prompts and targeted correction prompts are in `prompts.json`; this manifest also maps stable labels to files. Each final image is 2172 × 724 pixels (3:1). These are conceptual cover illustrations, not measured physical simulations or instructional diagrams.

The first pendulum drafts included inconsistent future geometry. The final 02A uses a separate abstract prediction diagram; final 05A keeps identical present poses and opposite velocity arrows, removing speculative ghost positions. Intermediate outputs remain in the local generated-image history and are excluded from this gallery.

| Pair | Concept |
| --- | --- |
| 01A / 01B | A world unfolds from a page |
| 02A / 02B | Before the move |
| 03A / 03B | One world, two descriptions |
| 04A / 04B | Below the surface |
| 05A / 05B | More than a shadow |
| 06A / 06B | An atlas of possible tomorrows |
| 07A / 07B | The geometry of intuition |
| 08A / 08B | A rehearsal for reality |
| 09A / 09B | The grammar of motion |
| 10A / 10B | A lens for what matters |

Rebuild the gallery with `node tools/build-banner-gallery.mjs`. Images display at their native aspect ratio without cropping or stretching. Shortlists use the `world-banner-shortlist` local-storage key, separate from the book and chapter illustration choices.
