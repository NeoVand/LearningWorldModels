# What counts as understanding?

<p class="lead">A representation can look orderly, predict well, expose physical variables, and still fail to control. Evaluation should reveal which link works and which one breaks.</p>

## Three levels of evidence

<figure class="diagram" data-diagram="evidence"></figure>

A probe asks whether a specified quantity can be recovered from the representation. Prediction tests whether the learned transition model works on held-out examples. Control tests the whole chain, including perception, history, dynamics, goal geometry, search, and execution cadence.

LeWM's TwoRoom results are a useful warning against collapsing these tests into one score. Its probes can recover position well even when its planning success is below some alternatives. That gap could arise from the learned dynamics, the latent metric, or the planner. Good information access narrows the diagnosis but does not finish it.

## Linear and nonlinear probes

Freeze the encoder, construct a labeled probe dataset, and fit a readout $r_\eta(\lat)$ to physical targets $s$. A linear readout has form $W\lat+b$; an MLP can express nonlinear relations. Labels used here belong to evaluation or diagnostic visualization, not automatically to the original representation-training objective.

Mean squared error is $n^{-1}\sum_i(\hat s_i-s_i)^2$, with a chosen additional average over target coordinates if needed. Its scale depends on units: measuring meters instead of centimeters multiplies the numeric squared error by $10^{-4}$. Normalize targets or report units before comparing different physical quantities.

Pearson correlation is the covariance of predictions and targets divided by their standard deviations:

$$r=\frac{\sum_i(\hat s_i-\overline{\hat s})(s_i-\bar s)}{\sqrt{\sum_i(\hat s_i-\overline{\hat s})^2}\sqrt{\sum_i(s_i-\bar s)^2}}.$$

It is the cosine between two centered sample vectors, so Cauchy–Schwarz proves $|r|\leq1$. It is undefined when either vector is constant. Predicting $\hat s=10s+100$ gives correlation 1 for nonconstant $s$, despite potentially enormous MSE. Correlation assesses aligned variation, not calibration of scale and offset.

Train, validation, and test splits apply to the probe too. A highly flexible probe can memorize training labels. Comparing linear and nonlinear probes is informative only with held-out performance and controlled capacity and fitting budget.

## The freedom to rename latent coordinates

Suppose an encoder and predictor work well. Apply an orthogonal matrix $Q$ to every embedding and conjugate the predictor accordingly: $f'(o)=Qf(o)$ and $g'(z,a)=Qg(Q^\top z,a)$. The new prediction error equals the old one because $\|Qv\|^2=v^\top Q^\top Qv=\|v\|^2$. An isotropic Gaussian also remains isotropic after this rotation, because its density depends only on length and an orthogonal change preserves volume.

Therefore the objective cannot uniquely name coordinate one “angle” and coordinate two “velocity.” Equally good rotated descriptions exist. A probe may recover an angle from a combination of coordinates. This non-uniqueness is not itself a flaw: maps can use different coordinate systems. It does warn us against interpreting a single coordinate or a pretty scatterplot too literally.

General invertible transformations preserve distinguishability but need not preserve Euclidean distances or the prediction objective. Scaling by a small constant shrinks squared errors by its square. That is why comparing raw prediction losses across independently learned representations can be misleading.

## Angles require circular error

The angles $\pi-\epsilon$ and $-\pi+\epsilon$ are close physical directions but numerically differ by almost $2\pi$. Wrap an angular difference into $[-\pi,\pi)$ before measuring it. One definition is $\operatorname{wrap}(x)=((x+\pi)\bmod2\pi)-\pi$. The modulo operation removes complete revolutions.

For two joints, a circular RMS error is $\sqrt{(\operatorname{wrap}(q_1-\hat q_1)^2+\operatorname{wrap}(q_2-\hat q_2)^2)/2}$. The browser's goal tolerance is expressed in this physical metric, not in latent units. It is computed after execution for evaluation and does not score candidate plans.

For rotations in three dimensions, a quaternion and its negative describe the same orientation, so ordinary coordinate MSE can also be misleading. A quaternion is a four-component rotation representation; the book does not require quaternion algebra to interpret the table. It does require recognizing that representation-specific symmetries can affect a reported error. LeWM's rotational probe difficulties should be read with the target representation and metric visible.

## A decoder is a diagnostic instrument

