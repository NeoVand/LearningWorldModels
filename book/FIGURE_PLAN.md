# Visual teaching plan for Before the Move

Status: **complete; final verification recorded in `research/implementation/REVIEW.md`**. This plan covers the current 20 chapters and the reader/training interface. The original plan contained **97 briefs: 73 new, 22 extensions, and 2 replacements**. The widget audit later split the expectile explanation from E7 into E8, giving the current ledger **98 briefs**. A brief may become one panel in a combined figure; this is not a quota for full-page illustrations.

The previous pass did not establish visual completeness. It checked existing objects but did not ask what explanations lacked an object in the first place. It also tested a prepared/trained interface while missing its empty first-visit state. This plan replaces that stopping criterion.

## What the original audit found (historical baseline)

- The book currently has 20 figure containers and 10 widgets. Six chapters have neither: calculus, implementation, theory, lineage, capstone and reference. Tables and code blocks still exist in some of those chapters, but they do not supply the missing visual explanations.
- Of 1,588 rendered math fragments (including single-symbol mentions and 79 diagram labels), 161 contain explicit semantic coloring. This is evidence of inconsistent application, not a claim that every neutral fragment is wrong.
- Inline `weights` retains background `rgb(237, 236, 229)` in both themes. Its foreground changes to a near-white night color, producing the reported white rectangle. All three prose inline-code occurrences need coverage, alongside the other hard-coded surfaces.
- Both preview addresses, ports 63987 and 8767, serve the same current HTML. This defect is not explained by an older preview.
- On a fresh visit the two camera canvases contain no opaque pixels, the controller contains no SVG arm, and training/control buttons are disabled. The explanatory SVG cover has a fixed pose and no animation clock.
- Training already resumes the existing model if Train is pressed again, but every request has a fixed step budget. There is no continuous-run option. A complete fix must preserve optimizer state and make the stop/resume behavior explicit.
- The old Observe / Represent / Imagine composition was replaced by a single static pose. Its teaching scenario was lost. Restoring that scenario is a first deliverable, not an optional embellishment.

Evidence: `research/visual-planning/baseline.json`; screenshots under `tmp/visual-planning/`. Existing review records remain historical evidence of what they actually tested, not proof that these gaps were absent.

## The inventory

**Interactive SVG** means a real computed, editable demonstration, with a useful initial state and a print equivalent. **Generated** includes designed scientific infographics, illustrated explanations and equation-bearing diagrams; it is not restricted to photorealistic scenes. **P0** items repair the reading/experiment experience first. **P1** items complete the core teaching path. **P2** items complete supporting research and assessment explanations. All remain in scope; priority is ordering, not permission to silently omit the later items.

### 01. Before the move

Current: 1 figure containers; 0 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| O1 | **Observe → encode → imagine**<br>One mechanism, three questions | Interactive SVG · Replace · P0 | One synchronized moving arm, its camera pixels, an eight-value embedding display, and three action-conditioned future branches. Keep physical joints separate from latent coordinates; distinguish simulator illustrations from actual network outputs. |
| O2 | **Same picture, opposite velocities**<br>A first prediction | Interactive SVG · New · P0 | Start two arms at the identical pose with opposite velocities. Reveal earlier frames, then apply identical commands and watch different futures. Use the Jaxverse HistoryPlate behavior. |
| O3 | **One recurring experiment, three questions**<br>The route through the book | SVG · New · P1 | A small map links seeing, learning and acting to the chapters. Each branch previews the concrete question that its mathematics will answer; avoid an ornamental chapter timeline. |

### 02. Learning before labels

Current: 4 figure containers; 0 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| P1 | **Predict the hidden part**<br>The lesson hidden in an ordinary video | Generated + SVG · Extend · P1 | A designed scientific infographic connects visible frames, an occluded interval and compatible continuations. Keep the scene artwork if useful, but add the missing temporal reasoning and uncertainty. |
| P2 | **LeCun's agent in operation**<br>What LeCun proposes, and what remains a proposal | SVG · Extend · P1 | Highlight perception, memory, prediction, cost and action in sequence for one decision. Separate modules in the broad proposal from those actually implemented by the book. |
| P3 | **Preserve pose, discard a nuisance**<br>Why predict a representation? | Interactive SVG · Extend · P1 | Change background and pose independently. Compare desired invariance with destructive collapse; matching backgrounds must not be confused with a measured learned invariance. |
| P4 | **Nested plans and time scales**<br>Hierarchies shorten the question | Generated + SVG · Extend · P1 | Replace a scenic metaphor alone with nested route, crossing and foot-placement panels, linked horizons and subgoals. Generate multiple sophisticated infographic compositions for selection. |

### 03. A world in coordinates

Current: 1 figure containers; 0 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| G1 | **Pixels become coordinates**<br>From an image to a list of numbers | Interactive SVG · New · P1 | Highlight a 2×2 image pixel, its flattened position, and the two outputs of the chapter's tiny encoder. Show an explicit collision: different images can share an embedding. |
| G2 | **A matrix acts on a grid**<br>Matrices are coordinated linear measurements | Interactive SVG · New · P1 | Show basis vectors and a unit square before and after rotation, shear, scaling and rank loss. Highlight a row's dot product while the corresponding output coordinate changes. |
| G3 | **Rows, columns, dot and outer products**<br>Reading shapes before calculating | SVG · New · P1 | Use small numbered arrays with matching dimensions. Animate one matrix-product entry and contrast a scalar dot product with an outer-product matrix. |
| G4 | **Projection and the closest point**<br>Length, angle, and projection | Interactive SVG · Extend · P1 | Drag a vector and unit direction; expose the scalar coordinate, projected vector, perpendicular residual and Pythagorean squares. Preserve equal units and explain negative projections. |
| G5 | **A plane becomes a line or a point**<br>Rank measures available directions | SVG · New · P1 | Three matched transformations show full rank, dimensional collapse and complete collapse. Highlight distinct inputs that become indistinguishable and the direction lost in the null space. |

### 04. Prediction under uncertainty

