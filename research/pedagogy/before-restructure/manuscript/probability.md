# Prediction under uncertainty

<p class="lead">A prediction can be wrong because the model is poor, because the observation is incomplete, or because several futures remain possible. Probability lets us separate these questions.</p>

## Random variables are measurements of uncertain outcomes

A random variable is a rule that assigns a numerical value to an outcome. “The next position of the arm tip” is one such measurement. A distribution specifies how probability is allocated to its possible values. The randomness may describe repeated experiments, variation across a dataset, or uncertainty conditional on what we currently know.

For a discrete variable, probabilities $p_i=P(X=x_i)$ are nonnegative and sum to one. For a continuous variable with density $p(x)$, probabilities belong to intervals or regions: $P(a\leq X\leq b)=\int_a^b p(x)\,dx$. The height $p(x)$ is not itself the probability of exactly $x$. Densities can exceed one; an interval of width $1/10$ with constant density 10 still has total probability one.

An embedding distribution arises when observations vary and the encoder maps them to vectors. The encoder can be deterministic while its outputs are random because its inputs are sampled. That is the distribution SIGReg shapes. It is different from a model's distribution over alternative futures given one fixed observation.

## Expectation is a weighted average

For discrete outcomes, define $\mathbb E[X]=\sum_i p_i x_i$. For a density, replace the weighted sum by $\int xp(x)\,dx$, when the integral is well defined. Expectation is linear because sums and integrals are linear:

$$\mathbb E[aX+bY]=a\mathbb E[X]+b\mathbb E[Y].$$

Independence is not needed for this identity. It is needed for a different one: if $X,Y$ are independent with suitable finite expectations, then $\mathbb E[XY]=\mathbb E[X]\mathbb E[Y]$. For discrete variables, independence makes the joint mass factor as $p_{ij}=p_iq_j$. Then $\sum_{ij}x_iy_jp_iq_j=(\sum_ix_ip_i)(\sum_jy_jq_j)$. The integral proof is the same factorization.

Define variance by $\operatorname{Var}(X)=\mathbb E[(X-\mu)^2]$, where $\mu=\mathbb E[X]$. Expanding the square gives

$$\operatorname{Var}(X)=\mathbb E[X^2]-\mu^2.$$

Variance measures squared spread, so it has squared units. Standard deviation, its nonnegative square root, has the original units. A random variable may have a mean but infinite variance; our later variance calculations assume the required moments exist.

For independent identically distributed samples $X_1,\ldots,X_B$ with variance $\sigma^2$, let $\bar X=B^{-1}\sum_iX_i$. Then

$$\operatorname{Var}(\bar X)=\frac1{B^2}\sum_{i,j}\operatorname{Cov}(X_i,X_j)=\frac{\sigma^2}{B}.$$

The off-diagonal covariances vanish by independence, leaving $B$ diagonal terms. Thus quadrupling an independent sample size halves the standard deviation of the mean. Adjacent video frames are usually correlated. Treating them as independent can make an uncertainty estimate too optimistic.

## Conditioning changes which average is relevant

Conditional probability restricts the experiment to outcomes compatible with known information. For events with $P(A)>0$, define $P(B\mid A)=P(A\cap B)/P(A)$. Multiplying through yields the product rule. Writing the same joint probability in the opposite order yields Bayes' rule:

$$P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}.$$

It is an algebraic identity, not a special learning algorithm. If 10 of 100 arm states move right and a noisy sensor reports “right” for 8 of those but also for 18 of the remaining 90, a positive report indicates rightward motion with probability $8/(8+18)$, not $8/10$. The base frequency matters.

A conditional expectation $m(x)=\mathbb E[Y\mid X=x]$ is the mean appropriate after observing $X=x$. In practice we learn an approximation to that function from examples. If the same image can accompany different velocities, the conditional distribution of the next image can remain broad even in a deterministic simulator.

## Why squared error predicts a mean

Fix an input $x$ and choose a scalar prediction $c$. Write $Y-c=(Y-m)+(m-c)$ with $m=\mathbb E[Y\mid x]$. Squaring and taking the conditional expectation eliminates the cross term:

$$\mathbb E[(Y-c)^2\mid x]=\operatorname{Var}(Y\mid x)+(m-c)^2.$$

