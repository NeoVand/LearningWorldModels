# Agreement without collapse

<p class="lead">Two networks can agree because they understand the same thing, or because neither says anything. A joint-embedding objective must distinguish those possibilities.</p>

We will use one notation throughout. An observation is $\obs_t$, its encoded description is $\lat_t=f_\theta(\obs_t)$, an action is $\act_t$, and a predicted description carries a hat, $\pred_{t+1}$. The encoder weights are $\theta$; the predictor $g_\psi$ has its own weights $\psi$. A subscript $t$ labels time; it does not mean multiplication. The hat distinguishes prediction from the description of an actually observed future.

<div class="legend"><span class="obs">observation</span><span class="lat">representation</span><span class="pred">prediction</span><span class="act">action</span><span class="loss">loss or cost</span></div>

## Three targets, three learning problems

A classifier predicts a supplied label. A generative predictor predicts an observation, perhaps through a probability distribution. A joint-embedding predictor predicts the representation of a related observation. These are choices about what information the loss evaluates.

<figure class="diagram" data-diagram="objectives"></figure>

Consider a moving white dot on a flickering textured background. Predicting every pixel rewards knowledge of both motion and background. Predicting a representation may allow the encoder to discard the flicker while retaining the dot. But without an additional constraint, it can discard the dot as well. The relevant distinction is not “pixels are bad, embeddings are good.” It is which errors and shortcuts the objective makes attractive.

Reconstruction can be valuable when detailed rendering or broad information preservation matters. It can also consume capacity on unpredictable detail. The right comparison controls architecture, data, compute, and evaluation rather than treating a philosophical preference as an empirical result.

<figure class="diagram" data-diagram="jepa"></figure>

<figure class="generated-plate" data-art="J1"><img src="assets/generated/infographics/jepa-3.png" alt="A common context branches into pixel reconstruction and a coordinate representation target."/><figcaption>A pixel prediction is compared with an observed image; a representation prediction is compared with an encoded target. The coordinates are learned features, not named physical quantities. The next diagrams specify parameter sharing and gradient flow.</figcaption></figure>

<!-- VISUAL: J1 -->

## Both sides can move

