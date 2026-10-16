# What counts as understanding?

<p class="lead">A representation can look orderly, predict well, expose physical variables, and still fail to control. Evaluation should reveal which link works and which one breaks.</p>

<aside class="claims-box">
<strong>Claims hygiene for the rest of the book.</strong>
A probe is not control. Gaussian margins are not a world model. A reported plus-minus interval is not a confidence interval unless the paper defines it. This book has not rerun the 15M-parameter training. Later chapters state what you can reconstruct; they do not relitigate these four points.
</aside>

## Three levels of evidence

<figure class="diagram" data-diagram="evidence"></figure>

A probe asks whether a specified quantity can be recovered from the representation. Prediction tests whether the learned transition model works on held-out examples. Control tests the whole chain, including perception, history, dynamics, goal geometry, search, and execution cadence.

LeWM’s TwoRoom results are a useful warning against collapsing these tests into one score. Its probes can recover position well even when its planning success is below some alternatives. Use that gap as a worksheet: if the probe is good and control is bad, test the dynamics, the latent metric, and the planner as three separate hypotheses.

## Linear and nonlinear probes

Freeze the encoder, construct a labeled probe dataset, and fit a readout $r_\eta(\lat)$ to physical targets $s$. A linear readout has form $W\lat+b$; an MLP can express nonlinear relations. Here the labels train the diagnostic readout while the representation stays frozen.

Mean squared error is $n^{-1}\sum_i(\hat s_i-s_i)^2$, with a chosen additional average over target coordinates if needed. Its scale depends on units: measuring meters instead of centimeters multiplies the numeric squared error by $10^{-4}$. Normalize targets or report units before comparing different physical quantities.

Pearson correlation is the covariance of predictions and targets divided by their standard deviations:

$$r=\frac{\sum_i(\hat s_i-\overline{\hat s})(s_i-\bar s)}{\sqrt{\sum_i(\hat s_i-\overline{\hat s})^2}\sqrt{\sum_i(s_i-\bar s)^2}}.$$

It is the cosine between two centered sample vectors, so Cauchy–Schwarz proves $|r|\leq1$. It is undefined when either vector is constant. Predicting $\hat s=10s+100$ gives correlation 1 for nonconstant $s$, despite potentially enormous MSE. Correlation assesses aligned variation, not calibration of scale and offset.

Train, validation, and test splits apply to the probe too. A highly flexible probe can memorize training labels. Comparing linear and nonlinear probes is informative only with held-out performance and controlled capacity and fitting budget.

The training distribution describes examples the learner sees while fitting parameters. The evaluation distribution describes the cases on which we measure performance. A train–test split estimates transfer to fresh data only to the extent that the split represents the desired use.

Overlapping video windows share observations and hidden episode conditions. Randomly splitting windows may place nearly identical transitions on both sides. Splitting entire episodes reduces this leakage. Test transfer to unfamiliar backgrounds, action ranges, and mechanisms by introducing those distribution shifts explicitly at evaluation.

The data-collecting policy also matters. If it never applies a negative torque at a particular pose, a model can fit the dataset without learning that counterfactual. The logged actions determine which consequences the data can teach; testing a missing action requires new coverage.

Suppose a controller succeeds independently on each task with probability $p$. A success indicator is 1 with probability $p$ and 0 otherwise. Its mean is $p$ and variance is $p(1-p)$. The sample success rate over $n$ tasks therefore has variance $p(1-p)/n$. Replacing $p$ by the observed rate gives a rough standard-error estimate, useful away from the endpoints and for sufficiently large independent samples.

For 48 successes out of 50, the rate is $0.96$ and this estimated standard error is about $0.028$. The standard error describes sampling variability. A normal approximation interval multiplies it by a chosen quantile; near a boundary such as 100% success, that approximation behaves poorly. For small experiments, report the count as well as any interval, and specify how tasks and seeds were sampled.

Variation across training seeds is another level of randomness. Testing three trained models on the same 50 tasks produces correlated evidence, not 150 wholly independent draws of a model–task pair.

<!-- VISUAL: B7 -->

<!-- VISUAL: E1 -->

## The freedom to rename latent coordinates

Suppose an encoder and predictor work well. Apply an orthogonal matrix $Q$ to every embedding and conjugate the predictor accordingly: $f'(o)=Qf(o)$ and $g'(z,a)=Qg(Q^\top z,a)$. The new prediction error equals the old one because $\|Qv\|^2=v^\top Q^\top Qv=\|v\|^2$. An isotropic Gaussian also remains isotropic after this rotation, because its density depends only on length and an orthogonal change preserves volume.

For SIGReg, this rotational symmetry is exact at the population level and in expectation over freshly sampled isotropic directions. A finite fixed set of directions need not give exactly the same score after a rotation: either rotate those directions too, or average over their sampling distribution. Under that distinction, the objective cannot uniquely name coordinate one “angle” and coordinate two “velocity.” Equally good rotated descriptions exist. A probe may recover an angle from a combination of coordinates. This non-uniqueness is not itself a flaw: maps can use different coordinate systems. It does warn us against interpreting a single coordinate or a pretty scatterplot too literally.

