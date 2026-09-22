# Prediction under uncertainty

<p class="lead">A prediction can be wrong because the model is poor, because the observation is incomplete, or because several futures remain possible. Probability lets us separate these questions.</p>

## Random variables are measurements of uncertain outcomes

A random variable is a rule that assigns a numerical value to an outcome. “The next position of the arm tip” is one such measurement. A distribution specifies how probability is allocated to its possible values. The randomness may describe repeated experiments, variation across a dataset, or uncertainty conditional on what we currently know.

For a discrete variable, probabilities $p_i=P(X=x_i)$ are nonnegative and sum to one. For a continuous variable with density $p(x)$, probabilities belong to intervals or regions: $P(a\leq X\leq b)=\int_a^b p(x)\,dx$. The height $p(x)$ is not itself the probability of exactly $x$. Densities can exceed one; an interval of width $1/10$ with constant density 10 still has total probability one.

An embedding distribution arises when observations vary and the encoder maps them to vectors. The encoder can be deterministic while its outputs are random because its inputs are sampled. That is the distribution SIGReg shapes. It is different from a model’s distribution over alternative futures given one fixed observation.

<!-- VISUAL: B1 -->

## Expectation is a weighted average

For discrete outcomes, define $\mathbb E[X]=\sum_i p_i x_i$. For a density, replace the weighted sum by $\int xp(x)\,dx$, when the integral is well defined. Expectation is linear because sums and integrals are linear:

$$\mathbb E[aX+bY]=a\mathbb E[X]+b\mathbb E[Y].$$

Independence is not needed for this identity. It is needed for a different one: if $X,Y$ are independent with suitable finite expectations, then $\mathbb E[XY]=\mathbb E[X]\mathbb E[Y]$. Here independence means that learning one variable does not change the distribution of the other. For discrete variables it says that the joint mass $p_{ij}=P(X=x_i,Y=y_j)$ factors as $p_iq_j$, where $p_i=P(X=x_i)$ and $q_j=P(Y=y_j)$. Then $\sum_{ij}x_iy_jp_iq_j=(\sum_ix_ip_i)(\sum_jy_jq_j)$. The integral proof is the same factorization.

Define variance by $\operatorname{Var}(X)=\mathbb E[(X-\mu)^2]$, where $\mu=\mathbb E[X]$. Expanding the square gives

$$\operatorname{Var}(X)=\mathbb E[X^2]-\mu^2.$$

Variance measures squared spread, so it has squared units. Standard deviation, its nonnegative square root, has the original units. A random variable may have a mean but infinite variance; our later variance calculations assume the required moments exist.

For two scalar variables, define $\operatorname{Cov}(X,Y)=\mathbb E[(X-\mathbb EX)(Y-\mathbb EY)]$. Expanding gives $\mathbb E[XY]-\mathbb EX\mathbb EY$. Independence makes this zero by the product-expectation identity above. Expanding the squared centered sum also gives $\operatorname{Var}(X+Y)=\operatorname{Var}(X)+2\operatorname{Cov}(X,Y)+\operatorname{Var}(Y)$. The same expansion works for any finite sum.

For independent identically distributed samples $X_1,\ldots,X_B$ with variance $\sigma^2$, let $\bar X=B^{-1}\sum_iX_i$. Then

$$\operatorname{Var}(\bar X)=\frac1{B^2}\sum_{i,j}\operatorname{Cov}(X_i,X_j)=\frac{\sigma^2}{B}.$$

The off-diagonal covariances vanish by independence, leaving $B$ diagonal terms. Thus quadrupling an independent sample size halves the standard deviation of the mean. Adjacent video frames are usually correlated. Treating them as independent can make an uncertainty estimate too optimistic.

<!-- VISUAL: B2 -->

## Conditioning changes which average is relevant

Conditional probability restricts the experiment to outcomes compatible with known information. For events with $P(A)>0$, define $P(B\mid A)=P(A\cap B)/P(A)$. Multiplying through yields the product rule. Writing the same joint probability in the opposite order yields Bayes’ rule:

$$P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}.$$

It is an algebraic identity, not a special learning algorithm. If 10 of 100 arm states move right and a noisy sensor reports “right” for 8 of those but also for 18 of the remaining 90, a positive report indicates rightward motion with probability $8/(8+18)$, not $8/10$. The base frequency matters.

<!-- VISUAL: B3 -->

A conditional expectation $m(x)=\mathbb E[Y\mid X=x]$ is the mean appropriate after observing $X=x$. In practice we learn an approximation to that function from examples. If the same image can accompany different velocities, the conditional distribution of the next image can remain broad even in a deterministic simulator.