The first term does not depend on the prediction. The second is minimized at $c=m$. The vector version follows by summing this identity over coordinates. Thus squared error favors the conditional mean when the target representation is fixed and the model can express that mean. In JEPA the representation also changes during learning, so this statement must be applied conditionally on the chosen encoder rather than treated as a complete theory of joint training.

If $Y=-1$ or $+1$ with equal probability, the best squared-error prediction is zero, although zero never occurs. Its expected error is 1. Predicting either endpoint gives expected error 2. A mean can be the optimal answer to one loss and a physically impossible outcome. This explains blurred pixel predictions and also warns that a deterministic latent predictor can average incompatible latent futures.

<div class="lab" id="uncertainty-lab"><div class="lab-head"><span class="eyebrow">Prediction desk</span><h3>When the best mean never happens</h3><p>The outcome is either −1 or +1. Change the probability of +1 and compare a mean prediction with choosing a branch.</p></div><div class="controls"><label>Probability of +1 <input id="uncertainty-p" type="range" min="0" max="1" step="0.01" value="0.5"/></label></div><canvas id="uncertainty-canvas" aria-label="Two possible outcomes and their squared-error optimal mean"></canvas><p id="uncertainty-readout" class="readout"></p></div>

## The Gaussian family, with its assumptions visible

A standard Gaussian has density

$$p(x)=\frac1{\sqrt{2\pi}}e^{-x^2/2}.$$

The exponential determines the shape and the leading constant normalizes the area. The SIGReg chapter proves the Gaussian integral that produces this constant. Symmetry makes the mean zero. To derive its variance, note $p'(x)=-xp(x)$ and integrate by parts:

$$\int x^2p(x)\,dx=-\int xp'(x)\,dx=-[xp(x)]_{-\infty}^{\infty}+\int p(x)\,dx=1.$$

The boundary term vanishes because the Gaussian exponential decays faster than $|x|$ grows. Integration by parts itself follows by integrating the product derivative $(uv)'=u'v+uv'$ and rearranging. We use this elementary bridge repeatedly, always checking boundaries.

If $G$ is standard Gaussian, $X=\mu+\sigma G$ has mean $\mu$ and variance $\sigma^2$. For $\sigma>0$, its density is $p_X(x)=\sigma^{-1}p((x-\mu)/\sigma)$. The factor $1/\sigma$ compensates for stretching the horizontal axis: substituting $g=(x-\mu)/\sigma$ restores unit area. If $\sigma=0$, the variable is constant and has no ordinary density of this form.

A multivariate standard Gaussian is a vector of independent standard Gaussian coordinates. Its joint density is the product of coordinate densities:

$$p(x)=(2\pi)^{-d/2}\exp(-\|x\|^2/2).$$

The exponent follows because multiplying exponentials adds their exponents. This density depends only on distance from zero. Rotating the coordinates with an orthogonal matrix preserves both length and volume, so it preserves the distribution. “Isotropic” means the distribution looks the same along every direction under these rotations; for this Gaussian the covariance is $I$.

For independent standard Gaussian coordinates, the weighted sum $u^\top G$ is Gaussian with variance $\|u\|^2$. One can verify the distribution using the characteristic function derived in the SIGReg chapter: independence multiplies the factors $e^{-\omega^2u_j^2/2}$, yielding $e^{-\omega^2\|u\|^2/2}$. For a unit direction the result is standard Gaussian. This is a forward reference to a proof, not an assumption hidden inside the later regularizer.

## Independence is stronger than zero covariance

Let $X$ be uniform on $[-1,1]$, and define $Y=X^2$. Symmetry gives $\mathbb E[X]=\mathbb E[X^3]=0$, so $\operatorname{Cov}(X,Y)=0$. Yet observing $X$ determines $Y$ exactly. They are not independent. This counterexample explains why removing off-diagonal covariance cannot eliminate every dependency.

For a jointly Gaussian vector, zero cross-covariance does imply independence of the corresponding groups. A diagonal Gaussian density factors into one-coordinate densities, which is precisely independence. The phrase “jointly Gaussian” does essential work. Individually Gaussian coordinates can still have a non-Gaussian joint relationship.

A mixture is another useful counterexample. Choose a branch with a coin, then sample a narrow Gaussian around either $-2$ or $+2$. The result has two peaks. Its mean is zero, and its variance can be computed by conditioning, but those two numbers do not make it a Gaussian. The book's distribution experiment compares mixtures, rings, lines, constants, and Gaussians so these distinctions remain visible.