Current: 1 figure containers; 1 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| B1 | **Mass, density and accumulated area**<br>Random variables are measurements of uncertain outcomes | Interactive SVG · New · P1 | Link discrete probability bars, a continuous density and its CDF. Shade an interval; show why density height may exceed one while interval probability cannot. |
| B2 | **The mean as a balance point**<br>Expectation is a weighted average | Interactive SVG · New · P1 | Move probabilities on three outcomes and show their weighted contributions, mean and squared deviations. Changing spread should not silently change the mean. |
| B3 | **Conditioning filters the sample space**<br>Conditioning changes which average is relevant | Interactive SVG · New · P1 | Turn the 100-state noisy-sensor example into an icon grid with the 8 true and 18 false positive reports. Link counts, Bayes' fraction and the conditional mean. |
| B4 | **Two futures and an impossible average**<br>Why squared error predicts a mean | Interactive SVG · Extend · P1 | Upgrade the existing mean widget with the full expected-loss curve and synchronized branch outcomes. The track illustration is a metaphor; the numerical panel establishes the optimum. |
| B5 | **Why the bell has this area**<br>The Gaussian family | SVG · New · P1 | Show shifts and scales, then the squared Gaussian integral as a plane partitioned into annuli. Connect annulus area and the substitution in the normalization proof. |
| B6 | **Zero correlation can hide dependence**<br>Independence is stronger than zero covariance | Interactive SVG · New · P1 | Compare independent samples, a parabola Y=X² and a mixture on the same scales. Show conditional slices and matching or differing moments rather than relying on scatterplot appearance alone. |
| B7 | **Repeated experiments and shared seeds**<br>Quantifying finite-sample uncertainty | SVG + simulation · New · P2 | Resample Bernoulli trials and distinguish success-rate variability from training-seed variability. Show why correlated task evaluations are not extra independent samples. |

### 05. The geometry of a cloud

Current: 0 figure containers; 1 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| C1 | **Build a covariance matrix from deviations**<br>Mean and covariance as geometry | Interactive SVG · New · P1 | Move four points, center them, display signed deviation products and assemble the 2×2 covariance. Link positive and negative off-diagonal entries to the point cloud. |
| C2 | **Why B points supply at most B−1 directions**<br>A centered batch has a rank limit | SVG · New · P1 | Show centered rows summing to zero using two and three points. Connect that dependency to the rank limit before giving the high-dimensional example. |
| C3 | **Rotate, measure, whiten**<br>Eigenvectors reveal the cloud's principal directions | Interactive SVG · Extend · P1 | Extend the existing covariance desk with projected samples, eigenvectors and the stages rotate → rescale → rotate back. Explain covariance ellipses as summaries, not distribution boundaries. |
| C4 | **Same covariance, different distributions**<br>Whitening is a moment operation | SVG + linked widget · New · P1 | Compare a Gaussian, ring and crossing-lines distribution with identity covariance. Label finite-sample deviations and show what whitening cannot remove; reuse SIGReg cloud generators. |

### 06. How a small change travels

Current: 0 figure containers; 0 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| D1 | **A secant becomes a tangent**<br>Recover a derivative from a difference | Interactive SVG · New · P1 | Shrink h on x², show rise/run and the discarded h² area. Keep the actual finite difference beside the local slope. |
| D2 | **Slices, contours and a gradient step**<br>Several knobs require partial derivatives | Interactive SVG · New · P1 | Use the book's two-parameter loss. Link one-coordinate slices to partial derivatives, a contour map to the full gradient, and a step-size control to overshooting. |
| D3 | **Follow one perturbation through a graph**<br>A chain multiplies sensitivities | Interactive SVG · New · P1 | Trace x → 2x+b → square → loss forward, then sensitivities backward. Include two paths from a shared parameter so contributions visibly add. |
| D4 | **A local grid and its sensitivity table**<br>A Jacobian is a table of local effects | Interactive SVG · New · P1 | Perturb one input coordinate of the chapter's two-output function. Highlight the Jacobian column, transformed small grid and actual-versus-linearized displacement. |
| D5 | **Tangent, curvature and remainder**<br>Curvature and the second-order approximation | Interactive SVG · New · P2 | Overlay zeroth-, first- and second-order approximations with a shrinking neighborhood. Display the error scale and show why a local model can fail for large steps. |
| D6 | **Maximizing variance on the unit circle**<br>Return to the cloud: why principal directions exist | SVG + interaction · New · P2 | Sweep a unit vector around an ellipse, plot uᵀCu and show the tangent perturbation at an extremum. Add a small nested-box inset for the existence argument. |

### 07. How errors change a model

Current: 0 figure containers; 1 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| N1 | **One neuron as circuit and curve**<br>A neuron, a layer, and a network | Interactive SVG · New · P0 | Adapt Jaxverse OneNeuron and NeuronDiagram: weight, bias, output amplitude and an input probe update both circuit values and curve. Use pointer, touch and keyboard controls. |
| N2 | **Activations and their derivatives**<br>A neuron, a layer, and a network | Interactive SVG · New · P0 | Adapt ActivationAtlas with identical axes for linear, ReLU, tanh, GELU and SiLU. Link saturation to derivative values; label GELU's exact or approximate implementation explicitly. |
| N3 | **Why stacking linear layers is insufficient**<br>A neuron, a layer, and a network | SVG + small training demo · New · P1 | Compose two affine maps, then insert a nonlinearity and fit a curved target. Adapt CurveFit selectively; show initial predictions immediately and retain a fair linear baseline. |
| N4 | **A complete forward and backward pass**<br>Backpropagation is organized chain rule | Interactive SVG · New · P1 | Expand the calculus graph into the chapter's two-layer network. Clicking a weight shows its local factor, upstream sensitivity and resulting gradient beside the hand-worked numbers. |
| N5 | **Noisy gradients and optimizer memory**<br>Momentum and Adam | SVG + simulation · New · P2 | Show the same gradient sequence entering SGD, momentum and Adam. Plot moving moments and bias correction; make the example an algorithm illustration rather than a performance ranking. |
| N6 | **Many fits, different preferences**<br>Regularization begins with an underdetermined question | Interactive SVG · Extend · P1 | Keep the ridge desk and add the one-observation constant-versus-curved example, plus separate data-loss and penalty curves whose sum determines the selected solution. |
| N7 | **Which axis is normalized?**<br>Normalization is also not regularization by definition | Interactive SVG · New · P1 | Show a small batch×feature array. Switch BatchNorm and LayerNorm to highlight different reduction axes and output constraints; include training versus evaluation statistics. |

### 08. Agreement without collapse

