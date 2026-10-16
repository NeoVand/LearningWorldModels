# Agreement without collapse

<p class="lead">Two networks can agree because they understand the same thing, or because neither says anything. A joint-embedding objective must distinguish those possibilities.</p>

We will use one notation throughout. An observation is $\obs_t$, its encoded description is $\lat_t=f_\theta(\obs_t)$, an action is $\act_t$, and a predicted description carries a hat, $\pred_{t+1}$. The encoder weights are $\theta$; the predictor $g_\psi$ has its own weights $\psi$. A subscript $t$ labels time; it does not mean multiplication. The hat distinguishes prediction from the description of an actually observed future. In the formulas below, $\observed{o}$ is $\obs_t$ and $\encoded{z}$ is $\lat_t$.

<div class="legend"><span class="obs">observation</span><span class="lat">representation</span><span class="pred">prediction</span><span class="act">action</span><span class="loss">loss or cost</span></div>

## The arm’s prediction problem

The laboratory camera will give us three frames and two actions. The encoder turns each frame into a vector. The predictor uses the first two vectors and their aligned actions to guess the third. The loss compares that guess with the encoding of the actually observed third frame. That is a joint-embedding predictor: the target is a learned description, not a pixel reconstruction and not a supplied class label.

<figure class="diagram" data-diagram="objectives"></figure>

Prediction loss, batch geometry, and a regularizer are three different jobs. The prediction term asks the encoder and predictor to agree about the next description. Without a second preference, they can agree by saying nothing.

<figure class="diagram" data-diagram="jepa"></figure>

<figure class="generated-plate" data-art="J1"><img src="assets/generated/infographics/jepa-3.png" alt="A common context branches into pixel reconstruction and a coordinate representation target."/><figcaption>A pixel prediction is compared with an observed image; a representation prediction is compared with an encoded target. The coordinates are learned features, not named physical quantities. The next diagrams specify parameter sharing and gradient flow.</figcaption></figure>

<!-- VISUAL: J1 -->

A moving white dot on a flickering background makes the same choice vivid. Predicting every pixel rewards knowledge of both motion and background. Predicting a representation may allow the encoder to discard the flicker while retaining the dot—or to discard the dot as well. The question is which errors the objective makes attractive.

For a batch of windows with $N$ context transitions, an explicit coordinate-averaged prediction loss is

$$\objective{L}_{\mathrm{pred}}=\frac1{BNd}\sum_{b=1}^B\sum_{t=1}^N\sum_{j=1}^d\big(\predicted{\hat z}_{b,t+1,j}-\encoded{z}_{b,t+1,j}\big)^2.$$

The action $\action{a}_t$ must be the one associated with the transition from observation $t$ to observation $t+1$. Pairing the future frame with the previous action trains a visually plausible model that responds to the wrong command. When several physical actions lie between selected frames, the conditioning input may be an action block rather than one motor command.