For a shared encoder used on both context and target observations, two paths lead back to the same parameters. Their contributions add. With scalar residual $e=g_\psi(f_\theta(o))-f_\theta(o')$, differentiating $e^2$ gives

$$\nabla_\theta e^2=2e\left[\frac{\partial g_\psi}{\partial z}\nabla_\theta f_\theta(o)-\nabla_\theta f_\theta(o')\right].$$

This formula is a scalar illustration; the vector form replaces products by Jacobian-transpose products. It shows why a learnable target can move toward the prediction as the prediction moves toward the target. The stop-gradient operation introduced later deliberately removes the second contribution. LeWM does not remove it.

<!-- VISUAL: J2 -->

## Construct the collapse solution

Let $f_\theta(o)=c$ for every observation and $g_\psi(c,a)=c$ for every action. Then every prediction equals its target, so the squared prediction loss is zero. The construction is valid for any fixed vector $c$ the architecture can produce. More training examples do not remove this solution; they produce more copies of the same zero error.

<figure class="diagram" data-diagram="collapse"></figure>

Complete collapse makes every observation identical in latent space. Dimensional collapse leaves variation in too few directions. A third failure is a noncollapsed but irrelevant representation: for example, encoding camera noise rather than arm state. Anti-collapse geometry addresses the first two directly. The prediction task and data must supply the pressure toward useful content.

A penalty on weights does not automatically fix this. A zero encoder can have small or zero weights, so such a penalty may favor the trivial solution. We need to constrain what the collection of outputs retains.

**Pause and calculate.** For scalar images $o=1,o'=2$, use encoder $f_\theta(o)=\theta o$ and predictor $g(z)=z$. The prediction loss is $(\theta-2\theta)^2=\theta^2$. At $\theta=1$, its derivative is 2; a descent step shrinks the representation. At $\theta=0$, the loss is perfect and all information is gone. This is not overfitting one target: the learner has changed the target to make its own task empty.

<!-- VISUAL: J3 -->

## Contrastive learning: agreement plus alternatives

A contrastive objective makes a positive pair more compatible than selected negative pairs. Suppose an anchor has scores $s_+$ for its related view and $s_1,\ldots,s_K$ for other examples. Define probabilities with the softmax and choose the negative log probability of the positive:

$$\ell_{\mathrm{con}}=-\log\frac{e^{s_+/\tau}}{e^{s_+/\tau}+\sum_{k=1}^Ke^{s_k/\tau}},\qquad\tau>0.$$

This is a modeling choice: we turn pair identification into a classification problem. The exponential makes scores positive and the denominator normalizes them. Writing $\ell=-s_+/\tau+\log\sum_j e^{s_j/\tau}$, differentiation gives

$$\frac{\partial\ell}{\partial s_j}=\frac{p_j-\mathbf1\{j=+\}}{\tau}.$$

Thus descent increases the positive score and reduces negative scores according to their current probabilities. With all scores equal, the loss is $\log(K+1)$, whereas distinguishing positives can lower it. This makes identical embeddings unattractive at the level of the objective, although parameter symmetries can still create stationary configurations.

Negatives bring choices: which samples count as distinct, how many to use, and how to handle different observations of the same underlying object. A “negative” that is semantically related to the anchor can create an unwanted pressure. Contrastive learning is not inherently wrong; it imposes a different set of constraints and computational demands.

## Teacher branches: change the update rule

Another family uses an online encoder and a target encoder. The target parameters move slowly toward the online parameters using an exponential moving average:

$$\bar\theta_{k+1}=m\bar\theta_k+(1-m)\theta_k,\qquad0\leq m<1.$$

Here $k$ counts optimization steps, not environment time. This is the same weighted-history recurrence encountered in momentum. A large $m$ makes the target change slowly. The target representation is detached from differentiation by a **stop-gradient** operation, whose forward value is unchanged but whose backward derivative is defined to be zero.

<figure class="diagram" data-diagram="teacher"></figure>

These operations change the coupled learning dynamics. One should not silently describe them as ordinary gradient descent on the symmetric prediction loss. They can work very well empirically in combination with architecture, masking, normalization, and optimization choices. Neither a slowly moving target nor stop-gradient alone proves that every collapsed solution disappears.

A frozen pretrained encoder is different again. Its representation remains fixed throughout predictor training. If that representation already distinguishes useful states, the predictor cannot collapse it by changing its weights. The tradeoff is that information discarded during pretraining may be unavailable to the world model.

## VICReg: three constraints with distinct jobs

VICReg, introduced in [Bardes, Ponce, and LeCun, 2021](https://arxiv.org/pdf/2105.04906v1), gives a useful noncontrastive construction. Two related views produce batches $Z,Z'\in\mathbb R^{B\times d}$. An invariance term encourages their paired representations to agree. A variance term discourages individual coordinates from becoming constant. A covariance term discourages redundant linear relationships among coordinates.

One common convention defines the invariance term as $B^{-1}\sum_i\|z_i-z_i'\|^2$. For one branch, define $\sigma_j=\sqrt{\operatorname{Var}(Z_{:j})+\epsilon}$ and a variance penalty

$$L_{\mathrm{var}}(Z)=\frac1d\sum_{j=1}^d\max(0,\gamma-\sigma_j).$$

The threshold $\gamma>0$ is a chosen desired lower spread. A coordinate already above it pays zero. A collapsed coordinate pays nearly $\gamma$ when $\epsilon$ is small. The square root makes the threshold a standard-deviation threshold, not a variance threshold.

With centered covariance $C=(B-1)^{-1}Z_c^\top Z_c$, define

$$L_{\mathrm{cov}}(Z)=\frac1d\sum_{j\ne k}C_{jk}^2.$$

The off-diagonal square is essential. Without it, positive and negative covariances could cancel, and a negative covariance could lower the objective simply by becoming more negative. Squaring makes every undesired cross-covariance contribute nonnegatively.

<figure class="diagram" data-diagram="vicreg"></figure>

The full objective weights invariance and the two branches' variance and covariance terms. Different papers use different averaging conventions, so coefficient values are meaningful only with their reductions. A unit variance floor plus zero cross-covariances does not prescribe higher moments or guarantee an isotropic Gaussian distribution. Our whitened-circle example satisfies the moment constraints but remains concentrated on a ring.

<!-- VISUAL: J4 -->

## Why the variance penalty has a gradient caveat

For one coordinate with descriptive variance $v=B^{-1}\sum_i(x_i-\bar x)^2$, differentiation gives $\partial v/\partial x_i=2(x_i-\bar x)/B$. To obtain this, expand $v=B^{-1}\sum_i x_i^2-\bar x^2$ and use $\partial\bar x/\partial x_i=1/B$.

When the hinge is active, the derivative of $\gamma-\sqrt{v+\epsilon}$ is

$$-\frac{x_i-\bar x}{B\sqrt{v+\epsilon}}.$$

It pushes above-mean examples upward and below-mean examples downward under gradient descent. At exact equality of all examples, however, every numerator is zero. A nonzero penalty value does not guarantee a nonzero escape gradient at a perfectly symmetric collapsed point. Random initialization and perturbations matter. The same subtlety will reappear in SIGReg, so “provable anti-collapse” must be read with attention to the exact theorem and its assumptions.

## Temporal prediction adds an alignment problem

In image-view learning, related views may be treated as descriptions of the same scene. In a world model, successive frames differ because the world changes. Directly forcing $z_t=z_{t+1}$ would erase that change. A predictor transforms the current representation using action and history, then compares its output with the next representation.

For a batch of windows with $N$ context transitions, an explicit coordinate-averaged prediction loss is

$$L_{\mathrm{pred}}=\frac1{BNd}\sum_{b=1}^B\sum_{t=1}^N\sum_{j=1}^d\big(\hat z_{b,t+1,j}-z_{b,t+1,j}\big)^2.$$

The action $a_t$ must be the one associated with the transition from observation $t$ to observation $t+1$. An indexing error can train a visually plausible model that responds to the wrong action. When several physical actions lie between selected frames, the conditioning input may be an action block rather than one motor command.

Teacher forcing means using encoded observed context during training. Free rollout uses previous predictions as new context. Those inputs can differ substantially; the planning chapter will quantify the resulting error accumulation.

<!-- VISUAL: J5 -->

## From covariance control to distribution matching

SIGReg goes beyond a finite list of moments. It projects the batch along random directions, measures how each one-dimensional distribution differs from a standard Gaussian, and averages those discrepancies. The theory concerns matching distributions; the implementation uses finitely many examples, directions, and frequency samples.

This gives a compact objective with one prediction term and one representation-distribution term. It does not remove architecture choices, optimizer choices, or data choices. Nor does it say that all meaningful representations must be Gaussian. A Gaussian target is a specific geometric preference supported by particular theoretical arguments and empirical results.

LeWM differentiates through both encoder branches and uses no moving-average teacher. The regularizer is responsible for making constant representations unfavorable in the objective. The predictive task is responsible for making useful, action-relevant structure easier to retain than irrelevant structure. The two pressures must be evaluated together.

We now need to distinguish a distribution that merely has acceptable covariance from one that matches a Gaussian target. The next chapter teaches what a statistical test can and cannot establish; then we construct a differentiable discrepancy for training.

## Worked exercise: distinguish the remedies

A model has zero prediction loss and every coordinate's batch standard deviation is zero. A second model has unit coordinate standard deviations and pairwise zero covariance, but its samples lie on a ring. A third has a plausible Gaussian-looking cloud but ignores action inputs. Diagnose each.

<details class="derivation"><summary>Three failures need three tests</summary>

The first is complete collapse. A spread-sensitive representation penalty can distinguish it from a useful solution, but one must also inspect gradient behavior and initialization. The second has no second-moment collapse, yet it is not Gaussian. A distribution-sensitive test along enough directions and frequencies can detect that difference. The third may satisfy the anti-collapse preference while failing at action-conditioned dynamics. Compare held-out predictions with correct and shuffled actions, and measure actual control.


</details>