Current: 5 figure containers; 0 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| J1 | **Reconstruction versus latent prediction**<br>Three targets, three learning problems | Generated + SVG · Extend · P1 | Design an explanatory infographic with the same scene, a pixel target and a latent target, showing unpredictable detail and retained task structure. Preserve the existing exact computational graphs alongside it. |
| J2 | **Two gradient routes through one encoder**<br>Both sides can move | Interactive SVG · Extend · P1 | Trace context and target contributions through shared weights. Toggle stop-gradient for comparison and show the changed derivative, not just a dashed arrow. |
| J3 | **Agreement can erase all distinctions**<br>Construct the collapse solution | Interactive SVG · Extend · P1 | Animate a cloud shrinking while prediction MSE falls. Compare full and dimensional collapse and keep the physical inputs visibly different. Expose the zero-gradient caveat at exact collapse. |
| J4 | **What each penalty changes**<br>VICReg: three constraints with distinct jobs | Interactive SVG · Extend · P1 | Three synchronized clouds show invariance, variance floors and covariance penalties separately and jointly. Show a ring surviving moment constraints and connect it to SIGReg. |
| J5 | **Images and actions must line up**<br>Temporal prediction adds an alignment problem | SVG · New · P1 | A short filmstrip aligns each action with its transition and contrasts correct indexing with an off-by-one target. Reuse the same layout later for teacher forcing. |

### 09. When does a cloud count as Gaussian?

Current: 0 figure containers; 1 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| T1 | **Build the empirical CDF and KS gap**<br>Compare accumulated probability rather than histogram bins | Interactive SVG · New · P1 | Add samples one at a time, including ties. Draw both sides of each jump and highlight the point producing the maximum discrepancy against the Gaussian CDF. |
| T2 | **A sample distribution is not a statistic distribution**<br>Calibrate by repeating the null experiment | Interactive SVG · Extend · P1 | Link individual Gaussian samples to one KS value, then to the existing null histogram. Mark the observed tail, finite Monte Carlo count and rejection threshold. |
| T3 | **Fixed versus fitted Gaussian reference**<br>Fitting the null changes the question | SVG + simulation · New · P1 | Use the same sample before and after estimating mean and variance; show why the fitted discrepancy shrinks and why calibration must repeat the fit. |
| T4 | **Testing, power and optimization answer different questions**<br>A training penalty is not a hypothesis-test verdict | SVG · New · P2 | Pair a fixed-null rejection experiment with a discrepancy-minimization trajectory. Show repeated false alarms and power without interpreting a p-value as the probability of the hypothesis. |

### 10. A statistic for useful variation

Current: 2 figure containers; 2 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| S1 | **Samples → phases → arrows → average**<br>From a point on a circle to a distributional fingerprint | Interactive SVG · Extend · P1 | Link each scalar sample to its angle and unit arrow before forming the empirical CF. Add an asymmetric sample option so the imaginary mean is not permanently zero. |
| S2 | **A distribution's changing fingerprint**<br>Derive the Gaussian fingerprint | Interactive SVG · New · P1 | Synchronize a density, its samples and real/imaginary CF curves while shifting and rescaling it. Distinguish density space from frequency space and the Gaussian target from the integration window. |
| S3 | **The finite-batch floor**<br>Samples fluctuate even when the target is correct | SVG + simulation · New · P1 | Resample Gaussian batches and plot unscaled discrepancy versus batch-scaled statistic across B. Overlay the derived expectation and show uncertainty across independent repeats. |
| S4 | **A rotating slice reveals hidden dependence**<br>Why projections can reveal a multivariate distribution | Interactive SVG · New · P1 | Project (X,SX) along the axes and diagonal, with linked histograms/CFs. Show the diagonal point mass, then explain the gap between all directions and finitely sampled ones. |
| S5 | **Frequency window, truncation and trapezoids**<br>From the integral to a finite computation | Interactive SVG · New · P1 | Show error×window, endpoint A and grid K on one exact curve. Change A and K separately, compare with a dense integral and display doubled positive-side weights. |
| S6 | **The same discrepancy as pairwise distances**<br>An independent way to check the integral | SVG · New · P2 | Expand the squared empirical mean into a B×B pair table. Link its three terms to the closed-form Gaussian integrals and to the numerical quadrature result. |
| S7 | **Follow one sample's regularization gradient**<br>Differentiate every step | Interactive SVG · New · P1 | Select a sample, direction and frequency; expose cosine/sine contributions and the return path to its embedding. Compare exact collapse with a small perturbation using real computed derivatives. |
| S8 | **SIGReg at a glance**<br>Return to the world model | Generated + SVG · New · P1 | Produce a carefully designed multi-panel infographic: cloud, random projections, phasors, Gaussian comparison, integration and gradient. Generate five compositions for selection; verify all displayed equations and axes. |

### 11. From equations to a learner

Current: 0 figure containers; 0 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| I1 | **The moving tensor shapes**<br>Follow one window through its shapes | Interactive SVG · New · P1 | Trace an actual three-frame/two-action window through encoder, concatenation, residual predictor and target. Highlight B, T and d axes without rearranging their meaning between panels. |
| I2 | **What is averaged, and when?**<br>Make the two reductions explicit | Interactive SVG · New · P1 | Select a time slice, average samples before squaring, integrate frequencies, then average projections/time. Contrast the wrong order on the same tiny array. |
| I3 | **Every array entry has a source**<br>Trace SIGReg with a tiny concrete array | SVG + linked code · New · P1 | Synchronize the 2×2 example with projected values, phases, means and weighted sum. Clicking an operation highlights the matching tested reference-code line. |
| I4 | **An episode split prevents frame leakage**<br>Data splitting and matched comparisons | SVG · New · P1 | Show overlapping windows on a timeline and compare a random-window split with an episode split. Mark shared frames and explain what the stronger split still does not test. |
| I5 | **What a training checkpoint contains**<br>Optimization state is part of the experiment | SVG · New · P2 | Separate parameters, Adam moments, step count and random-stream state. Show resume versus reinitialize so continuous training has a concrete conceptual meaning. |

### 12. A world model you can train