A decoder trained after representation learning maps embeddings back to images. It can reveal which visual information is recoverable by that decoder. It can also blur uncertainty, impose its own prior, or fail even when another readout could recover information.

LeWM trains its visualization decoder using image reconstruction after learning the predictive representation. Its architectural details belong to the later transformer and paper chapters. Here the important information boundary is that this reconstruction signal is not fed back into the main world-model training in the default experiment.

Therefore a decoded imagined frame reflects both predictor error and decoder error. The browser's translucent imagined arm uses an analogous separate labeled readout, not a full image decoder. It is a visualization aid; the planner scores latent representations directly.

## Why t-SNE is not a map of physical distance

A high-dimensional cloud can be visualized by assigning each point a two-dimensional coordinate. t-SNE chooses those coordinates to approximately preserve selected local-neighborhood probabilities. In the original space, neighbors receive Gaussian-distance weights with a bandwidth adjusted to a chosen neighborhood scale. Symmetrizing and normalizing gives pair probabilities $p_{ij}$. In the display, a heavy-tailed kernel gives $q_{ij}\propto(1+\|y_i-y_j\|^2)^{-1}$, normalized over distinct pairs.

The display is optimized using $\operatorname{KL}(P\|Q)=\sum_{i\ne j}p_{ij}\log(p_{ij}/q_{ij})$. KL nonnegativity was proved in the SIGReg chapter. This objective asks nearby pairs to remain compatible with the display, not all physical distances to remain unchanged. Neighborhood bandwidth is often set through **perplexity**, defined as the exponential of a neighbor distribution's entropy using matching logarithm bases. A uniform distribution over $k$ neighbors has entropy $\log k$, hence perplexity $k$.

Global separations, cluster sizes, rotations, and empty spaces in the display can be misleading. Figure 9's organized embedding visualization supports a qualitative correspondence with varied physical states. It does not establish global topology, controllability, or exact physical coordinates. Inspect probes and prediction/control tests alongside it.

## Compatibility, energy, and multiple futures

An **energy** in this setting is a scalar compatibility score. Lower energy means a pair of observations or representations fits the model's learned constraints better. It need not be physical energy measured in joules. A simple predictive energy is

$$E(\obs_t,\obs_{t+1},\act_t)=\|g_\psi(f_\theta(\obs_t),\act_t)-f_\theta(\obs_{t+1})\|^2.$$

The right side defines a model. It does not prove that low energy implies physical possibility. Training supplies that meaning imperfectly through observed examples and constraints against trivial solutions.

Now imagine a car approaching a fork. Its future may branch left or right. Discarding tree texture does not remove the ambiguity about the branch. LeCun's general JEPA allows an additional latent variable for information not predictable from the context. We call it $\xi$ to avoid confusing it with our embedding $\lat$:

$$E(\obs,\obs',\act,\xi)=\|g_\psi(f_\theta(\obs),\act,\xi)-f_\theta(\obs')\|^2.$$

Varying $\xi$ can describe a set of compatible futures. Minimizing over $\xi$ asks whether at least one allowed latent choice explains a target. But an unrestricted $\xi$ could simply carry the entire answer. Its capacity or distribution must be constrained. This is a different collapse problem from an encoder mapping every observation to one vector.

The target LeWorldModel uses a deterministic predictor. It does not instantiate the full latent-variable proposal. The distinction matters when reading its control successes: they do not establish that it has solved multimodal uncertainty.

## Energy is not automatically probability

A probability model assigns nonnegative mass or density with total one. An arbitrary energy need not do this. One possible conversion is the Gibbs construction

$$p(y\mid x)=\frac{e^{-E(x,y)/\tau}}{\int e^{-E(x,u)/\tau}\,du},\qquad \tau>0.$$

This is a definition, valid when the denominator is finite and positive. Exponentiation makes the numerator positive. Dividing by the integral makes the integral of the resulting density equal one. The scale $\tau$ controls how sharply lower energies are favored. Adding any function of $x$ to every energy cancels between numerator and denominator, so the conditional probability is unchanged.

Computing the denominator can be hard because it sums over many possible outputs. A compatibility model can be useful for optimization without performing this normalization. Conversely, bypassing normalization means a raw error is not automatically a calibrated probability or a negative log probability. We will return to this distinction when the paper calls prediction error “surprise.”

## Surprise is an error before it is a probability