Teacher forcing uses encoded observed context during training. Free rollout uses previous predictions as new context. Those inputs can differ substantially; the [rollout-error derivation](#planning-7) will quantify the accumulation.

<!-- VISUAL: J5 -->

## Both sides can move

For a shared encoder used on both context and target observations, two paths lead back to the same parameters. Their contributions add. With scalar residual $e=g_\psi(f_\theta(\observed{o}))-f_\theta(\observed{o}')$, differentiating $e^2$ gives

$$\nabla_\theta e^2=2e\left[\frac{\partial g_\psi}{\partial \encoded{z}}\nabla_\theta f_\theta(\observed{o})-\nabla_\theta f_\theta(\observed{o}')\right].$$

This formula is a scalar illustration; the vector form replaces products by Jacobian-transpose products. It shows why a learnable target can move toward the prediction as the prediction moves toward the target. LeWorldModel keeps both contributions. The stop-gradient operation used by some teacher methods, introduced below, deliberately removes the second one.

<!-- VISUAL: J2 -->

## Construct the collapse solution

Let $f_\theta(\observed{o})=c$ for every observation and $g_\psi(c,\action{a})=c$ for every action. Then every prediction equals its target, so the squared prediction loss is zero. The construction is valid for any fixed vector $c$ the architecture can produce. More training examples do not remove this solution; they produce more copies of the same zero error. Symmetric prediction can agree by saying nothing.

<figure class="diagram" data-diagram="collapse"></figure>

Complete collapse makes every observation identical in latent space. Dimensional collapse leaves variation in too few directions. A third failure is a noncollapsed but irrelevant representation: for example, encoding camera noise rather than arm state. Anti-collapse geometry addresses the first two. The prediction task and data must supply the pressure toward useful content.

A zero encoder can have small or zero weights, so a weight penalty may actually favor the trivial solution. We need to constrain what the collection of outputs retains.

**Pause and calculate.** For scalar images $\observed{o}=1,\observed{o}'=2$, use encoder $f_\theta(\observed{o})=\theta \observed{o}$ and predictor $g(\encoded{z})=\encoded{z}$. The prediction loss is $(\theta-2\theta)^2=\theta^2$. At $\theta=1$, its derivative is 2; a descent step shrinks the representation. At $\theta=0$, the loss is perfect and all information is gone. This is not overfitting one target: the learner has changed the target to make its own task empty.

<!-- VISUAL: J3 -->

## What LeWM does not use

Several families close the loophole differently. LeWorldModel uses none of them as its regularizer. Their job here is to name the alternatives, so the later SIGReg chapter has a contrast.

A **contrastive** objective makes a positive pair more compatible than selected negative pairs. Suppose an anchor has scores $s_+$ for its related view and $s_1,\ldots,s_K$ for other examples. Define probabilities with the softmax and choose the negative log probability of the positive:

$$\begin{aligned}&\ell_{\mathrm{con}}=-\log\frac{e^{s_+/\tau}}{e^{s_+/\tau}+\sum_{k=1}^Ke^{s_k/\tau}}, \\ &\tau>0.\end{aligned}$$

Writing $\ell=-s_+/\tau+\log\sum_j e^{s_j/\tau}$, differentiation gives $\partial\ell/\partial s_j=(p_j-\mathbf1\{j=+\})/\tau$. Descent increases the positive score and reduces negative scores according to their current probabilities. With all scores equal, the loss is $\log(K+1)$. Identical embeddings become unattractive at the level of the objective. The remaining choices—which samples count as distinct, how many to use, and how to treat different views of the same object—determine the constraints and the cost.

A **teacher** family uses an online encoder and a target encoder. The target parameters move slowly toward the online parameters using an exponential moving average (EMA):

$$\begin{aligned}&\bar\theta_{k+1}=m\bar\theta_k+(1-m)\theta_k, \\ &0\leq m<1.\end{aligned}$$

Here $k$ counts optimization steps, not environment time. This is the same weighted-history recurrence encountered in momentum. The target representation is detached from differentiation by a **stop-gradient** operation, whose forward value is unchanged but whose backward derivative is defined to be zero.

<figure class="diagram" data-diagram="teacher"></figure>

These operations change the coupled learning dynamics. They are not ordinary gradient descent on the symmetric prediction loss. A frozen pretrained encoder is different again: the predictor cannot collapse a representation it is not allowed to change.

**VICReg**, introduced in [Bardes, Ponce, and LeCun, 2021](https://arxiv.org/pdf/2105.04906v1), assigns the three jobs to three terms. Two related views produce batches $\encoded{Z},\encoded{Z}'\in\mathbb R^{B\times d}$. An invariance term encourages their paired representations to agree. A variance term discourages individual coordinates from becoming constant. A covariance term discourages redundant linear relationships among coordinates.

One common convention defines the invariance term as $B^{-1}\sum_i\|\encoded{z}_i-\encoded{z}_i'\|^2$. For one branch, define $\sigma_j=\sqrt{\operatorname{Var}(\encoded{Z}_{:j})+\epsilon}$ and a variance penalty

$$\objective{L}_{\mathrm{var}}(\encoded{Z})=\frac1d\sum_{j=1}^d\max(0,\gamma-\sigma_j).$$

The threshold $\gamma>0$ is a chosen desired lower spread. With centered covariance $C=(B-1)^{-1}\encoded{Z}_c^\top \encoded{Z}_c$, define

$$\objective{L}_{\mathrm{cov}}(\encoded{Z})=\frac1d\sum_{j\ne k}C_{jk}^2.$$

The off-diagonal square is essential: without it, positive and negative covariances could cancel. A unit variance floor plus zero cross-covariances still misses higher moments. The whitened-circle example from the clouds chapter satisfies those moment constraints and remains concentrated on a ring. Matched moments miss a ring.

<figure class="diagram" data-diagram="vicreg"></figure>

<!-- VISUAL: J4 -->

## Why the variance penalty has a gradient caveat

For one coordinate with descriptive variance $v=B^{-1}\sum_i(x_i-\bar x)^2$, differentiation gives $\partial v/\partial x_i=2(x_i-\bar x)/B$. To obtain this, expand $v=B^{-1}\sum_i x_i^2-\bar x^2$ and use $\partial\bar x/\partial x_i=1/B$.

When the hinge is active, the derivative of $\gamma-\sqrt{v+\epsilon}$ is

$$-\frac{x_i-\bar x}{B\sqrt{v+\epsilon}}.$$

It pushes above-mean examples upward and below-mean examples downward under gradient descent. At exact equality of all examples, however, every numerator is zero. **Positive penalty, zero gradient.** A perfectly symmetric collapsed point can have a nonzero penalty and a zero escape gradient. The same subtlety will reappear in SIGReg.

## From covariance control to a differentiable discrepancy

SIGReg goes beyond a finite list of moments. It projects the batch along random directions, measures how each one-dimensional distribution differs from a standard Gaussian, and averages those discrepancies. A differentiable fixed-target discrepancy is what we optimize. The implementation uses finitely many examples, directions, and frequency samples.

LeWM differentiates through both encoder branches and uses no moving-average teacher. The regularizer is responsible for making constant representations unfavorable in the objective. The predictive task is responsible for making useful, action-relevant structure easier to retain than irrelevant structure. The laboratory’s prediction-only run will be the collapse loophole with the regularizer removed.

We now need to distinguish a distribution that merely has acceptable covariance from one that matches a Gaussian target. The next chapter teaches what a statistical test can establish; then we construct the discrepancy we actually differentiate.

## Worked exercise: construct the loophole

An encoder maps every arm image to the same vector $c$, and the predictor returns $c$ for every action. What is the prediction loss? What happens to a weight penalty on the encoder if $c=0$ is available? Write the scalar calculation $\theta\mapsto\theta^2$ from the pause above in your own words before opening the solution.

<details class="derivation"><summary>The loophole in one paragraph</summary>

The prediction loss is identically zero: every target equals every prediction. If the architecture can produce the zero vector, a penalty on the squared weights can favor that solution. The scalar map $f_\theta(o)=\theta o$ with $g(z)=z$ makes the same point numerically: the loss $\theta^2$ is minimized at $\theta=0$, where the representation has been erased. More data copies the same zero error. Closing the loophole requires a preference on the collection of outputs, not a smaller encoder.

</details>