## Generalization is a distributional question

The training distribution describes examples the learner sees while fitting parameters. The evaluation distribution describes the cases on which we measure performance. A train–test split estimates transfer to fresh data only to the extent that the split represents the desired use.

Overlapping video windows share observations and hidden episode conditions. Randomly splitting windows may place nearly identical transitions on both sides. Splitting entire episodes reduces this leakage. It does not ensure transfer to unfamiliar backgrounds, action ranges, or mechanisms. Those require explicit distribution shifts in the evaluation.

The data-collecting policy also matters. If it never applies a negative torque at a particular pose, a model can fit the dataset without learning that counterfactual. Prediction from logged actions is evidence about observed coverage. It is not automatically identification of every causal action effect.

## A normality test is a calibrated decision procedure

A hypothesis test starts with a null model, such as independent standard Gaussian samples. It chooses a statistic that tends to be unusual when the null fails, then calibrates how unusual a measured value is under the null. A p-value is a tail probability under that null procedure. It is not the probability that the null is true.

If the Gaussian mean and variance are fitted from the same data, the null distribution of many statistics changes. Testing a fully specified $\mathcal N(0,1)$ target is different from testing membership in the family of all Gaussians. SIGReg specifically wants the standardized target, because the desired center and scale are part of its objective.

A differentiable discrepancy can be minimized during training without ever computing a p-value. That is how SIGReg uses a normality-test statistic. Samples are then adaptively chosen by the encoder to lower it, and projected samples are not an untouched independent test set. Quoting a textbook test threshold afterward would require a fresh calibration argument.

“Failure to reject” also does not establish equality of distributions. A small sample or poorly chosen statistic can have little power to detect a difference. Conversely, a large sample can detect a small practically irrelevant deviation. We care about both the distributional constraint and downstream behavior.

## Quantifying finite-sample uncertainty

Suppose a controller succeeds independently on each task with probability $p$. A success indicator is 1 with probability $p$ and 0 otherwise. Its mean is $p$ and variance is $p-p^2=p(1-p)$. The sample success rate over $n$ tasks therefore has variance $p(1-p)/n$. Replacing $p$ by the observed rate gives a rough standard-error estimate, useful away from the endpoints and for sufficiently large independent samples.

For 48 successes out of 50, the rate is $0.96$ and this estimated standard error is about $0.028$. This does not mean the true rate lies within 2.8 percentage points with certainty. A normal approximation interval would multiply the standard error by a chosen quantile, and it behaves poorly near boundaries. For small experiments, report the count as well as any interval, and specify how tasks and seeds were sampled.

Variation across training seeds is another level of randomness. Testing three trained models on the same 50 tasks produces correlated evidence, not 150 wholly independent draws of a model–task pair. Separate variation from training, task selection, and evaluation randomness when possible. A plus-minus sign in a table is incomplete unless it says whether it denotes standard deviation, standard error, variance, or a confidence interval.

## Worked exercises: choose the right average

A one-dimensional future is $-2$ with probability $1/4$ and $2$ with probability $3/4$. Find the best constant squared-error prediction and its irreducible error. Then explain what changes if a new sensor perfectly reveals the branch.

<details class="derivation"><summary>Solution and interpretation</summary>

The mean is $(-2)/4+3(2)/4=1$. Since $\mathbb E[Y^2]=4$, the variance is $4-1^2=3$. Predicting 1 has expected squared error 3, although 1 is not a possible outcome. With the branch-revealing sensor, the conditional mean becomes the actual branch value and conditional variance becomes zero. The physical process did not change; the information available to the predictor did.

For a noisy sensor, condition on each sensor outcome and compute its own branch probabilities. Averaging the resulting conditional variances quantifies the remaining uncertainty. This is the law of total variance: $\operatorname{Var}(Y)=\mathbb E[\operatorname{Var}(Y\mid X)]+\operatorname{Var}(\mathbb E[Y\mid X])$. Derive it by writing $Y-\mathbb EY=(Y-\mathbb E[Y\mid X])+(\mathbb E[Y\mid X]-\mathbb EY)$, expanding, and conditioning to make the cross term vanish.

</details>

We can now distinguish sample fluctuations, hidden state, and genuine ambiguity. The next task is to turn these statistical objectives into parameter updates.