General invertible transformations preserve distinguishability but need not preserve Euclidean distances or the prediction objective. Scaling by a small constant shrinks squared errors by its square. That is why comparing raw prediction losses across independently learned representations can be misleading.

<!-- VISUAL: E2 -->

## Angles require circular error

The angles $\pi-\epsilon$ and $-\pi+\epsilon$ are close physical directions but numerically differ by almost $2\pi$. Wrap an angular difference into $[-\pi,\pi)$ before measuring it. One definition is $\operatorname{wrap}(x)=((x+\pi)\bmod2\pi)-\pi$. The modulo operation removes complete revolutions.

For two joints, a circular RMS error is $\sqrt{(\operatorname{wrap}(q_1-\hat q_1)^2+\operatorname{wrap}(q_2-\hat q_2)^2)/2}$. The browser’s goal tolerance is expressed in this physical metric, not in latent units. It is computed after execution for evaluation and does not score candidate plans.

For rotations in three dimensions, a quaternion and its negative describe the same orientation, so ordinary coordinate MSE can also be misleading. A quaternion is a four-component rotation representation; the book does not require quaternion algebra to interpret the table. It does require recognizing that representation-specific symmetries can affect a reported error. LeWM’s rotational probe difficulties should be read with the target representation and metric visible.

<!-- VISUAL: E3 -->

## A decoder is a diagnostic instrument

A decoder trained after representation learning maps embeddings back to images. It can reveal which visual information is recoverable by that decoder. It can also blur uncertainty, impose its own prior, or fail even when another readout could recover information.

LeWM trains its visualization decoder using image reconstruction after learning the predictive representation. Its architectural details belong to the later transformer and paper chapters. Here the important information boundary is that this reconstruction signal is not fed back into the main world-model training in the default experiment.

Therefore a decoded imagined frame reflects both predictor error and decoder error. The browser’s translucent imagined arm uses an analogous separate labeled readout, not a full image decoder. It is a visualization aid; the planner scores latent representations directly.

## Why Figure 9 is not a map of physical distance

t-SNE assigns each high-dimensional point a two-dimensional coordinate so that selected local-neighborhood probabilities stay compatible. The display is optimized using $\operatorname{KL}(P\|Q)$, whose nonnegativity was proved in the SIGReg chapter. That objective asks nearby pairs to remain nearby in the picture. It does not ask all physical distances to remain unchanged.

Global separations, cluster sizes, rotations, and empty spaces in the display can be misleading. Figure 9’s organized embedding visualization suggests a qualitative correspondence with varied physical states. Assess topology, recoverable coordinates, and controllability with dedicated probes and prediction or control tests. The figure cannot show that Euclidean latent distance is a useful planning metric.

<!-- VISUAL: E4 -->

## Compatibility, energy, and multiple futures

An **energy** in this setting is a scalar compatibility score. Lower energy means a pair of observations or representations fits the model’s learned constraints better. It need not be physical energy measured in joules. A simple predictive energy is

$$E(\obs_t,\obs_{t+1},\act_t)=\|g_\psi(f_\theta(\obs_t),\act_t)-f_\theta(\obs_{t+1})\|^2.$$

This definition becomes useful when training makes compatible examples score lower. Observed examples and constraints against trivial solutions supply that meaning; unobserved combinations still require evaluation.

Now imagine a car approaching a fork. Its future may branch left or right. Discarding tree texture does not remove the ambiguity about the branch. LeCun’s general JEPA allows an additional latent variable for information not predictable from the context. We call it $\xi$ to avoid confusing it with our embedding $\lat$:

$$E(\obs,\obs',\act,\xi)=\|g_\psi(f_\theta(\obs),\act,\xi)-f_\theta(\obs')\|^2.$$

Varying $\xi$ can describe a set of compatible futures. Minimizing over $\xi$ asks whether at least one allowed latent choice explains a target. But an unrestricted $\xi$ could simply carry the entire answer. Its capacity or distribution must be constrained. This is a different collapse problem from an encoder mapping every observation to one vector.

LeWorldModel uses a deterministic predictor. Its control results therefore evaluate that narrower system; the full latent-variable proposal would also need to represent multiple compatible futures.

<figure class="generated-plate" data-art="E5"><img src="assets/generated/infographics/energy-1.png" alt="Alternative paths around an obstacle accompany a two-valley illustrative compatibility landscape."/><figcaption>The two valleys assign lower model energy to two compatible alternatives. This is a constructed compatibility score, not physical energy or an observed probability distribution. The numerical example shows the extra normalization needed for a density.</figcaption></figure>

<!-- VISUAL: E5 -->

## Energy becomes a probability only after normalization

A probability model assigns nonnegative mass or density with total one. An arbitrary energy need not do this. One possible conversion is the Gibbs construction

$$p(y\mid x)=\frac{e^{-E(x,y)/\tau}}{\int e^{-E(x,u)/\tau}\,du},\qquad \tau>0.$$

