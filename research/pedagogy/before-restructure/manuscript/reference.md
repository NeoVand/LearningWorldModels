# Keep the whole argument in view

<p class="lead">Use this map to return from a compact research formula to the explanation that makes it meaningful.</p>

## The learning route

| Question | Read | What you should be able to do afterward |
|---|---|---|
| Why learn from observations? | [Learning before labels](#philosophy) | Separate world knowledge, preferences, memory, and action selection |
| What does an embedding retain? | [A world in coordinates](#geometry) | Compute projections, covariance, rank, and whitening; identify lost distinctions |
| What can a prediction promise? | [Prediction under uncertainty](#probability) | Derive the conditional mean and distinguish uncertainty from model error |
| How does learning change a function? | [How errors change a model](#learning) | Trace gradients and explain optimization, regularization, and normalization |
| Why is JEPA nontrivial? | [Agreement without collapse](#jepa) | Construct collapse and compare contrastive, teacher, and regularized remedies |
| Why these papers? | [The papers as a conversation](#lineage) | Compare targets, gradient paths, inputs, and evaluation contracts |
| What is inside the research architecture? | [Inside the vision transformer](#transformers) | Reconstruct attention, masking, CLS readout, and AdaLN conditioning |
| How does SIGReg work? | [SIGReg from the ground up](#sigreg) | Derive and differentiate the finite statistic, with its sampling qualifications |
| Why a Gaussian target? | [What Gaussian geometry can promise](#theory) | Follow the probe and Fisher-information argument without overstating it |
| How does the objective become code? | [From equations to a learner](#implementation) | Trace every array axis and both encoder gradient paths |
| Does it actually learn? | [Learning laboratory](#laboratory) | Train, inspect collapse, test interventions, and retain control failures |
| How do predictions choose actions? | [From imagination to action](#planning) | Derive CEM, rollout bounds, and the MPC correction loop |
| What exactly does the final paper say? | [Read LeWorldModel closely](#paper) | Reconcile compact equations, implementation choices, and empirical claims |
| What constitutes evidence? | [What counts as understanding?](#evaluation) | Interpret probes, surprise, straightness, baselines, and uncertainty |
| Can you reconstruct the whole system? | [Build, challenge, explain](#capstone) | Complete a controlled experiment and write a qualified conclusion |

## Symbols and axes

The semantic colors are blue for observations, violet for representations, teal for predictions, amber for actions, and vermilion for losses or costs. A hat also marks prediction, so meaning does not depend on color alone. Neutral mathematical parameters remain neutral when coloring would imply a semantic role they do not have.

| Symbol | Meaning | Important distinction |
|---|---|---|
| $\obs_t$ | Observation at environment time $t$ | Not the full physical state |
| $s_t$ | Physical state in an explanatory model | Used as a label only where explicitly stated |
| $\lat_t=f_\theta(\obs_t)$ | Learned embedding | Coordinates are not automatically named physical variables |
| $\pred_{t+1}$ | Predicted next embedding | Hat means predicted, not observed |
| $\act_t$ | Action associated with transition $t\to t+1$ | May be an action block in the research model |
| $\theta,\psi$ | Encoder and predictor parameters | Fixed during planning; updated during training |
| $\xi$ | Optional uncertainty latent in the broad JEPA proposal | Distinct from an observation embedding |
| $B,T,d$ | Batch size, sequence length, embedding width | Never interchange their averaging axes |
| $N$ | Context length in the research discussion | Local definitions are stated when a source uses it differently |
| $\Z_r$ | Batch of embeddings at time position $r$ | Usually $B\times d$ within one regularizer call |
| $\uvec,\U$ | One unit projection direction; matrix of directions | Columns of $U$ are normalized |
| $M,K$ | Number of directions; number of frequency nodes | $K_{\mathrm{exec}}$ separately denotes an MPC execution prefix |
| $\freq$ | Characteristic-function frequency | Not environment time |
| $\cf,\ecf$ | Population and empirical characteristic functions | The empirical object fluctuates across batches |
| $\target(\freq)=e^{-\freq^2/2}$ | Standard-Gaussian characteristic function | Not a density in frequency |
| $\disc,\stat$ | Unscaled discrepancy and batch-scaled statistic | Their sampling floors scale differently |
| $\lambda$ | Representation-regularizer coefficient | Not weight decay or Gaussian window width |
| $H$ | Planning horizon | $H$ actions imply $H$ transitions in our rollout convention |
| $\epsilon,\eta$ | Locally defined numerical tolerance/error; learning rate | Reintroduced with units and purpose at each use |

Boldface indicates a vector or structured observation in the main model notation. Coordinate expressions add a feature index. A subscript can index time, an example, or a feature; the surrounding shape declaration identifies which. The original papers sometimes reuse a letter for a different role. Translating that notation is part of reading them carefully.

## LeWorldModel v1 coverage map

| Paper location | What it contains | Teaching location |
|---|---|---|
| Abstract; §1; Figures 1–3 | Motivation, end-to-end objective, method comparisons, planning speed | Philosophy, JEPA, lineage, guided paper chapter |
| §2 | Related world-model and latent-planning methods | Lineage and planning |
| §3.1; Eq. 1; Algorithm 1 | Encoder, action-conditioned predictor, teacher-forced loss | Transformers, implementation, guided paper chapter |
| §3.1; Eqs. 2–3 | SIGReg and combined loss | Full SIGReg chapter; theory; implementation |
| §3.2; Eqs. 4–5; Figure 4 | Latent cost and action-sequence optimization | Planning, CEM reference, guided paper chapter |
| §4; Figures 5–6 | Environments, baselines, control and computational comparisons | Guided paper chapter and evaluation |
| §5.1; Table 1; Figures 7–9 | Probes, decoded rollouts, latent visualization | Geometry, probability, evaluation |
| §5.2; Figure 10 | Violation-of-expectation experiments | Evaluation: surprise and controlled perturbations |
| §6 | Conclusions, limitations, proposed future work | Philosophy, planning, guided paper chapter, capstone |
| Appendix A; Eq. 6; EP and Cramér–Wold statements | Projections and distributional regularization | SIGReg derivations, finite-sample qualifications, code correspondence |
| Appendix B; Algorithm 2 | CEM | Planning: likelihood refit derivation and executable reference |
| Appendix C.1; Eq. 7 | DINO-WM baseline loss | JEPA, lineage, guided paper chapter |
| Appendix C.2; Eq. 8 | PLDM terms across batch and time | JEPA, implementation, baseline note below |
| Appendix C.3–C.4 | IQL, IVL, advantage weighting, cloning | Evaluation: returns, expectiles, weighted regression |
| Appendix D | Architecture, preprocessing, visualization decoder, planning cadence | Transformers and guided paper chapter |
| Appendix E | Datasets and collection policies | Guided paper chapter and data-coverage discussion |
| Appendix F; Tables 3–4; Figures 11–14 | Goal sampling, probes, perturbation details | Evaluation and controlled-test exercises |
| Appendix G; Tables 5–9; Figures 15–16 | Seeds and architectural/regularizer ablations | Probability, guided paper chapter, evaluation |
| Appendix H; Eq. 9; Figure 17 | Temporal straightness | Geometry and evaluation derivation |
| Appendix I; Figures 18–19 | Training curves | Learning, laboratory, guided paper chapter |

The map covers the explanatory dependencies of the full v1 paper and its appendices. It does not claim a rerun of the authors' benchmark experiments or a proof of every empirical assertion in the paper. Empirical assertions require measurements; definitions require motivation; mathematical identities require derivation; approximations require assumptions and error discussion.

## Read the PLDM appendix without an axis mistake

The PLDM objective shown in LeWM Appendix C.2 combines prediction, batch variance, batch covariance, temporal similarity, temporal variance, temporal covariance, and inverse-dynamics terms. The six coefficients set the last six terms relative to prediction. Each is a chosen modeling preference, not a mathematical identity requiring a proof of universal optimality.

The batch variance and covariance formulas follow directly from our geometry chapter, computed at fixed time across trajectories. Temporal versions exchange those axes: hold a trajectory fixed and compute moments across time. Temporal similarity averages squared differences between adjacent embeddings. Inverse dynamics regresses the action from consecutive embeddings using squared error. The same chain-rule and covariance derivations already taught apply to each axis choice.

The v1 appendix prints off-diagonal covariance sums without squares in places. A raw signed sum permits cancellation and is not the usual VICReg squared-covariance penalty. This book presents the standard squared form when teaching VICReg and flags the source discrepancy instead of silently treating the printed formulas as equivalent. The reported baseline's actual configuration and code are needed to establish its exact operational objective.

## A compact glossary with return paths

**Action conditioning.** Supplying proposed or observed actions to a predictor so its output can depend on them. See [transformers](#transformers) and [implementation](#implementation).

**Ablation.** An experiment changing a selected component to examine its contribution under a specified protocol. See [evaluation](#evaluation).

**Autoregressive rollout.** Feeding earlier predictions back as context for later predictions. See [planning](#planning).

**Backpropagation.** The chain rule organized in reverse through a computation graph. See [learning](#learning).

**Batch.** A collection of examples used in one computation. A sequence axis inside each example is a different axis. See [implementation](#implementation).

**Characteristic function.** The expectation of $e^{i\omega X}$, a bounded frequency measurement of a distribution. See [SIGReg](#sigreg).

**Collapse.** Loss of distinctions across inputs; complete collapse makes all embeddings constant. See [JEPA](#jepa).

**Covariance.** An average outer product of centered deviations; its quadratic form gives directional variance. See [geometry](#geometry).

**Distribution shift.** A change between the data distributions relevant to learning and use. See [probability](#probability).

**Embedding.** A coordinate representation produced by a map, often learned and often information-losing. See [geometry](#geometry).

**Energy.** A scalar compatibility score whose scale need not be physical energy or normalized probability. See [philosophy](#philosophy).

**Entropy and KL.** Defined measures of distributional uncertainty/spread and relative discrepancy, with support and integrability conditions. See [SIGReg](#sigreg).

**Expectile.** A minimizer of asymmetric squared error; distinct from a quantile. See [evaluation](#evaluation).

**Fisher information.** Here, the expected squared magnitude of a density's location score. See [theory](#theory).

**Frozen encoder.** An encoder whose parameters remain fixed while another component is trained. See [lineage](#lineage).

**Gaussianity.** A property of a complete distribution, stronger than specified mean and covariance. See [probability](#probability) and [SIGReg](#sigreg).

**Generalization.** Performance on the intended fresh-data distribution, not just agreement on fitted samples. See [probability](#probability).

**Isotropy.** Absence of a preferred direction; distinguish covariance isotropy from full distributional rotational symmetry. See [geometry](#geometry).

**Kernel.** In local regression, a neighborhood weighting function; in other settings the word can denote an inner-product-like similarity. This book states which use applies. See [theory](#theory).

**Layer Normalization.** Per-example normalization across features, usually followed by a learned affine transform. See [transformers](#transformers).

**Latent.** Not directly observed; can refer to an encoded representation or an additional uncertainty variable, which we keep notationally separate. See [philosophy](#philosophy).

**MPC.** Repeated planning, partial execution, observation, and replanning. See [planning](#planning).

**Normality test.** A statistic plus a calibrated null decision procedure; optimizing the statistic alone is not a calibrated test. See [probability](#probability).

**Probe.** A fitted readout used to examine information accessible from a fixed representation. See [theory](#theory) and [evaluation](#evaluation).

**Regularization.** An additional preference or constraint shaping learning among possible fits. See [learning](#learning).

**Score.** In the Fisher argument, $\nabla\log p$, not an attention score or control cost. See [theory](#theory).

**Self-supervision.** Constructing learning targets from the structure of observations rather than supplying external labels for every example. See [philosophy](#philosophy).

**Stop-gradient.** An operation whose forward value is unchanged but whose backward derivative is defined as zero. See [JEPA](#jepa).

**Teacher forcing.** Supplying observed context during prediction training, in contrast to feeding back predicted context. See [planning](#planning).

**Whitening.** A linear transformation making covariance the identity when the required inverse exists; it does not establish Gaussianity. See [geometry](#geometry).

## Primary sources and provenance

The book's main research path uses the following fixed primary sources. The downloaded PDFs, extraction records, and pinned implementation are retained with the editable manuscript.

- Yann LeCun, [A Path Towards Autonomous Machine Intelligence, version 0.9.2, June 27, 2022](https://openreview.net/forum?id=BZ5a1r-kVsf). The 62-page author document was read from an accessible mirrored copy after the official download was unavailable; its provenance and checksum are recorded locally.
- Bardes, Ponce, and LeCun, [VICReg, 2105.04906v1](https://arxiv.org/pdf/2105.04906v1).
- Assran and colleagues, [I-JEPA, 2301.08243v1](https://arxiv.org/pdf/2301.08243v1).
- Bardes and colleagues, [V-JEPA, 2404.08471v1](https://arxiv.org/pdf/2404.08471v1).
- Assran and colleagues, [V-JEPA 2, 2506.09985v1](https://arxiv.org/pdf/2506.09985v1).
- Zhou and colleagues, [DINO-WM, 2411.04983v1](https://arxiv.org/pdf/2411.04983v1).
- Sobal and colleagues, [PLDM, 2502.14819v1](https://arxiv.org/pdf/2502.14819v1).
- Balestriero and LeCun, [LeJEPA, 2511.08544v1](https://arxiv.org/pdf/2511.08544v1).
- Maes and colleagues, [LeWorldModel, 2603.19312v1](https://arxiv.org/pdf/2603.19312v1), and the [pinned author implementation](https://github.com/lucas-maes/le-wm/tree/8edfeb336732b5f3ce7b8b210d0ba370a09e2cac).

The user-supplied [SIGReg tutorial by Reza Bayat](https://rezabyt.github.io/blogposts/sigreg-tutorial.html) informed the desired pedagogical depth. Mathematical derivations and code in this book are developed explicitly and checked against the primary method and implementation. The browser learning system adapts Jaxverse's numerical core; its measurements were rerun in this packaged book rather than borrowed as unverified performance claims.

Generated conceptual illustrations are labeled as illustrations. They are not model predictions or evidence. Precise architecture diagrams are editable SVG with LaTeX labels. The numerical desks compute their displayed quantities; the learning laboratory actually updates neural-network parameters. Printed training curves are explicitly labeled recorded measurements, so they cannot be mistaken for a live run.