Current: 1 figure containers; 2 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| L1 | **A complete untrained experiment**<br>Before you press train | Interactive SVG + model · Replace · P0 | On arrival show physical arm, camera, goal, initialized embeddings and step-zero evaluation. Prepare the model near the viewport; no empty camera boxes or invisible mechanism. |
| L2 | **Training that continues until paused**<br>Read the evidence, not just the curve | Live model + charts · Extend · P0 | Default Train starts ongoing updates, Pause stops them, and Resume preserves weights/moments/step count. Keep optional bounded experiments and periodic evaluation without silently restarting the run. |
| L3 | **The same future-choice task before and after learning**<br>Read the evidence, not just the curve | Interactive SVG + model · New · P1 | Adapt Jaxverse future-choice/evidence panels. Keep candidates fixed, show predictor and persistence selections, and refresh scores from the current checkpoint rather than a canned success animation. |
| L4 | **Branch, predict, execute, compare**<br>Let the learned model choose actions | Interactive SVG + model · Extend · P0 | From one frozen context, show push/reverse/release predicted rollouts and actual simulator continuations side by side, then replay one. Expose untrained failure and label the fitted drawing readout. |
| L5 | **Watch collapse develop**<br>Read the evidence, not just the curve | Live comparison · New · P1 | Run the matched prediction-only model beside a frozen regularized checkpoint. Show spread, rank and task evidence as well as loss; mismatched intermediate update counts remain explicit. |
| L6 | **A result includes failures**<br>Research correspondence | SVG charts · New · P2 | Draw the recorded local and distant-goal trajectories with tolerance and final-occupancy criteria. Label seed, budget and provenance and keep historical data visually distinct from the live run. |

### 13. From imagination to action

Current: 2 figure containers; 1 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| A1 | **Which variables can change?**<br>Separate learning from planning | SVG · New · P1 | Two matched graphs hold actions fixed while learning parameters, then hold parameters fixed while searching actions. Highlight optimized variables and the goal encoding. |
| A2 | **One visible CEM iteration**<br>CEM refits a distribution to promising plans | Interactive SVG · Extend · P1 | Sample action pairs on a cost map, retain elites, refit mean/spread and repeat. Link the elite moments to the likelihood derivation and show the variance floor. |
| A3 | **One-step fit versus free rollout**<br>Teacher forcing does not eliminate rollout error | Interactive SVG · Extend · P1 | Align observed and fed-back contexts on a timeline, then show predicted and actual trajectories as horizon changes. Keep the existing worst-case bound separate from measured errors. |
| A4 | **Plan, execute a prefix, observe again**<br>MPC spends predictions in short installments | Interactive SVG · Extend · P1 | Scrub through one plan and vary the execution prefix independently of horizon. Show stale open-loop predictions being replaced by a new observation and compare the browser/paper cadence. |
| A5 | **A good latent score can make a bad physical plan**<br>Why latent distance might help, and when it misleads | SVG + simulation · New · P1 | Distort an embedding map or introduce model error, then compare imagined cost with actual outcome. Include a goal reached with momentum and subsequently lost. |

### 14. What counts as understanding?

Current: 1 figure containers; 0 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| E1 | **Recovering information versus controlling it**<br>Linear and nonlinear probes | Interactive SVG · Extend · P1 | Use one physical dataset with a linear and a nonlinear encoding. Fit small probes, report held-out errors, and connect to the existing three-level evidence diagram. |
| E2 | **Rotate coordinates, preserve predictions**<br>The freedom to rename latent coordinates | Interactive SVG · New · P1 | Rotate embeddings and transform the predictor consistently. Show unchanged distances and expected isotropic objective, while a finite fixed projection set may change its SIGReg score. |
| E3 | **A short turn across the wrap boundary**<br>Angles require circular error | Interactive SVG · New · P1 | Move two markers around a circle and show naive difference, wrapped difference and shortest arc. Include the +π/−π example before the circular RMS formula. |
| E4 | **Neighbors versus global geometry**<br>Why t-SNE is not a map of physical distance | SVG · New · P2 | Connect a small neighborhood-probability matrix to two low-dimensional layouts. Highlight preserved local neighbors and misleading gaps or rotations; compute examples instead of inventing clusters. |
| E5 | **Several futures in one energy landscape**<br>Compatibility, energy, and multiple futures | Generated + interactive plot · New · P1 | An infographic pairs branching outcomes with a computed two-basin energy plot. Vary temperature to connect energy with normalized probability while preserving the distinction between the two. |
| E6 | **Appearance change versus physical violation**<br>Surprise is an error before it is a probability | SVG + simulator · New · P1 | Show matched video strips for normal motion, color change, occlusion and teleportation. Plot actual model errors with the intervention marked; label illustrative data if a setup is purely conceptual. |
| E7 | **Read the metric, not the picture**<br>Temporal straightness; expectiles; ablations | SVG small multiples · New · P2 | Three compact panels: displacement angles and straightness; asymmetric squared loss and its expectile; controlled seed/ablation comparisons. Each directly accompanies its corresponding formula. |

### 15. What Gaussian geometry can promise

Current: 0 figure containers; 0 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| R1 | **Little input variation makes a slope uncertain**<br>Begin with a one-coordinate probe | SVG + simulation · New · P1 | Repeatedly refit a line to the same fixed design with fresh label noise, then shrink the input spread. Link the coefficient histogram to the variance calculation. |
| R2 | **Isotropy and difficult directions**<br>Bias and variance come from repeated training sets | Interactive SVG · New · P1 | Redistribute a fixed covariance trace between two axes. Show directional ridge bias and least-squares variance, including the privileged-task counterexample to universal optimality. |
| R3 | **Kernel weights make a prediction**<br>A local probe averages nearby labels | Interactive SVG · New · P1 | Reproduce the −1,0,1 triangular-kernel example. Move the query and bandwidth; show each normalized weight, label contribution and denominator, including an empty neighborhood. |
| R4 | **Why unequal neighbor density creates bias**<br>Taylor expansion explains the density score | SVG + interaction · New · P1 | Compare symmetric neighborhoods with balanced and unbalanced sample density. Show first-order cancellation, curvature and the density-gradient contribution to the smoothed estimate. |
| R5 | **Density, log density and score**<br>Fisher information measures average score magnitude | Interactive SVG · New · P1 | Link the three curves for narrow and broad Gaussians, then accumulate squared score. Illustrate the fixed-covariance assumption and distinguish a score from an attention weight. |
| R6 | **What the theorem does and does not connect**<br>From a score bound to a probe-bias bound | SVG · New · P1 | A dependency diagram links regularity and covariance assumptions to Fisher minimization, then to a bound. Leave the unsupported jump to universal downstream optimality visibly unconnected; include Gaussian nuisance encoding as a counterexample. |