This is a definition, valid when the denominator is finite and positive. Exponentiation makes the numerator positive. Dividing by the integral makes the integral of the resulting density equal one. The scale $\tau$ controls how sharply lower energies are favored. Adding any function of $x$ to every energy cancels between numerator and denominator, so the conditional probability is unchanged.

Computing the denominator can be hard because it sums over many possible outputs. A compatibility model can be useful for optimization without performing this normalization. Conversely, bypassing normalization means a raw error is not automatically a calibrated probability or a negative log probability. We will return to this distinction when the paper calls prediction error “surprise.”

## Surprise is an error before it is a probability

The paper’s violation-of-expectation experiments use next-embedding prediction error as a surprise signal. A spike means the observed target differs from the model’s prediction in its learned coordinates. That can result from a physical discontinuity, a visual shift, an action mismatch, an unfamiliar state, or ordinary model error.

There is a special case connecting squared error to likelihood. If one explicitly models residuals as independent Gaussian noise with fixed variance $\sigma^2$, the conditional density is proportional to $\exp(-\|z-\hat z\|^2/(2\sigma^2))$. Taking negative logarithms gives squared error divided by $2\sigma^2$ plus a normalization constant. Without that calibrated noise model, raw squared error is not automatically a negative log likelihood.

LeWM compares unperturbed trajectories, object color changes, and teleportation-like changes to physical state. These interventions ask whether its representation and predictor respond differently to visual appearance and physical continuity. Teleportation is also a large out-of-distribution visual change. Distinguishing those explanations robustly would require further controls: matched pixel-change magnitude, realistic rare motions, occlusions, camera shifts, and held-out perturbation types.

<!-- VISUAL: E6 -->

## Temporal straightness: derive Equation 9

For latent sequence $z_1,\ldots,z_T$, define displacement $v_t=z_{t+1}-z_t$. For nonzero consecutive displacements, their cosine is $v_t^\top v_{t+1}/(\|v_t\|\|v_{t+1}\|)$. Average this over the $T-2$ consecutive displacement pairs and $B$ sequences to obtain the paper’s straightness statistic.

The bound $[-1,1]$ follows from Cauchy–Schwarz. A straight constant-speed path has cosine 1. A right-angle turn gives 0. A reversal gives −1. A stationary path has zero denominators and no defined direction; an implementation must exclude, flag, or explicitly regularize such cases. Assigning stationary paths a perfect score would reward collapse.

The statistic is unchanged by translation and orthogonal rotation, because displacements remove translations and dot products preserve rotations. Uniform nonzero scaling also cancels. Anisotropic scaling can change angles, so different latent coordinate geometries can change straightness without changing the physical trajectory. Measure prediction error alongside straightness: a smooth trajectory can still lead to the wrong state.

<!-- VISUAL: E7 -->

The [paper chapter](#paper) reads Appendix C’s policy baselines—behavioral cloning, Bellman targets, expectiles, and advantage-weighted imitation—beside the tables that use them.

## How to read the ablation tables

An ablation is most informative when everything except the intended factor is held fixed and multiple seeds are used. A decoder-loss ablation changes both the objective and possibly the optimization burden. A larger predictor changes capacity, computation, and optimization difficulty. Reported outcomes identify useful settings within the experiment, not immutable properties of architecture names.

A plus-minus value should be interpreted according to its stated definition. LeWM v1’s training-variance table describes variation across three training seeds and a common set of 50 evaluation trajectories, with terminology that does not cleanly specify every statistical convention. Do not manufacture a confidence interval from that typography. Preserve the reported values and explain the limited sampling basis.

Likewise, the browser’s nine local control trials are a reproducible diagnostic suite, not a broad generalization estimate. Its three distant-goal failures are part of the evidence. Excluding them after seeing the results would change the question being evaluated.

## Worked exercise: design a stronger physical test

A model reacts strongly to teleportation and weakly to a color change. Propose a follow-up that distinguishes physical continuity sensitivity from generic large visual-change sensitivity.

<details class="derivation"><summary>A controlled extension</summary>

Construct several perturbation families with matched approximate visual-change magnitudes: a physically plausible rapid movement, a camera translation, an occlusion, an appearance change, and an impossible position jump. Hold the preceding history and action protocol fixed where feasible. Use fresh trajectories and declare the time window and statistic before inspecting results.

Measure within-model error changes relative to each trajectory’s unperturbed counterpart, rather than comparing raw errors across unrelated latent scales. Report false alarms on plausible unusual events as well as detection of impossible ones. Check whether the perturbation detector transfers to changes not used to design the test.

A successful result would support a more specific conclusion about the tested distinction. It would still not certify general physical understanding. That is how a research claim becomes stronger: by making its alternatives harder to explain away, one controlled test at a time.

</details>

You can now read LeWM §5 with a rubric: a probe, a prediction score, and a control score answer different questions. The next chapter asks a narrower theoretical question: what Gaussian geometry can promise a later probe.
