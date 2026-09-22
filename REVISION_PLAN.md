# Before the Move — second-edition plan

Planning document, 21 September 2026. This proposes the next revision; it does not claim that the work below is implemented. The existing manuscript and application are unchanged during this planning pass.

## 1. What the revision must accomplish

The book should enable a reader with introductory probability, linear algebra, and calculus to reconstruct the central mathematics, implement a small joint-embedding predictive world model, understand the experiments and appendices of LeWorldModel **2603.19312v1**, and distinguish established results from assumptions and open questions.

The first edition covers much of the territory, but compression has weakened the teaching. Its numerical checks do not establish prerequisite completeness, visual quality, or successful learned control. This revision needs developmental editing, a coherent visual language, and an actual learning system.

Five observable outcomes define success:

1. The reader can explain why predictive representations might be useful before seeing the architecture.
2. The reader can derive and implement the prediction loss and SIGReg, including their gradients and finite-sample qualifications.
3. The reader can train a small visual encoder and action-conditioned predictor from random weights, inspect collapse, and use learned predictions in a planner.
4. The reader can follow the target paper section by section, including its architecture, evaluation, ablations, implementation choices, and relevant appendix mathematics.
5. The reader can identify what successful prediction or Gaussian-looking embeddings do **not** establish.

“Research-level understanding” means those concrete abilities. It cannot be certified by page count or an attractive presentation.

## 2. Audit findings and their consequences

| Finding | Evidence from this draft | Required change |
|---|---|---|
| Distorted geometry | Canvases have intrinsic dimensions 1280 × 400 but displayed dimensions 726 × 180 on desktop and 328 × 180 on mobile. The two axes are scaled differently. | Preserve geometric scale; use responsive redraws and explicit aspect ratios; check circles, arrows, and axes in desktop, mobile, and print layouts. |
| Sparse visual explanations | No content images; only one SVG outside the mathematical renderer, used on the cover. | Commission a planned set of generated illustrations and construct precise architecture diagrams throughout the argument. |
| Code lacks instructional treatment | Two code blocks, no syntax-highlighting tokens. | Introduce a progressive executable implementation with highlighting, tensor shapes, worked traces, and explanations of numerical decisions. |
| Color is incomplete and partly heuristic | The build recognizes only some mathematical symbol patterns. | Replace incidental coloring with an explicit semantic notation system. |
| Training is too limited | The current training widget optimizes one scalar. The planning demonstration uses known dynamics. | Retain small examples as scaffolding, then train a real encoder and predictor and plan through that learned model. |
| Prerequisites arrive too quickly | Many concepts receive a short page; difficult material accumulates near the end. | Build and audit a dependency graph, then distribute the required teaching before its first use. |
| Page layout drives content | One forced printed page per lesson. | Write coherent chapters first, paginate afterward, and stop equating 100 markers with 100 pages of developed teaching. |

Useful work to preserve includes the local paper collection, version pinning, numerical gradient checks, several elementary demonstrations, and the single-file build approach. Existing prose must earn its place in the new sequence through review.

## 3. Establish the intellectual story before expanding the mathematics

Open with an ordinary physical task: observe a small moving mechanism, predict what will happen, and choose an action that moves it toward a goal. Show the same scene as physical state, sensor pixels, an embedding, and an imagined future. Explain which quantities the learner can observe.

Use this task to motivate a sequence of questions:

- Where do learning signals come from when nobody labels every frame?
- Why might reconstructing every pixel spend effort on details irrelevant to a decision?
- Which aspects of a scene need to remain predictable?
- What does it mean to predict in an internal representation?
- If the network chooses that representation, why would it preserve anything at all?
- How can an agent use predictions to evaluate actions without being given the correct action?
- What fails when history is missing, the future is uncertain, or imagined rollouts become long?

LeCun's perspective should organize this opening and recur throughout the book: self-supervised learning, compatible representations, energy-based formulations, latent variables for uncertainty, world models, cost, action selection, and hierarchical prediction. Explain the roles of perception, world model, cost/critic, actor, memory, and configuration in the broader proposal. Mark which components are present in the small teaching system and which remain outside it.

Present generative prediction, contrastive learning, teacher-based joint embedding, and regularized joint embedding as different design choices with different consequences. Do not portray one philosophical position as a settled proof that other approaches cannot work. Keep uncertainty distinct from abstraction: removing nuisance information does not eliminate all unpredictable futures.