The paper's violation-of-expectation experiments use next-embedding prediction error as a surprise signal. A spike means the observed target differs from the model's prediction in its learned coordinates. That can result from a physical discontinuity, a visual shift, an action mismatch, an unfamiliar state, or ordinary model error.

There is a special case connecting squared error to likelihood. If one explicitly models residuals as independent Gaussian noise with fixed variance $\sigma^2$, the conditional density is proportional to $\exp(-\|z-\hat z\|^2/(2\sigma^2))$. Taking negative logarithms gives squared error divided by $2\sigma^2$ plus a normalization constant. Without that calibrated noise model, raw squared error is not automatically a negative log likelihood.

LeWM compares unperturbed trajectories, object color changes, and teleportation-like changes to physical state. These interventions ask whether its representation and predictor respond differently to visual appearance and physical continuity. Teleportation is also a large out-of-distribution visual change. Distinguishing those explanations robustly would require further controls: matched pixel-change magnitude, realistic rare motions, occlusions, camera shifts, and held-out perturbation types.

## Temporal straightness: derive Equation 9

For latent sequence $z_1,\ldots,z_T$, define displacement $v_t=z_{t+1}-z_t$. For nonzero consecutive displacements, their cosine is $v_t^\top v_{t+1}/(\|v_t\|\|v_{t+1}\|)$. Average this over the $T-2$ consecutive displacement pairs and $B$ sequences to obtain the paper's straightness statistic.

The bound $[-1,1]$ follows from Cauchy–Schwarz. A straight constant-speed path has cosine 1. A right-angle turn gives 0. A reversal gives −1. A stationary path has zero denominators and no defined direction; an implementation must exclude, flag, or explicitly regularize such cases. Assigning stationary paths a perfect score would reward collapse.

The statistic is unchanged by translation and orthogonal rotation, because displacements remove translations and dot products preserve rotations. Uniform nonzero scaling also cancels. Anisotropic scaling can change angles, so different latent coordinate geometries can change straightness without changing the physical trajectory. High straightness is not automatically high prediction accuracy.

## Baselines in Appendix C: what policies learn instead

LeWM compares world-model planning with goal-conditioned behavioral cloning and offline reinforcement-learning baselines. A **policy** $\pi(s,g)$ maps a state description and goal to an action. It can act without searching through a world model at every step.

Behavioral cloning minimizes $\mathbb E\|\pi(s,g)-a\|^2$ on observed state–action–goal tuples. By the conditional-mean derivation, a sufficiently expressive squared-error policy learns an average action for the supplied context. If two valid routes require opposing actions, averaging can be poor. Data coverage and how goals are assigned therefore matter.

A goal-conditioned policy still needs goals during training and evaluation. The representation supplied to the baseline can differ from LeWM's learned representation; the paper uses DINOv2 features for these policy baselines. This changes both the prior information and computational profile, so the baseline is a complete system comparison rather than a pure loss swap.

## Returns and the Bellman recursion

Let reward $r_t$ express task progress and $\gamma\in[0,1)$ discount later rewards. Define the discounted return $G_t=\sum_{k=0}^\infty\gamma^k r_{t+k}$, assuming bounded rewards so the sum converges. Pulling out the first term gives $G_t=r_t+\gamma G_{t+1}$. This algebraic identity is the source of a Bellman recursion.

A value function $V(s,g)$ estimates expected return from a state and goal under a specified behavior or optimization procedure. An action value $Q(s,a,g)$ additionally conditions on the first action. A temporal-difference target uses an observed reward plus an estimated future value. It is called **bootstrapping** because an estimate helps define the next training target.

The paper's IQL baseline trains a Q-function by squared regression toward $r+\gamma m_t\bar V(s',g)$, where $m_t$ masks a terminal transition and the bar denotes a target network. This is a chosen offline-learning algorithm. The Bellman identity motivates the target, while approximation, off-policy data, and target-network updates determine the learning behavior.

## Expectiles emphasize one side of an error

Appendix C uses the asymmetric squared loss

$$\ell_\tau(u)=|\tau-\mathbf1\{u<0\}|u^2,\qquad0<\tau<1.$$

For positive residuals the weight is $\tau$; for negative residuals it is $1-\tau$. An expectile minimizes the expected loss of a residual such as $u=Y-v$. Away from zero, differentiating with respect to $v$ yields the balance equation

