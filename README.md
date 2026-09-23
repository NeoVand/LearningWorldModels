[![Before the Move: a ball passes from physical observation to a learned representation and imagined future.](assets/readme-banner-4k.webp)](https://neovand.github.io/LearningWorldModels/)

# Before the Move

**[Read the interactive course](https://neovand.github.io/LearningWorldModels/)** · [Download the complete PDF](output/pdf/before-the-move-complete.pdf)

An interactive course on world models, building the required mathematics from first-year probability, linear algebra and calculus through JEPA, SIGReg and **LeWorldModel, arXiv:2603.19312v1**. The book includes extended derivations and a genuine browser-trained visual world model.

**Current status: working draft undergoing design and pedagogical revision.** The 20-chapter manuscript and planned visual coverage are implemented. The course now also has optional narrated reading and a live voice tutor, grounded in a passage index. See [the figure-layout review](research/layout-review/REVIEW.md) for the earlier visual changes and verification.

Open **`world-models.html`** locally, or use the GitHub Pages link above. Both `world-models.html` and `second-edition.html` are identical outputs of one manuscript. The book contains 20 chapters, typeset mathematics, 15 architecture/geometry diagrams, 93 teaching figures, seven generated illustrations, highlighted reference code, six foundational numerical desks, the SIGReg experiments, and the actual training/planning laboratory. All reading assets and the numerical runtime are embedded. No account or network is required for reading or local experiments.

## Listen and discuss

The header's **Listen** control starts continuous narration at the current passage. Double-click a passage, or select text and use the small **Listen / Explain** menu, to focus on one part. Figures, tables, code blocks, and labs have their own actions. The compact player provides pause, next, previous, seeking, and a Follow toggle. Its generated audio is cached locally; 93 teaching figures, all 15 tables, and all 128 display equations have authored or reviewed spoken explanations. The course index covers every source equation, including inline math, and lets the tutor refer to an exact visible passage.

**Assistant** starts a GPT-Live 1 voice conversation. It can search the book, retrieve a section or equation with its teaching context, scroll to it, highlight it, move a validated widget control, and start its ElevenLabs narration. You can also type a question in the same panel. The assistant uses the current section, selection, and visible widget settings as context, and the rest of the book is retrieved as needed.

Open the settings icon beside Print and enter your own ElevenLabs and OpenAI API keys. The site sends them directly from your browser to those providers; they are never built into the HTML or committed to Git. By default, keys stay in this browser tab's session storage. **Remember keys on this device** explicitly opts into local storage; **Clear keys** removes them. The local `.env` is Git-ignored and used only for development tests. Narration and live assistance require internet access and provider billing; the rest of the course remains usable without them. GPT-Live 1 voice requires HTTPS or localhost and microphone access. The public GitHub Pages edition is a bring-your-own-key static site, so its browser-side key handling differs from OpenAI's recommended trusted-server session setup. Use a project key with spending limits that suit you.

The 230-page print companion is `output/pdf/before-the-move-complete.pdf`, with required derivations and worked solutions expanded. The original roughly 100-page estimate was exceeded to retain the developed explanations rather than compress the mathematics. Printed training curves are explicitly labeled recorded measurements.

The reading order starts with the purpose of predictive representations, then builds vectors, probability, covariance, calculus, and optimization before introducing JEPA and SIGReg. Normality testing has its own lesson and Monte Carlo experiment. Implementation, training, planning, and evaluation precede the advanced Gaussian theory, transformer architecture, research lineage, and guided reading of LeWorldModel. Core derivations are visible in the reading flow; worked exercise answers remain expandable.

## Figures and experiments

All 97 planned visual briefs have implementations: 92 teaching figures and five integrations in the live laboratory. This is a coverage count, not a claim that every design has received reader approval. Open `figure-atlas.html` to jump to any item; the build regenerates its titles from the figures. Coverage, source paths and presentation choices are tracked in `book/figure-plan.json`; the latest layout review and verification record is `research/layout-review/REVIEW.md`.

The opening arm moves through exact two-link simulator geometry. The laboratory uses 64 × 64 camera images and initializes a real random model, displays its untrained predictions, trains until paused, resumes without resetting, and replays learned versus actual futures from a shared context. Generated infographics complement editable SVG and numerical diagrams; `illustration-gallery.html` offers four or five compositions per subject, with corrected editorial selections already embedded.

## Edit and build

- Manuscript chapters: `book/edition2/*.md`.
- Reading order, prerequisite links, learning outcomes, and reference route: `book/edition2/curriculum.mjs`.
- Shared semantic LaTeX macros: `book/edition2/notation.mjs`.
- Typography and controls: `book/edition2/style.css`, `polish.css`, `reader.css`, `reader.js`, and `ui.js`. Theme roles live in `palette.js`.
- Listening interface, timed ElevenLabs audio, and GPT-Live 1 WebRTC session: `book/edition2/voice-ui.js`, `voice.css`, `voice-narration.js`, and `live-assistant.js`. The browser-side index bridge is `voice-index-runtime.js`.
- Narration source, reviewed display-equation scripts, and figure scripts: `book/voice/`. Rebuild the index with `node tools/build-voice-index.mjs`; the book build embeds it in both HTML outputs.
- Foundational numerical desks: `book/edition2/foundation-labs.js`; normality simulation: `normality.js` in the same directory.
- Teaching figures: `book/edition2/visuals/`. `core.js` provides scoped LaTeX, SVG and control primitives; subject modules register individual figures; `runtime.js` handles interaction and motion. Place a figure with `<!-- VISUAL: ID -->` in a chapter. Initial states are rendered into the HTML during the build.
- Editable architecture/geometry diagrams: `tools/figures.mjs`. Jaxverse-derived arm geometry is shared through `tools/arm-plates.mjs`; moving scenarios are in `visuals/arm.js`.
- Generated plate selections and provenance: `assets/generated/infographics/selection.json` and `README.md`.
- Tested Python reference implementations: `book/edition2/*_reference.py`.
- Actual learning core adapted from Jaxverse: `book/world/`.
- Primary papers, pinned author code, and source provenance: `papers/`, `research/`.

Run `npm install`, then `npm run build`. The delivered HTML does not require these authoring dependencies. The local preview shows a “New revision” button after a build; it never automatically reloads and interrupts reading or an experiment. Illustration alternatives remain available in the separate `illustration-gallery.html` page.

## Verify

- `npm run verify:pedagogy`: declared prerequisite order, identical preview outputs, and numerical checks of the normality simulation. This checks explicit dependencies, not human comprehension.
- `npm run verify:revision`: numerical checks, responsive layouts, three real training seeds, matched prediction-only training, control goals, pause/resume, and a small Wasm fallback run.
- `BOOK_TRAINING_CHECK=0 npm run verify:revision`: numerical and browser checks without repeating unchanged full training experiments.
- `python tools/verify-book-math.py`: all-parameter finite differences for the manual learner, attention causality, Adam progress, and CEM against an analytic optimum. Requires NumPy.
- `node tools/verify-reader.mjs`: both themes, responsive contents, SVG geometry, and a short real training/control run.
- `node tools/inspect-full-book.mjs`: screenshots, navigation, diagram collision checks, mobile layout, and all foundational desk interactions.
- `node tools/verify-polish.mjs`: revised mathematical experiments, pointer interactions, capacity choices, responsive layouts and sensor-theme presentation.
- `npm run verify:visuals`: numerical figure checks and browser interaction/theme checks, including untrained forecasts and short pause/resume.
- `npm run verify:continuous`: a separate real training run beyond 5,000 updates, then resume. This is intentionally a longer check.
- `npm run audit:visuals`: every teaching figure in both themes at desktop/phone sizes, plus slider endpoints.
- `npm run verify:layout`: all 93 teaching figures at desktop, tablet, phone, and print widths; checks comparison rows, equation fit, SVG labels, and undistorted circles.
- `npm run verify:voice`: narration-index coverage and browser binding, then voice-interface layout, settings, selection, and course-tool checks without provider calls. The live provider handshake and ElevenLabs playback have also been checked manually with local, uncommitted keys.
- `npm run print`: complete PDF with recorded training example.
- `python tools/book-print-audit.py`: contact sheets and PDF boundary checks after rendering page images with Poppler. Requires Pillow, pypdf, and pdfplumber.

Browser tools use Playwright. The new visual checks accept `BOOK_URL` to target a running preview and otherwise open the local HTML. Set `BOOK_PLAYWRIGHT_MODULE` to an existing module path if needed, or install the project's matching Chromium with `npx playwright install chromium`. The current critical-review record is `research/implementation/REVIEW.md`; the earlier editorial review is retained as history. The prior restructuring record is `research/pedagogy/STATUS.md`; browser and mathematical checks are in `research/full-book/`. Original measured training trajectories remain in `research/edition2/verification.json`.

## Scientific scope

The book explains the target paper's main text and appendices, including baseline equations, theoretical qualifications, implementation discrepancies, and the boundary between physical probes and successful planning. It does not claim that its small MLP reproduces the paper's transformer benchmarks. The published benchmark experiments have not been rerun here.

The packaged laboratory genuinely updates encoder and predictor weights from random initialization. Its planner scores actions through learned latent dynamics. Simulator state is used only to generate observations, evaluate outcomes, and fit a separately labeled visualization readout. Measurements can be exported. Weight checkpoint import/export is not part of the current reader interface.

WebGPU availability and speed depend on browser and hardware. The embedded Wasm fallback was checked on a small training configuration; full-size CPU training speed is not promised. The full book was inspected on desktop/mobile and in print, with mathematical software checks; no independent human pedagogical review is claimed.

Current infographic briefs, correction prompts, selections and provenance are saved in `assets/generated/infographics/`. Earlier scene provenance is retained in `assets/generated/renewed/`. The arm illustrations are SVG, not generated images. The manuscript and old landing page from before restructuring are archived under `research/pedagogy/before-restructure/`. Both current HTML filenames open the same book.