The 2022 position paper must receive a full primary-source reading. Its official PDF has been blocked during retrieval; currently available abstract/public text is not an adequate basis for claiming full coverage. Obtain a legitimate accessible copy and record what was actually read.

## 4. Rebuild the curriculum around dependencies

The following is a provisional editorial budget, not a pagination constraint. Aim for roughly 100–120 core printed pages, then let the derivation audit determine the expanded edition's length. All material remains in the same HTML. A proof required for understanding a later argument is part of the required reading path, even if its presentation can collapse on screen.

| Part | Driving question | Required material | Provisional pages |
|---|---|---|---:|
| 1. Learning before labels | What can observation teach an agent? | Self-supervision, physical task, state versus observation, LeCun's architectural proposal | 7 |
| 2. Representing a world | What does a vector retain or discard? | Embeddings, maps, geometry, dot products, norms, projections, rank, covariance, eigenvectors | 10 |
| 3. Prediction under uncertainty | What can a prediction promise? | Random variables, distributions, conditioning, expectation, variance, Gaussian families, conditional mean | 9 |
| 4. How a model learns | How do errors change a representation? | Parameters, gradients, chain rule, computational graphs, backpropagation, SGD, Adam, generalization, regularization | 10 |
| 5. Why JEPA is nontrivial | What stops agreement from becoming collapse? | Energy, joint embedding, contrastive alternatives, stop-gradient, EMA, VICReg, temporal prediction | 8 |
| 6. A research lineage | Which problem did each architecture address? | I-JEPA, V-JEPA, V-JEPA 2, DINO-WM, PLDM; shared comparison diagrams | 7 |
| 7. SIGReg from first principles | How can a batch acquire useful distributional geometry? | Complex numbers through the full statistic, implementation, gradients, experiments, limits | 24 |
| 8. Build the small learner | How does the objective become a working system? | Data windows, encoder, predictor, optimization, diagnostics, training and ablations | 9 |
| 9. From predictions to actions | How can imagined futures guide control? | Rollouts, costs, CEM, MPC, history, uncertainty, accumulated error | 9 |
| 10. Read LeWorldModel | How does the paper scale these ideas? | ViT, attention, normalization, action conditioning, objectives, training recipe, paper/code correspondence | 10 |
| 11. Evaluate and challenge | What is the evidence actually evidence for? | Probes, baselines, ablations, planning evaluation, failure cases, limitations, capstone | 7 |

This allocation is approximately 110 pages before expanded proof material and references. It will be revised after the exemplar chapter is typeset. Space saved through better layout should support explanation, not an arbitrary target.

For every prerequisite, maintain an entry with: first use, intuitive explanation, formal definition, worked example, derivation if needed, exercise, and later applications. Audit backward from every equation and technical claim in the target paper. Terms such as regularization, embedding, isotropy, normality testing, tensor, normalization, kernel, and probe must never first appear as unexplained labels.

Use three presentation depths: the main narrative, immediately available worked derivations, and further investigations. Further investigations may be optional; required mathematical bridges may not be hidden there.

## 5. Make every difficult explanation reconstructible

Use a repeatable teaching sequence where appropriate:

1. A concrete problem and the reader's likely first attempt.
2. A small numerical or geometric example.
3. The failure or limitation that motivates a new idea.
4. A precise definition, with every symbol and shape identified.
5. A derivation in steps, each justified by an already-taught rule.
6. An experiment whose result the reader predicts before running it.
7. A worked exercise and an explanation of a common wrong answer.
8. A return to the world model: what this idea now allows us to do.

For example, regularization needs more than “add a penalty.” Start with multiple models fitting the same observations. Show how a second preference changes which solution is selected. Derive ridge regression in a tiny case, distinguish penalties on weights from penalties on representations, and then explain why SIGReg acts on a collection of embeddings. Treat its coefficient as a tradeoff whose effect depends on the scaling of both terms.

Embedding should begin with an explicit map from a tiny image into coordinates. Demonstrate preserved and lost distinctions, neighborhood geometry, non-uniqueness under transformations, and why good-looking clusters alone establish little about prediction or control.