$$\tau\,\mathbb E[(Y-v)\mathbf1\{Y\geq v\}]=(1-\tau)\mathbb E[(v-Y)\mathbf1\{Y<v\}].$$

At $\tau=1/2$, the two sides balance ordinary positive and negative deviations, giving the mean. With larger $\tau$, underestimating high targets costs more and the solution shifts upward. For equally likely targets 0 and 1, a solution between them satisfies $\tau(1-v)=(1-\tau)v$, hence $v=\tau$. An expectile is not a quantile: it balances weighted magnitudes, not just counts.

GCIQL fits $V$ toward target Q-values with this loss and fits Q with a Bellman squared-error target. GCIVL removes the explicit Q-function and uses an expectile loss directly on $r+\gamma\bar V(s',g)-V(s,g)$. These differences explain the equations in Appendix C without assuming prior reinforcement-learning coursework.

## Advantage-weighted imitation

Define a one-step advantage estimate $A=r+\gamma V(s',g)-V(s,g)$. Positive advantage means the transition looks better than the current state's value prediction. The baseline policy objective weights imitation errors by $e^{\beta A}$:

$$L_\pi=\mathbb E\left[e^{\beta A(s,a,g)}\|\pi(s,g)-a\|^2\right].$$

This is a chosen weighted-regression objective. Better-looking dataset actions receive more influence without requiring the policy update to query arbitrary new actions in an inaccurate offline value model. A large inverse temperature $\beta$ concentrates the weights strongly and can make fitting sensitive to estimation errors. Practical algorithms often stabilize weights; exact choices belong to the implementation.

To see what weighted regression learns, fix a context and differentiate with respect to a constant predicted action $c$: $2\mathbb E[w(c-A_{\mathrm{data}})]=0$. If $\mathbb E[w]>0$, the optimum is $c=\mathbb E[wA_{\mathrm{data}}]/\mathbb E[w]$. The weights change the conditional average, not the fact that a deterministic squared-error policy averages.

These policy baselines differ from CEM planning. CEM spends computation online to optimize a fresh sequence using a fixed model; the policy spends training computation to make action selection cheap at execution time. The 2022 LeCun proposal explicitly contemplates learning reactive policies from deliberative solutions, so the approaches are not philosophically incompatible.

## How to read the ablation tables

An ablation is most informative when everything except the intended factor is held fixed and multiple seeds are used. A decoder-loss ablation changes both the objective and possibly the optimization burden. A larger predictor changes capacity, computation, and optimization difficulty. Reported outcomes identify useful settings within the experiment, not immutable properties of architecture names.

A plus-minus value should be interpreted according to its stated definition. LeWM v1's training-variance table describes variation across three training seeds and a common set of 50 evaluation trajectories, with terminology that does not cleanly specify every statistical convention. Do not manufacture a confidence interval from that typography. Preserve the reported values and explain the limited sampling basis.

Likewise, the browser's nine local control trials are a reproducible diagnostic suite, not a broad generalization estimate. Its three distant-goal failures are part of the evidence. Excluding them after seeing the results would change the question being evaluated.

## Worked exercise: design a stronger physical test

A model reacts strongly to teleportation and weakly to a color change. Propose a follow-up that distinguishes physical continuity sensitivity from generic large visual-change sensitivity.

<details class="derivation"><summary>A controlled extension</summary>

Construct several perturbation families with matched approximate visual-change magnitudes: a physically plausible rapid movement, a camera translation, an occlusion, an appearance change, and an impossible position jump. Hold the preceding history and action protocol fixed where feasible. Use fresh trajectories and declare the time window and statistic before inspecting results.

Measure within-model error changes relative to each trajectory's unperturbed counterpart, rather than comparing raw errors across unrelated latent scales. Report false alarms on plausible unusual events as well as detection of impossible ones. Check whether the perturbation detector transfers to changes not used to design the test.

A successful result would support a more specific conclusion about the tested distinction. It would still not certify general physical understanding. That is how a research claim becomes stronger: by making its alternatives harder to explain away, one controlled test at a time.

</details>

You now have the tools to read every family of evaluation in the final paper. We can now separate useful prediction, recoverable physical information, and successful action. With that practical grounding, the next chapter asks a harder theoretical question: why might Gaussian geometry help a later learner?