### 16. Inside the vision transformer

Current: 1 figure containers; 1 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| V1 | **Image → patches → tokens → CLS**<br>Patches turn an image into a sequence | Interactive SVG · New · P1 | Use an actual arm frame. Select a patch, flatten it, project it, add position information and follow the CLS token. Match the paper's 224/14/192 dimensions with a smaller legible teaching example. |
| V2 | **One query retrieves a weighted answer**<br>Queries, keys, and values; softmax | Interactive SVG · Extend · P1 | Replace a flowchart-only explanation with selectable tokens, a score matrix, row normalization and weighted values. Keep the existing temperature bar chart as one view of the same computation. |
| V3 | **The mask before maximum and exponential**<br>Causal masking enforces an information boundary | Interactive SVG · New · P1 | Show the triangular allowed region, forbidden scores, stabilized exponentials and row sums. Perturb a future token and demonstrate unchanged earlier outputs in the tested standalone function. |
| V4 | **Normalize, then condition with an action**<br>Layer Normalization; action conditioning | Interactive SVG · New · P1 | Compare per-token geometry before/after normalization; show AdaLN shift, scale and residual gate responding to an action. At zero initialization the identity path should be numerically visible. |
| V5 | **Self-attention and cross-attention**<br>Multiple heads; diagnostic decoder | SVG · New · P2 | Use consistent Q/K/V colors and explicit shapes to show independent heads and patch queries reading a different collection. Mark decoder training as a separate diagnostic stage. |

### 17. The papers as a conversation

Current: 0 figure containers; 0 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| H1 | **The prediction target changes**<br>I-JEPA; V-JEPA; V-JEPA 2 | SVG · New · P1 | Matched image/video/action filmstrips explain spatial masking, temporal masking and action-conditioned prediction. Show moving-average targets and stop-gradient where each method actually uses them. |
| H2 | **What is frozen, trained and regularized?**<br>DINO-WM; PLDM; LeJEPA; LeWM | SVG · New · P1 | A common diagram grammar compares four training graphs, target gradients and losses. Explicitly distinguish feature pretraining from the world-model training being shown. |
| H3 | **A research lineage organized by questions**<br>Compare the training setups | Generated infographic · New · P2 | Five candidate atlas-style layouts group papers by obstacles and design choices, with versioned dates as secondary context. Avoid a chronological ladder implying that every successor dominates. |

### 18. Read LeWorldModel closely

Current: 1 figure containers; 0 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| W1 | **The complete LeWM training computation**<br>The encoder: one frame becomes one compact vector | SVG · Extend · P1 | Expand the current architecture with actual tensor shapes, shared weights, target gradients, time-wise SIGReg and the stated projection dimensions. Pair paper notation with the pinned-code reductions. |
| W2 | **One action block versus one physical action**<br>Equations 4 and 5: plan in the learned coordinates | SVG timeline · New · P1 | Draw four observations, context/target shifts, five-action blocks, horizon and execution prefix. Make the paper's cadence visibly different from the teaching controller's one-action loop. |
| W3 | **Read the published evidence visually**<br>Section 4; ablations; Appendices H/I | SVG charts · New · P1 | Redraw selected v1 results from verified source values with denominators, units, seeds and uncertainty conventions. Include exceptions and failures; never fabricate missing error bars or traces. |

### 19. Build, challenge, explain

Current: 0 figure containers; 0 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| K1 | **Build the two graphs yourself**<br>Specify the information boundary; explain the model | Interactive SVG · New · P2 | Let the reader label training and planning graphs, then reveal the worked answer. Mark simulator-only state, data, learned representations, gradients and optimized actions. |
| K2 | **One experiment, its evidence and limits**<br>Write a claim that survives its own evidence | SVG report · New · P2 | An exportable result card combines actual configuration, plots, successes and failures. Start with the untrained run and fill measurements as work proceeds; never invent a completed experiment. |

### 20. Keep the whole argument in view

Current: 0 figure containers; 0 widgets.

| ID | Figure / placement | Medium · action · priority | What the reader should see or do |
|---|---|---|---|
| X1 | **A visual notation key**<br>Symbols and axes | SVG + KaTeX · New · P0 | A compact shared legend shows each semantic role across prose, equations, tensors and plots in both themes. Separate physical joints from latent dimensions and distinguish a density from its CF. |
| X2 | **From a paper equation back to its prerequisites**<br>The learning route; coverage map | SVG + links · New · P2 | A navigable dependency map connects the nine numbered paper equations to their prerequisite lessons and the relevant figures. Keep the existing precise coverage table as the textual equivalent. |

## First complete moving scenario: O1, O2 and L4

The replacement must tell the story that the old image attempted to tell. A beautiful arm outline alone does not meet this requirement.

**O1, Observe → Encode → Imagine.** Three panels share a single clock and selected action. Left: a moving two-link mechanism and its actual camera frame. Middle: an encoder block and a compact eight-coordinate display; never draw eight coordinates as eight anatomical joints. Right: proposed commands and their possible continuations. Link one selected time/frame across all panels with the same symbols used in the equations. At the opening, any explanatory encoding or simulator future must be labeled as such. The later laboratory substitutes real encoder/predictor outputs and exposes the checkpoint used. A simulator animation must never masquerade as learned prediction.

**O2, the missing velocity.** Port the behavior of Jaxverse's `HistoryPlate.svelte`, not just its line shapes: two identical starting pictures, opposite hidden velocities, identical actions, visibly different subsequent motion. “Reveal history” supplies the earlier frames that make the motion distinguishable. Play, Pause, Replay and a time scrubber work before model initialization. The initial pose alone must not encode the answer through a different color, camera angle or joint position.

**L4, the forecast experiment.** Port Jaxverse's shared-context push/reverse/release scenario. Hold the same preceding observations and checkpoint fixed while comparing actions. Display actual untrained predictions first. Then allow training and repeat the same test. Separate latent prediction error from the labeled readout used to draw an imagined arm. Side-by-side actual and imagined films are more intelligible than piling all ghosts onto one mechanism.