Maintain an equation ledger. Classify each displayed expression as a definition, derived identity, theorem under assumptions, approximation, modeling choice, or measured result. Definitions require motivation; approximations require an error discussion; empirical claims require evidence. Avoid pretending that definitions or empirical observations can be “proved.”

The proof standard is complete derivation relative to stated first-year foundations. When more advanced machinery is genuinely required, introduce and justify the needed result before using it. Do not smuggle smooth densities, integration by parts, convergence arguments, spectral decompositions, or information-theoretic inequalities into a final appendix without a bridge.

## 6. Rebuild SIGReg as the exemplar chapter

The linked [SIGReg tutorial](https://rezabyt.github.io/blogposts/sigreg-tutorial.html) is the depth benchmark: it connects the motivating failure, distributional geometry, characteristic functions, approximation, gradients, and a training loop. Use it as a pedagogical reference with attribution. Verify mathematical and implementation claims against [LeJEPA](https://arxiv.org/pdf/2511.08544v1), [LeWorldModel v1](https://arxiv.org/pdf/2603.19312v1), and the pinned implementation.

The revised chapter should contain this complete argument:

1. **Collapse as an actual solution.** Construct a constant encoder and compatible predictor; compute the prediction loss. Distinguish complete collapse, dimensional collapse, and merely unhelpful representations.
2. **Why individual Gaussian targets fail.** Expand the expected squared distance to an independent Gaussian draw, take its gradient, and show why this pulls a fixed point toward zero. Connect this to matching a distribution rather than matching arbitrary point pairs.
3. **What Gaussian geometry means.** Teach density versus samples, covariance, isotropic/diagonal/full Gaussian families, rotations, eigenvalues, and rank. Show distributions with identical first two moments but different shapes.
4. **Why this particular target.** Separate anti-collapse intuition, maximum-entropy reasoning, and the assumptions of LeJEPA's downstream-risk theory. If entropy or KL is invoked, define and derive the needed facts first. Do not broaden a theorem beyond its conditions.
5. **What a normality test does.** Explain a null model, a statistic, finite-sample variability, and the difference between a calibrated test with a p-value and a discrepancy optimized during learning. Discuss differentiability accurately: sorting and maxima do not by themselves imply that gradients never exist.
6. **Complex numbers without a leap.** Develop the plane, multiplication as rotation, magnitude, conjugation, and Euler's formula from familiar calculus. Separate the projection direction, the physical time index, and the frequency variable in notation.
7. **Characteristic functions as measurements.** Begin with two or three discrete outcomes. Animate each sample's unit-circle contribution and their average. Derive the real and imaginary components and their interpretation at several frequencies.
8. **The Gaussian characteristic function.** Derive it step by step, state the conditions behind differentiation/integration, and verify the result numerically.
9. **From discrepancy to an integral.** Derive the squared complex difference, Gaussian weighting, Epps–Pulley form, and an independently checkable pairwise closed form. Explain what frequency weighting changes.
10. **Why one-dimensional projections help.** Prove how a multivariate Gaussian projects. Develop the required characteristic-function uniqueness argument and Cramér–Wold reasoning at an appropriate level. Distinguish all directions in theory from finitely many sampled directions in computation.
11. **From integral to executable sum.** Teach truncation, quadrature nodes, trapezoid weights, symmetry, and direction sampling. Trace a tiny batch through every intermediate array with dimensions and actual numbers.
12. **Every gradient.** Differentiate the statistic with respect to projected samples and then embeddings. Explain the chain rule into encoder parameters. Check the result against finite differences and automatic differentiation.
13. **Finite-sample subtleties.** Derive the empirical characteristic function's sampling error. Distinguish an unscaled discrepancy from the batch-size-scaled statistic: their sampling floors scale differently. Explain why a batch covariance has rank at most batch size minus one.
14. **What the regularizer guarantees and does not.** Discuss unseen directions/frequencies, the difference between population and empirical objectives, exact collapsed stationary configurations, competing prediction gradients, and why Gaussian geometry alone does not imply semantic correctness.
15. **The actual implementation contract.** Explain batch/time/feature axes, fresh projections, reductions, batch scaling, quadrature conventions, gradients through both encoder branches, and aggregation across microbatches or devices. Show why changing a reduction changes the effective regularization strength.
16. **Controlled experiments.** Compare a Gaussian, a ring, a mixture, a rank-one cloud, and a constant cloud. Vary batch size, directions, frequency grid, window, and regularization coefficient separately. Then repeat the relevant checks on embeddings produced by a trained network on held-out data.

Use a plain reference implementation before optimized tensor code. Show both computational cost and memory cost, including the projection and frequency dimensions. Any optional kernel/MMD interpretation comes after the operational derivation and receives its own prerequisites.

End with the reader implementing the statistic from its specification and explaining discrepancies between the mathematical population object, the paper's pseudocode, and executable author code.

## 7. Build a continuous, genuine training experience

Use one main visual environment across the learning chapters. Start with a simple motion example when needed, then introduce the Jaxverse mechanism explicitly as the richer task. Avoid changing environments merely to make unrelated widgets look varied.

The numerical core in Jaxverse is a promising starting point: a 32 × 32 image encoder, eight-dimensional latent representation, action/history-conditioned predictor, SIGReg, optimizer, and planner. Its documented experiments establish useful local behavior on a particular machine, alongside long-horizon failures. Reuse and adapt the tested numerical components where appropriate; do not import the entire Svelte interface or assume its existing measurements automatically transfer.

The staged learning journey:

| Stage | Reader action | Evidence shown |
|---|---|---|
| Observe | Move the mechanism and inspect its camera image | Hidden simulator state versus model-visible observations; ambiguity from a single frame |
| Collect | Generate a seeded exploration corpus | Actions, consecutive frames, train/validation episode split, coverage gaps |
| Predict badly | Inspect an untrained encoder and predictor | Predictions and persistence baseline before learning |
| Find the loophole | Train the matched prediction-only objective | Loss, embedding spread, rank diagnostics, and downstream failure |
| Add SIGReg | Train from the same initialization and data budget | Prediction and regularization curves, distributions, held-out diagnostics |
| Test understanding | Shuffle actions, remove history, change goals | How each intervention affects prediction and control |
| Imagine | Roll out candidate action sequences through the learned predictor | Error growth and predicted versus observed outcomes |
| Act | Run CEM and execute a short portion of the chosen plan | Repeated observation/replanning and visible failures |
| Investigate | Change a justified model or training choice | Reproducible comparisons with saved settings and seeds |

Training must update the visual encoder and predictor in the browser from random initialization. The planner must score actions through the learned model. Simulator state may generate observations and measure evaluation metrics; it must not secretly choose actions. Any separately fitted decoder/probe used to visualize a latent prediction must be labeled and excluded from the planner's cost unless that dependence is explicitly the experiment.

Reader controls: start, pause/resume, reset to seed, choose a modest training budget, inspect a batch, compare matched objectives, save/load a checkpoint, and inspect the configuration. Explain compilation, training, and evaluation as separate phases. Keep interactions responsive with a worker.

Show honest training curves, embedding spread and covariance diagnostics, held-out prediction relative to persistence, action/history interventions, and physical control outcomes. Explain why raw prediction losses from independently learned latent spaces cannot be compared without considering scale.

A saved checkpoint or recorded demonstration can support slow devices, but must be labeled as such. It must never masquerade as live training. Benchmark the packaged implementation on the supported browser/backend combinations before publishing performance expectations.

Use the small MLP as the accessible complete learner. Introduce a transformer variant after attention and conditioning are taught. Include a separate faithful research implementation/configuration guide for the paper's architecture; the small model is an educational experiment, not a benchmark reproduction.

## 8. Establish a visual and notation system

Produce both generated illustrations and precise diagrams. Generated illustrations should carry explanatory work: physical scene versus representation, predictable object motion amid nuisance detail, abstraction across scales, and imagined branches of action. Use image generation for polished conceptual plates and selected explanatory compositions, including equations when useful; inspect all generated mathematical text. Keep essential mathematics and labels available as accessible, editable text as well.

Use editable SVG for exact architecture and data-flow diagrams. Plan approximately 12–18 substantial diagrams and 6–8 generated illustrations initially, then retain only those that improve understanding. Each visual receives a written purpose, semantic specification, caption, source/provenance entry, and legibility check.

Required architecture diagrams include: supervised learning; generative prediction; joint embedding; JEPA with target-branch treatment visible; the collapse solution; VICReg; SIGReg; LeWorldModel training with aligned time/action indices; the broader LeCun architecture; imagined rollout; and closed-loop MPC. Reuse a consistent grammar so readers can compare architectures without decoding a new drawing language each time.

Encode shared weights, frozen components, stop-gradient, data flow, and gradient flow explicitly. Different arrow styles need a legend; arrows must have specific destinations. Place tensor shapes at the points where shape changes matter. Distinguish the training graph from the planning graph.

Provisional semantic palette:

| Role | Visual treatment |
|---|---|
| Observation | Blue |
| Encoded representation | Violet |
| Predicted representation | Teal plus a hat/dashed convention |
| Action/control | Amber |
| Loss, discrepancy, or cost | Vermilion |
| Parameters and neutral operations | Dark neutral unless a local distinction is needed |

Apply roles through explicit mathematical macros rather than guessing from letters. The same role should agree across equations, prose, diagrams, and associated code annotations. Not every character needs color; every pedagogically meaningful role needs consistent treatment. Preserve meaning in grayscale and for readers with color-vision differences.

For charts and geometry, use equal axis units when the argument depends on shape. Preserve image aspect ratio, redraw canvases for their container and device pixel ratio, and stack multi-panel figures on small screens. Print requires its own inspected figure sizes and explanatory snapshots, not a compressed version of the screen layout.

## 9. Turn code into part of the explanation

Build-time syntax highlighting keeps the delivered HTML self-contained and avoids loading a highlighting library while reading. Include line numbers where they support the explanation, copy buttons, shape annotations, and selective emphasis tied to derivation steps.

Develop one reference implementation progressively: data windows → encoder → predictor → prediction loss → SIGReg → gradient calculation → optimizer update → held-out evaluation → rollout → CEM → MPC. Keep the displayed code synchronized with tested source.

Use clear Python/NumPy-style reference code to expose the mathematics and explain the correspondence to the browser's JAX-style implementation. Do not silently substitute a different statistic or reduction in the fast implementation. Include a single-step trace connecting each formula to a tensor operation and then to a visible change in parameters.

## 10. Keep the artifact simple while proving the runtime works

Preserve the single-HTML reading artifact and minimal authoring workflow. Internally, separate manuscript chapters, figure sources, generated assets, mathematical reference implementations, lab code, and the build. Authoring modules do not require the reader to handle multiple files.

The first engineering experiment must determine whether the training runtime, worker, and any required Wasm assets can be embedded reliably while supporting the intended browsers and direct-file use. Test secure-context restrictions, worker loading, offline behavior, and backend availability early. Do not promise universal offline GPU training before that experiment succeeds.

Prefer vanilla HTML/CSS/JavaScript for the book interface. Bundle the numerical dependencies actually required by the lab. If direct-file training is limited on a supported browser, make the exact boundary clear and preserve complete offline reading; resolve the distribution choice before designing the whole course around an untested assumption.

Provide a glossary with return links, symbol lookup, chapter navigation, searchable terms, and saved reading progress. Make derivations usable by keyboard and include reduced-motion behavior. Print all required explanations and replace interactive controls with meaningful results and captions.

## 11. Re-read the papers as an argument, then audit the final paper

Read papers because they resolve a question in the story. VICReg explains one family of anti-collapse constraints; I-JEPA and V-JEPA develop predictive representations; V-JEPA 2 connects representations and action-conditioned modeling; DINO-WM and PLDM provide useful comparisons for latent planning; LeJEPA supplies the SIGReg motivation and construction; LeWorldModel combines the ideas in the requested endpoint.

Build a paper-to-book matrix covering every target section, relevant appendix, equation, figure, experiment, and claim. For each entry, link prerequisites, explanatory lesson, proof or derivation, implementation correspondence, and an exercise or diagnostic.

Keep the target fixed at v1. Label any comparison to later versions. Preserve a discrepancy ledger for paper equations, pseudocode, and pinned code. Existing issues to revisit include SIGReg batch scaling and quadrature conventions, covariance-penalty notation, and the exact replanning cadence. Explain discrepancies rather than silently correcting the source in the reader's head.

The theory audit must include any kernel/probe assumptions, score-function arguments, integration-by-parts steps, and bounds actually needed for the chosen paper path. Avoid a compressed final-page derivation that depends on several untaught subjects.

End with a guided reading of the paper itself: what each result establishes, what baseline makes it informative, what the ablation isolates, and what remains untested. Include a capstone with a full worked solution: derive the objective, implement it, run a controlled comparison, plan with the learned model, and write a qualified interpretation.

## 12. Revision sequence and visible milestones

| Milestone | Concrete deliverable | Completion criterion |
|---|---|---|
| A. Editorial blueprint | Dependency map, paper-to-book matrix, notation guide, visual inventory, claim/proof ledger | No unexplained prerequisite in the exemplar's dependency chain; source gaps explicitly recorded |
| B. Exemplar chapter and runtime experiment | Rebuilt SIGReg chapter, one polished architecture diagram, one generated explanatory plate, highlighted code, live statistic/gradient experiments; separate real-training packaging prototype | Derivations reconstructible; numerical cross-checks pass; figures retain geometry; supported runtime constraints measured |
| C. Complete learning laboratory | Seeded data, actual training, matched collapse comparison, held-out diagnostics, learned-model planning | Repeatable learning and control measurements across preselected seeds; controls and resource disposal work; no state leakage into planning |
| D. Full developmental rewrite | Revised philosophical opening and complete chapter sequence, integrated with the laboratory | Every required concept and target-paper dependency has a teaching location and worked support |
| E. Visual and production edition | Generated artwork, architecture series, all equations and code styled, responsive and print editions | Visual, accessibility, offline, numerical, and content audits complete |

Keep the current preview available and expose the revision in a clearly identified preview so progress is inspectable. Start showing real exemplar content early. Publish concise status by chapter—outlined, drafted, mathematically checked, visually checked—rather than a misleading aggregate percentage.

At each milestone, show what changed and one concrete piece of evidence: a derivation, a checked figure, a training run, or a prerequisite audit. Reader feedback can steer style and pacing while the remaining independent work continues.

## 13. Acceptance checks that match the ambition

**Teaching:** audit first uses of terminology; manually follow prerequisite chains; solve exercises using only previous material; verify that analogies are connected to exact definitions and their limitations; ensure no essential explanation relies on “obvious,” “standard,” or an unexplained reference.

**Mathematics:** independent checks of key derivations; finite-difference and autodiff gradient comparisons; pairwise/integral/quadrature consistency where applicable; correct dimensions, scaling, assumptions, and distinctions between finite samples and population claims. Record what was checked and avoid claiming an independent human pedagogical review that did not occur.

**Training:** fixed train/validation episode separation; preselected seeds and goals; matched initialization and budgets for objective comparisons; untrained and persistence baselines; action/history interventions; physical control metrics; saved configurations and raw results. Treat success thresholds as declared evaluation choices, not values tuned after seeing the outcomes.

**Visuals:** inspect desktop, tablet, narrow mobile, and printed pages; measure equal-axis geometry; check clipping, arrows, labels, contrast, generated-image mathematical content, and figure captions. Test comprehension-oriented diagrams as well as overflow.

**Delivery:** highlighted and copyable code; valid navigation; keyboard controls; reduced-motion support; explicit runtime capability reporting; pause/resume/reset correctness; offline reading; measured training support; no unexpected external asset requests; meaningful print output with complete solutions.

The recommended first implementation step is milestone B after the focused blueprint: a thoroughly developed SIGReg chapter and a genuine training-runtime prototype. Establish that standard before expanding the whole manuscript. Cosmetic corrections alone would leave the principal teaching problem intact.

## Reference anchors

- User-supplied depth reference: [Reza Bayat, SIGReg from First Principles](https://rezabyt.github.io/blogposts/sigreg-tutorial.html).
- Conceptual foundation: [Yann LeCun, A Path Towards Autonomous Machine Intelligence](https://openreview.net/forum?id=BZ5a1r-kVsf); full-text retrieval remains an explicit research task.
- SIGReg source: [LeJEPA v1](https://arxiv.org/pdf/2511.08544v1).
- Requested endpoint: [LeWorldModel v1](https://arxiv.org/pdf/2603.19312v1).
- Implementation comparison: [pinned LeWorldModel module](https://github.com/lucas-maes/le-wm/blob/8edfeb336732b5f3ce7b8b210d0ba370a09e2cac/module.py).
- Local starting point for the learning system: [Jaxverse validation](../jaxverse/docs/world-model-validation.md) and [benchmark documentation](../jaxverse/docs/world-model-benchmark.md). These are evidence and implementation references, not instructions that supersede this project's request.