For discrete outcomes, that conditional mean is $\sum_y yP(Y=y\mid X=x)$. If, after one sensor reading, the two possible velocities are $-1$ and $+1$ with probabilities $1/4$ and $3/4$, the mean velocity is $(-1)/4+3/4=1/2$. It is an average of compatible possibilities, not necessarily an actual velocity.

For continuous measurements, the event $X=x$ itself has probability zero, so we cannot divide its event probability into another. Instead use a joint density $p_{X,Y}(x,y)$. Integrate out $y$ to obtain $p_X(x)=\int p_{X,Y}(x,y)\,dy$. Where $p_X(x)>0$, define $p(y\mid x)=p_{X,Y}(x,y)/p_X(x)$ and $m(x)=\int y p(y\mid x)\,dy$. This conditional density integrates to one because its numerator integrates to its denominator. It is also the limit of conditioning on increasingly narrow intervals around $x$ when the densities are continuous there.

## Why squared error predicts a mean

Fix an input $x$ and choose a scalar prediction $c$. Write $Y-c=(Y-m)+(m-c)$ with $m=\mathbb E[Y\mid x]$. Squaring and taking the conditional expectation eliminates the cross term:

$$\mathbb E[(Y-c)^2\mid x]=\operatorname{Var}(Y\mid x)+(m-c)^2.$$

The first term does not depend on the prediction. The second is minimized at $c=m$. The vector version follows by summing this identity over coordinates. Thus squared error favors the conditional mean when the target representation is fixed and the model can express that mean. In JEPA the representation also changes during learning, so this statement must be applied conditionally on the chosen encoder rather than treated as a complete theory of joint training.

If $Y=-1$ or $+1$ with equal probability, the best squared-error prediction is zero, although zero never occurs. Its expected error is 1. Predicting either endpoint gives expected error 2. A mean can be the optimal answer to one loss and a physically impossible outcome. This explains blurred pixel predictions and also warns that a deterministic latent predictor can average incompatible latent futures.

<figure class="plate"><img src="assets/generated/renewed/branch.png" alt="One amber marble approaches a fork in a wooden track. Two branches lead to separate empty bowls."/><figcaption>A generated illustration of two possible destinations. Their average position can lie between the tracks, where neither outcome occurs. The numerical example below assigns the two destinations coordinates −1 and +1.</figcaption></figure>

<!-- VISUAL: B4 -->

## The Gaussian family

A standard Gaussian has density

$$p(x)=\frac1{\sqrt{2\pi}}e^{-x^2/2}.$$

The exponential determines the shape and the leading constant normalizes the area. We derive the constant now so this density has no unexplained normalization. 

<details><summary>Required derivation · where the Gaussian normalization comes from</summary>

Let $I=\int_{-\infty}^{\infty}e^{-x^2/2}\,dx$. Squaring it forms a two-dimensional integral:

$$I^2=\int_{\mathbb R^2}e^{-(x^2+y^2)/2}\,dx\,dy.$$

The integrand depends only on distance $r$ from the origin. A thin annulus of radius $r$ and thickness $dr$ has area approximately $2\pi r\,dr$, with the relative error vanishing as the thickness goes to zero. Equivalently, polar coordinates have area element $r\,dr\,d\alpha$. Therefore

$$\begin{aligned}I^2&=2\pi\int_0^\infty re^{-r^2/2}\,dr\\&=2\pi\int_0^\infty e^{-v}\,dv=2\pi,\end{aligned}$$

where $v=r^2/2$ gives $dv=r\,dr$. The last integral is one because an antiderivative of $e^{-v}$ is $-e^{-v}$. Since $I$ is positive, $I=\sqrt{2\pi}$. Nonnegative integrands justify combining these integrals; one can first integrate over bounded regions and then increase the regions.

</details>

Symmetry makes the mean zero. To derive its variance, note $p'(x)=-xp(x)$ and integrate by parts:

$$\begin{aligned}\int x^2p(x)\,dx&=-\int xp'(x)\,dx\\&=-[xp(x)]_{-\infty}^{\infty}+\int p(x)\,dx\\&=1.\end{aligned}$$

The boundary term vanishes because the Gaussian exponential decays faster than $|x|$ grows. Integration by parts itself follows by integrating the product derivative $(uv)'=u'v+uv'$ and rearranging. We use this elementary bridge repeatedly, always checking boundaries.