**Motion policy.** The lightweight opening illustration can play a short explanatory sequence once when visible, with an obvious Pause/Replay control; it must actually move. Reduced-motion mode supplies still frames and Step. Pause offscreen animation, retain the current state, and use a fixed simulation step so display refresh rate does not change physics. Never start training merely because an animation is visible. Reading and training remain usable during animation.

**Acceptance.** At a fresh visit, see a complete scenario. At two different simulation times, joint positions and synchronized camera observations actually differ. O2 begins with identical images and diverges under identical commands. Replay restores identical initial conditions. Every mechanism retains two physical links and uses the simulator's link lengths. Labels, equations and arrows remain readable in both themes and at phone width.

## A laboratory with useful initial states and continuous training

Use an explicit lifecycle: **illustration available → preparing random model → untrained, step 0 → training → paused → resumed**. Errors have a separate state with a useful explanation and retry; they must not look like an ordinary empty widget.

| Surface | First-visit behavior | Behavior after training begins |
|---|---|---|
| Physical arm and cameras | Draw immediately from the simulator; no model dependency | Keep displaying real physical state and actual sensor pixels |
| Initial embeddings and predictions | Initialize once when the lab approaches the viewport; perform genuine inference with random weights; identify step 0 | Refresh against the current, identified checkpoint |
| Curves | Labeled axes and one measured initial evaluation point; distinguish evaluation from training-batch measurements | Append real data; never draw a fabricated learning history |
| Prediction/persistence, spread and rank | Show measured step-zero values once prepared | Re-evaluate at bounded intervals, not only when a long run ends |
| Future-choice comparison | Render observations/candidates immediately, then score them with the untrained model | Retain the same fixed test so changes reflect learning |
| Controller and imagined future | A visible goal and physical arm from the start; run the random-weight predictor once ready | Replay a frozen forecast or execute a plan; labels identify which checkpoint supplied it |
| Prediction-only comparison | Explain the paired experiment and show initialized state, not a blank table | Freeze the regularized checkpoint and match its update count; expose intermediate count differences |

The eight existing mathematical widgets already have initial numerical states; audit each rather than replacing them indiscriminately. Their upgrades are attached to C3, B4, N6, V2, A3, T2, S1 and the S-series figures. The two model-dependent widgets are the cold-start failures confirmed in the browser.

### Continuous training behavior

- **Train** means run until the reader presses **Pause**. Show a continuous mode as the default; keep explicit “500 updates”, “2,000 updates” or a custom bounded run for controlled experiments.
- **Resume** preserves encoder weights, predictor weights, Adam moments, step count and the data/projection random streams. Changing a seed or architecture is an explicit reset, not a side effect of Train.
- Use small sequential worker chunks so Pause, evaluation and UI updates are responsive. A long infinite worker task would starve other requests; simply replacing the existing budget with an enormous number is not the design.
- Separate training mode from the current global `busy` flag. Reading, theme switching, explanations and harmless display controls remain usable. Schedule inference/evaluation between chunks or use a deliberately frozen snapshot; do not race training mutations with planning reads.
- Refresh held-out diagnostics periodically by time/step budget. A displayed forecast carries a checkpoint identity; when learning changes the model, refresh it or mark it as the saved forecast being replayed.
- Bound stored chart history and dispose temporary tensors. A longer run should not grow memory without limit. Keep an overall step count while downsampling older plot points.
- Pause when the page becomes hidden, say why, and offer Resume. Do not imply that a closed/suspended browser keeps training. Optional bounded runs remain useful for reproducibility.
- For a matched baseline, freeze the comparison target at the requested checkpoint. Ongoing regularized training must not move the goalposts while its baseline tries to catch up.

**Acceptance scenarios:** an untouched first visit; step-zero inspection; a continuous run that exceeds the old 5,000-step cap; Pause during a worker chunk; Resume with retained optimizer state; theme change while training; comparison during a saved checkpoint; backend failure/retry; narrow layout; and bounded memory over a longer run. A short smoke test verifies wiring but is not sufficient evidence for the continuous-run feature.

## Reuse Jaxverse deliberately

Keep the current single-file delivery and simple authoring setup. Reuse mathematical functions, geometry and interaction designs; a framework migration is not needed merely to adapt these components.

| Jaxverse source, relative to `/Users/neo/repos/jaxverse/` | Carry over | Changes required for this book |
|---|---|---|
| `src/lib/components/demos/neuron/OneNeuron.svelte` | Coupled neuron circuit, weight/bias/amplitude sliders and curve probe | Book notation, HugeIcons, touch/keyboard probing, shared palette |
| `src/lib/components/demos/neuron/NeuronDiagram.svelte` | Signal path, activation symbol and live intermediate values | KaTeX labels and a consistent observation/output/parameter distinction |
| `src/lib/components/demos/neuron/ActivationAtlas.svelte` | Identical-scale activation/derivative plots and probe readouts | Focus on activations actually used here; verify every derivative and approximation |
| `src/lib/components/demos/neuron/activations.ts` | Function definitions as a reference | Its GELU uses a tanh approximation and numerical derivative; do not label that curve as exact xΦ(x) without changing the implementation |
| `src/lib/components/demos/neuron/CurveFit.svelte` | Near-viewport initialization, immediate untrained curve, train/pause behavior and hidden-unit views | Keep the smaller teaching scope, tested learner, and no premature dependence on world-model training |
| `src/lib/components/demos/world/HistoryPlate.svelte` | Identical-pose/opposite-velocity experiment, real histories, replay and reduced motion | Integrate with this book's opening narrative and controls |
| `src/lib/components/demos/world/Instrument.svelte` | Tapered links, bearings, mount, physical traces and goal/forecast grammar | Geometry is already partly reused; add the actual scenario and animation lifecycle |
| `src/lib/components/demos/world/WorldPlate.svelte` | Forecast sequencing and useful state before results arrive | Port the relevant behaviors; avoid duplicating its entire application state system |
| `src/lib/world/forecast-scenario.ts` | Shared preceding motion and push/reverse/release commands | Match time interval, initial context and actions supplied to our predictor |
| `src/lib/components/demos/world/CandidateFutures.svelte` | Separate candidate plans, costs and rankings | Source scores from our model, distinguish actual and imagined outcomes |
| `src/lib/components/demos/world/LearningEvidence.svelte`, `Projection.svelte`, `src/lib/world/future-choices.ts` | Candidate evidence and embedding views | Inspect these sources in full before porting; their existence is not evidence their behavior has already been audited |

The source inspection for this plan covered the named neuron/activation/curve-fit and history/forecast/candidate mechanisms. No Svelte source was changed. Adaptation should carry provenance and retain scientifically useful distinctions rather than copying explanatory prose or colors blindly.

## Generated infographics: propose choices, not one unexplained result

Generated images belong in this book as designed explanations as well as rich scenes. They can contain typography, equations, diagrams, cutaways and visual analogies. The previous restriction to natural-looking scenes was an unnecessary interpretation of the request.

There are six explicit generated-plate briefs in the inventory: **P1, P4, J1, S8, E5 and H3**. For each major plate, produce **four or five full candidate compositions** before selecting a final version. Start with **S8, the SIGReg overview**, because it tests whether the chosen visual language handles the hardest combination of diagrams, arrows, symbols and equations. Continue SVG and training work while the user chooses; do not stall the whole book on an art decision.

Five useful directions for that first comparison:

1. **An annotated scientific atlas:** one central cloud, carefully spaced projection insets, explicit equations and short explanatory captions.
2. **A worked visual sequence:** six numbered stages with the same four sample identities carried from cloud to phasor mean to discrepancy.
3. **A conceptual cutaway:** a high-dimensional cloud suggested spatially, a projection plane, a complex plane and a frequency integral, each clearly separated and labeled.
4. **A restrained LeCun-style research plate:** paired computational paths, shared color roles, broad whitespace, precise blocks and a small motivating scene.
5. **An illustrated mathematical notebook:** visually rich but orderly, with the derivation broken into annotated panels and consistent manuscript typography.

These are composition alternatives, not five palette swaps of the same picture. Present them at readable size with neutral labels A–E and the intended teaching objective. Save prompts, source model information actually reported by the tool, images and review notes. Do not claim Sunburst unless the available generation route can select or verify it.

### Generation and selection requirements

Give the generator the exact scientific content, symbol roles, panel relationships, desired wording and a short forbidden-error list. Examples: do not turn latent coordinates into anatomical joints; do not draw a density as a CF; do not replace a sample average with an angle average; do not depict finite projection matching as a proof of population Gaussianity.

Check each candidate for scientific correctness as well as beauty. Read every equation, subscript, arrow direction and label. Reject misleading geometry or relationships even if the illustration is attractive. The model is allowed to render equations; an editable KaTeX overlay is available when the chosen composition benefits from separately maintained labels. It is not a rule that generated diagrams must avoid mathematics.

After the user chooses a direction, refine composition and typographic details. Prepare light/dark-compatible treatment without blindly inverting an image. A theme-specific version or a deliberately framed neutral plate can work; check the result in the actual reader. Supply a concise HTML explanation/alt text and a readable print version. Only selected images enter the manuscript; alternatives remain in a separate contact sheet.

For charts presenting measured values, compute the data and preserve provenance. Generated artwork may explain the method or contextualize a chart, but must not invent benchmark plots, learning curves or experimental evidence.

## A book-wide equation-color system

The unit of consistency is a **mathematical role**, not a letter. The same letter may mean a physical angle, a query, or a probability in different contexts. A global search-and-replace that colors every `q` identically would create more mistakes.

| Role | Theme-aware family | Typical uses |
|---|---|---|
| Given observations, data or specified reference | Blue | Camera observation, known input x, provided target y, standard-Gaussian reference CF |
| Internal representation or derived geometry | Violet | Embedding z, hidden activation h, projected sample, covariance cloud |
| Predicted or estimated quantity | Teal | Predicted embedding, predicted scalar, empirical CF, fitted response |
| Chosen action or measurement/control setting | Amber | Motor command, chosen projection direction/frequency; local numerical controls when explicitly introduced |
| Error, discrepancy, loss or penalty | Rose | Residual, prediction loss, regularizer, control cost and loss sensitivities |
| Operators, punctuation, dimensions and unassigned parameters | Ink | Sum signs, equality, matrix dimensions, neutral learned parameters |

Use local, explicit legends when a general mathematics lesson needs a more specific assignment. An action and an attention matrix must not acquire the same meaning merely because both use A. Resolve the current macros' inconsistencies, including how unit projection directions are colored, before propagating the system.

### Implementation plan

1. Establish a shared symbol/role registry with scalar, vector, matrix, estimated and indexed forms. Record local overloads. Give covariance C, density p, CF φ and parameter θ distinct definitions rather than treating every new symbol as obvious.
2. Generate semantic classes for KaTeX from trusted, controlled notation macros; map those classes to theme tokens. Replace the current post-render literal-hex substitution as the primary mechanism. Do not rewrite arbitrary TeX strings with regular expressions and assume semantic correctness.
3. Walk every chapter's displayed equations **and inline occurrences**. Assign roles manually in context. Preserve the role through all steps of a derivation; index and hat styling must not fall outside the colored symbol by accident.
4. Apply the same registry to SVG/HTML labels, computed charts, legends and chosen generated plates. Axes and key numeric readouts need the same semantic cues as their formulas.
5. Every teaching display should have a deliberate color decision. Most should highlight the meaningful quantities; a neutral identity is acceptable only when there is no relevant semantic distinction. Track exceptions rather than leaving whole chapters uncolored by omission.
6. Keep operators neutral and use color sparingly enough to read a long derivation. Retain hats, boldness, labels, line styles and shapes so color is never the only way to distinguish roles.
7. Test screen light/dark and print separately. A theme switch changes readable shades while retaining semantic identity; print and grayscale still convey the relationships.

**Acceptance:** an equation inventory records chapter, source, rendered form and semantic roles. The same observation/embedding/prediction/action/loss has the same treatment in the surrounding prose, diagram and code explanation. No malformed TeX or lost subscripts, no light-only hard-coded math colors, and no page-width overflow. The count of colored fragments is a diagnostic, not a quality target by itself.

## Fix dark mode at the source

The current styles are layered overrides across `style.css`, `polish.css` and `reader.css`. That made the last theme pass miss inline code and makes future figures vulnerable to the same failure. Consolidate the active component styling around the shared tokens and remove superseded rules rather than adding another patch layer.

Audit these classes of surfaces in both themes:

- Inline code in paragraphs, lists, tables, captions and summaries; code blocks, line numbers, highlighting, selection and copy states.
- Tables, proofs, exercise answers, notes, legends, captions, links, focus, hover, disabled, loading, error and empty states.
- Every SVG fill/stroke/marker/foreignObject label, including nested KaTeX and hats/subscripts.
- Every canvas at first paint, after resize and after a live theme switch. A cached chart cannot retain the earlier palette.
- Generated plates, transparent assets and any intentionally framed raster surfaces.
- Training and planning views before preparation, during training, after pause, after reset and when a backend fails.
- Print while starting from either theme, plus keyboard and reduced-motion use.

The actual grayscale camera pixels should stay true to what the model sees. Their white background is image data, unlike the erroneous white rectangle behind an inline code token. Make that distinction legible through framing and captions instead of changing the numerical observation when the theme changes.

Use a browser sweep to flag suspicious fixed bright fills on dark surfaces, then inspect the flagged elements. Screenshots should cover every component state, not only chapter openings or a few selected text colors. Add the exact `weights` paragraph as a regression example.

## Keep reviewing the writing while figures are built

Each figure requires a local edit pass on the paragraphs immediately before and after it. Do not append pictures to unchanged prose and assume the lesson is now approachable.

For each brief, record:

- **Starting knowledge:** which previously taught operation or concept is required? Link back only when that link supplies needed knowledge.
- **Question:** what should the reader predict before touching a control or looking at the next panel?
- **Observation:** what visible change supports the explanation? Name what stays fixed.
- **Calculation:** trace one small numerical example from visual to formula. Define every newly used axis, symbol and averaging operation.
- **Generalization:** show how the small example becomes the research expression, identifying definitions, identities, choices, approximations and empirical claims.
- **Counterexample:** include the most useful failure of the tempting overclaim, rather than attaching a generic disclaimer after every paragraph.
- **Reader language:** replace slogans, promotional claims and repeated “we can now” transitions with the actual causal explanation. Remove unnecessary “honest”, “powerful”, “theorem of intelligence” and “not magic” framing.

Priority text risks: physical pose versus hidden state; a conditional mean versus an actual future; likelihood versus probability; variance normalization versus Gaussianity; finite-batch tests versus optimization; finite projections versus all projections; a Gaussian marginal versus retained physical information; a probe versus usable planning distance; and diagnostic decoding versus the actual predicted latent state.

Use the running arm to connect lessons, but do not force it into every theorem. A four-point cloud or a three-number weighted average is often the clearer example. The hard theory chapters need visible intermediate examples and a clear prerequisite route; more proof text alone is not a substitute.

An independent beginner read-through and mathematical review remain valuable validation after implementation. Until they occur, report authoring checks accurately rather than describing the pedagogy as proven.

## Delivery order and the definition of finished

| Stage | Deliverable | Required evidence before treating it as complete |
|---|---|---|
| 1. Shared foundation and working opening | Theme/notation rules; repaired inline code; O1/O2 moving scenarios; L1/L2/L4 initial states and continuous training; X1 legend | Cold-start video/screenshots, both themes, working pause/resume, retained optimizer state, real step-zero outputs, correct physics and readable labels |
| 2. Mathematical foundations | G, B, C, D and N briefs; Jaxverse neuron/nonlinearity adaptations | Each concept links a visible example to the actual formula; numeric checks, mobile use and print snapshots |
| 3. JEPA and the full SIGReg explanation | J, T, S and I briefs; first five generated S8 alternatives | Complete sample-to-gradient story, correct axes/reductions, finite-sample distinctions, user-visible art choices |
| 4. Learning, planning and evaluation | Remaining L briefs, A and E briefs | Honest untrained/trained comparisons, real forecasts, fixed evidence sets, continuous-run reliability and measured outcomes |
| 5. Research bridges and full-book finish | R, V, H, W, K and X2; other generated plate selections | Figure and text review for all 20 chapters, source-checked charts, symbols consistent with the final paper, all-state theme sweep and full print review |

P1/P4 generated concept work can run alongside foundations; stages need not serialize unrelated work. The stage boundaries exist to make progress visible, not to authorize stopping after the first attractive section. Preserve the complete inventory across turns.

Maintain these states in `book/figure-plan.json`: `planned`, `in progress`, `implemented`, `numerically checked`, `visually checked`, `text integrated`, `complete`; generated plates can also be `awaiting selection`. Add artifact paths and evidence as they exist. A title, placeholder SVG, attractive screenshot, or passing build is not completion.

A figure is complete only when it teaches the stated point, its labels/formulas are correct, its initial state is useful, its interaction works, its associated prose is integrated, and desktop/mobile/light/dark/print have been checked. Where two briefs are combined, record the combined artifact and verify both objectives. Do not quietly delete a brief from the count.

A whole-book finish requires every brief to be complete or explicitly consolidated with a completed item; no training-dependent blank widgets; continuous training demonstrated beyond the old cap; no unexplained cold-start states; the equation-role audit complete; no known theme defects; source-backed measured charts; selected and corrected generated artwork; and a final list of remaining scientific or pedagogical uncertainties. Update the HTML and PDF from the same source only after those checks. Report remaining work by ID at intermediate handoffs so one polished slice cannot be mistaken for completion of the book.


## Implementation ledger

All 98 briefs now map to a completed object in `figure-plan.json`: 93 teaching figures and five changes integrated directly into the real training laboratory. The ledger records the source, reader anchor, evidence and any change in presentation. `../figure-atlas.html` links to every item. This is a traceable coverage claim, not a claim that every original suggested composition was followed literally. Several architecture comparisons use editable equation/role cards alongside the original SVG; G3 now lays out each row × column product without an arbitrary selection control. The local neighborhood/KL and intervention displays explicitly identify constructed calculations.

The six generated plates have 4–5 composition choices per subject in `../illustration-gallery.html`. Corrected editorial selections are already embedded so the book is complete without a selection round; the user can replace them later. Rejected architecture drafts are not used as sources.

The laboratory now prepares actual random weights near the viewport, evaluates update zero, displays fixed future-image choices, runs until paused, and replays shared-context forecasts. Its long run passed 5,075 updates, resumed to 5,095 without reset, and retained the untrained comparison. Browser/theme/print inspection and the numerical checks are described in the review record.