If $G$ is standard Gaussian, $X=\mu+\sigma G$ has mean $\mu$ and variance $\sigma^2$. For $\sigma>0$, its density is $p_X(x)=\sigma^{-1}p((x-\mu)/\sigma)$. The factor $1/\sigma$ compensates for stretching the horizontal axis: substituting $g=(x-\mu)/\sigma$ restores unit area. If $\sigma=0$, the variable is constant and has no ordinary density of this form.

<!-- VISUAL: B5 -->

## Independence is stronger than zero covariance

Let $X$ be uniform on $[-1,1]$, and define $Y=X^2$. Symmetry gives $\mathbb E[X]=\mathbb E[X^3]=0$, so $\operatorname{Cov}(X,Y)=0$. Yet observing $X$ determines $Y$ exactly. They are not independent. This counterexample explains why removing off-diagonal covariance cannot eliminate every dependency.

We have proved only one direction: independence implies zero covariance. The counterexample disproves the converse. The next chapter will distinguish these properties for entire vectors.

A mixture is another useful counterexample. Choose a branch with a coin, then sample a narrow Gaussian around either $-2$ or $+2$. The result has two peaks. Its mean is zero, and its variance can be computed by conditioning, but those two numbers do not make it a Gaussian. The book’s distribution experiment compares mixtures, rings, lines, constants, and Gaussians so these distinctions remain visible.

<!-- VISUAL: B6 -->

## Generalization is a distributional question

The training distribution describes examples the learner sees while fitting parameters. The evaluation distribution describes the cases on which we measure performance. A train–test split estimates transfer to fresh data only to the extent that the split represents the desired use.

Overlapping video windows share observations and hidden episode conditions. Randomly splitting windows may place nearly identical transitions on both sides. Splitting entire episodes reduces this leakage. Test transfer to unfamiliar backgrounds, action ranges, and mechanisms by introducing those distribution shifts explicitly at evaluation.

The data-collecting policy also matters. If it never applies a negative torque at a particular pose, a model can fit the dataset without learning that counterfactual. The logged actions determine which consequences the data can teach; testing a missing action requires new coverage.

## Quantifying finite-sample uncertainty

Suppose a controller succeeds independently on each task with probability $p$. A success indicator is 1 with probability $p$ and 0 otherwise. Its mean is $p$ and variance is $p-p^2=p(1-p)$. The sample success rate over $n$ tasks therefore has variance $p(1-p)/n$. Replacing $p$ by the observed rate gives a rough standard-error estimate, useful away from the endpoints and for sufficiently large independent samples.

For 48 successes out of 50, the rate is $0.96$ and this estimated standard error is about $0.028$. The standard error describes sampling variability. A normal approximation interval multiplies it by a chosen quantile; near a boundary such as 100% success, that approximation behaves poorly. For small experiments, report the count as well as any interval, and specify how tasks and seeds were sampled.

Variation across training seeds is another level of randomness. Testing three trained models on the same 50 tasks produces correlated evidence, not 150 wholly independent draws of a model–task pair. Separate variation from training, task selection, and evaluation randomness when possible. A plus-minus sign in a table is incomplete unless it says whether it denotes standard deviation, standard error, variance, or a confidence interval.

<!-- VISUAL: B7 -->

## Worked exercises: choose the right average

A one-dimensional future is $-2$ with probability $1/4$ and $2$ with probability $3/4$. Find the best constant squared-error prediction and its irreducible error. Then explain what changes if a new sensor perfectly reveals the branch.

<details class="derivation"><summary>Solution and interpretation</summary>

The mean is $(-2)/4+3(2)/4=1$. Since $\mathbb E[Y^2]=4$, the variance is $4-1^2=3$. Predicting 1 has expected squared error 3, although 1 is not a possible outcome. With the branch-revealing sensor, the conditional mean becomes the actual branch value and conditional variance becomes zero. The physical process did not change; the information available to the predictor did.

For a noisy sensor, condition on each sensor outcome and compute its own branch probabilities. Averaging the resulting conditional variances quantifies the remaining uncertainty. This is the law of total variance: $\operatorname{Var}(Y)=\mathbb E[\operatorname{Var}(Y\mid X)]+\operatorname{Var}(\mathbb E[Y\mid X])$. Derive it by writing $Y-\mathbb EY=(Y-\mathbb E[Y\mid X])+(\mathbb E[Y\mid X]-\mathbb EY)$, expanding, and conditioning to make the cross term vanish.

</details>

We can now distinguish sample fluctuations, hidden state, and genuine ambiguity. Next we apply these averages to vectors. Covariance will become a picture of which directions a cloud occupies, not merely a new matrix to memorize.
