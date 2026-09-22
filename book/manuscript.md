<!-- PAGE: Prologue | Before the Move -->
<div class="cover-label">A small book about learning a world</div>

# Before<br>the Move

<div class="cover-subtitle">From first principles to<br>Joint-Embedding Predictive Architectures</div>

<div class="cover-art" data-figure="cover"></div>

A machine sees a ball. It considers a push. Before anything moves, it must imagine what happens next.

This book follows that single question through vectors, probability, learning, collapse, Gaussian geometry, and planning. Its destination is **LeWorldModel**, the March 2026 paper by Lucas Maes, Quentin Le Lidec, Damien Scieur, Yann LeCun, and Randall Balestriero.

<div class="cover-footer">100 short lessons & reference pages · 10 live experiments<br>A companion to arXiv:2603.19312v1 · First edition</div>

<!-- PAGE: Prologue | An invitation, and a contract -->
## An invitation, and a contract

You need some familiarity with algebra, derivatives, and the idea of probability. You do not need to know neural networks. When a symbol first appears, stop and translate it into a sentence. Understanding grows by making those translations yourself.

Our recurring world is a little puck moving along a track. A camera sees it; a controller can push it. The puck is deliberately simple. It lets us separate the difficulty of learning a world from the difficulty of describing one.

**Every equation has a job.** A definition names something; a derivation follows from stated assumptions; a modeling choice is a decision we can challenge. We will distinguish these. There is no proof that a chosen loss is universally the right loss, just reasons to use it and experiments that test those reasons.

Worked answers appear under **Try it first**. Open them after trying. In print, they are always visible. The experiments calculate their results in your browser. Their captions say whether they use known mechanics, synthetic data, or learned parameters.

The ambition is a research-capable reading of the target paper: reconstruct its mathematics, explain its implementation, and question its evidence. A hundred pages cannot prove every theorem in analysis or confer research expertise. Our proofs state their analytic assumptions; our final pages identify the remaining research questions.

**Color key:** $\obs$ is an observation, $\lat$ an embedding, $\pred$ a prediction, $\act$ an action, and $\loss$ a loss. Names and hats also distinguish them; color is never the only cue.

<!-- PAGE: Prologue | The route through the book -->
## The route through the book

The story has four turns. First, a photograph is not the same thing as a state of the world. Second, predicting a useful description can be easier than predicting every pixel. Third, learning the description creates a dangerous loophole: erase everything, and prediction becomes perfect. Fourth, keeping descriptions informative lets us use predictions to choose actions.

| Pages | Question we will answer |
|---|---|
| 4–10 | How do we write observations and movements as numbers? |
| 11–20 | How do we describe uncertainty and Gaussian geometry? |
| 21–30 | How does a function learn, and what is regularization? |
| 31–45 | Why embeddings, why collapse, and why the JEPA family? |
| 46–60 | How can normality tests become a differentiable objective? |
| 61–70 | How is LeWorldModel assembled and trained? |
| 71–80 | How do imagined futures become actions? |
| 81–90 | What does the evidence establish? |
| 91–100 | How do we read, reproduce, and question the paper? |

Do not rush the probability chapters to reach the neural network. The hardest conceptual bridge in SIGReg is not a transformer: it is understanding how the distribution of many embeddings differs from any single embedding.

A useful study rhythm is three pages, one calculation on paper, then one explanation spoken without looking. If you cannot explain why a term is present, return to the preceding example. This is a book to work through, not a test of reading speed.

<!-- PAGE: I · Describing a world | A picture is not a state -->
## A picture is not a state

Imagine photographing a puck as it passes the center of a track. One puck moves left; another moves right. The photographs can be identical. Their futures are different.

Write the physical state as $s_t=(x_t,v_t)$: position and velocity at time $t$. Write the camera image as $\obs_t=R(s_t)$, where $R$ is the rendering process. The subscript is a time label, not multiplication. The camera may discard velocity: $R(x,+v)=R(x,-v)$.

A **state** contains enough information to predict the next state, given an action and any random disturbance. An **observation** contains whatever the sensor reveals. They need not contain the same information. This is partial observability.

Two nearby observations can help. If a puck moves from position $0.2$ to $0.3$ in $0.1$ seconds, its average velocity is $(0.3-0.2)/0.1=1$ unit per second. This does not recover every hidden cause, but it resolves the left-versus-right ambiguity.

<div class="lab" data-lab="history"></div>

The experiment uses known constant-velocity mechanics. It is not a learned model. Reveal the previous positions: the hidden difference becomes visible without changing the current picture.

<details><summary>Try it first: could one frame ever be sufficient?</summary>Yes. If the environment has no momentum and the next position depends only on the present position and action, one position can be sufficient. Sufficiency depends on the dynamics and sensor, not on a universal number of frames.</details>

<!-- PAGE: I · Describing a world | Actions are interventions -->
## Actions are interventions

Let $\act_t$ be acceleration held constant for an interval $\Delta$. The simplest motion model follows from the definition of acceleration, $dv/dt=\act_t$. Integrating over the interval gives

$$v_{t+1}=v_t+\act_t\Delta.$$

Velocity is then $v(t+u)=v_t+\act_tu$. Integrating velocity gives displacement:

$$x_{t+1}=x_t+\int_0^\Delta(v_t+\act_tu)\,du
=x_t+v_t\Delta+\tfrac12\act_t\Delta^2.$$

This is exact for constant acceleration with no collision or drag. We did not discover physics by fitting data; we specified a world. Later, a learned predictor will approximate transitions without receiving these equations.

An action answers “what if we push this way?” An observation answers “what did we see?” They play different roles. Watching a puck move right does not tell us what would have happened under a leftward push. An offline dataset must contain enough variation in actions and situations to support useful predictions.

**Units are an error detector.** Position has units of length. Both $v\Delta$ and $\act\Delta^2$ have units of length. Adding acceleration directly to position would be dimensionally wrong unless we had first chosen a convention that absorbs time scales.

<details><summary>Try it first: one interval by hand</summary>Take $x=0$, $v=1$, $a=-2$, and $\Delta=0.5$. Then $v'=0$ and $x'=0+0.5-0.25=0.25$. The puck still moves forward while braking. An action can slow motion before it reverses it.</details>

<!-- PAGE: I · Describing a world | Vectors are organized lists -->
## Vectors are organized lists

A vector is an ordered list of numbers. The order carries meaning. For the puck, $s=(x,v)$ is different from $(v,x)$. For a grayscale image with height $H$ and width $W$, we can list its $HW$ brightness values in a fixed order.

We write $\obs\in\mathbb R^D$ to say that the observation is a vector of $D$ real numbers. An RGB image of size $224\times224$ has $D=224\cdot224\cdot3=150{,}528$ numbers. This is a description length, not a claim that all those numbers vary independently.

Vector addition and scalar multiplication act coordinate by coordinate:

$$(2,3)+(1,-2)=(3,1),\qquad 2(2,3)=(4,6).$$

A **batch** is a collection of examples. Stacking $B$ image vectors makes a matrix $X\in\mathbb R^{B\times D}$. A sequence batch adds another axis: $X\in\mathbb R^{B\times T\times D}$. A tensor is simply an array with potentially more than two axes.

Why dwell on shapes? Because averaging over examples asks a different question from averaging over coordinates. SIGReg needs a distribution across examples. Accidentally averaging across time or features changes the mathematical object.

<details><summary>Try it first: read a shape</summary>An array of shape $(8,4,12)$ may hold eight independent trajectories, four frames each, and twelve features per frame. Fixing the second index gives an $8\times12$ matrix. Fixing the first index gives a $4\times12$ trajectory. The array alone does not tell you which axis has which meaning; documentation must.</details>

<!-- PAGE: I · Describing a world | Matrices are reusable recipes -->
## Matrices are reusable recipes

A matrix defines a linear transformation. Each output is a weighted sum of input coordinates. With column vectors,

$$y=Wx,\qquad y_i=\sum_{j=1}^D W_{ij}x_j.$$

The summation symbol means “add the listed terms.” If $W$ has $K$ rows and $D$ columns, it accepts $D$ numbers and returns $K$. For example,

$$\begin{bmatrix}1&\Delta\\0&1\end{bmatrix}
\begin{bmatrix}x\\v\end{bmatrix}
=\begin{bmatrix}x+\Delta v\\v\end{bmatrix}.$$

That matrix advances constant-velocity motion. Adding an action term gives the constant-acceleration model:

$$s_{t+1}=As_t+b\act_t,\quad
b=\begin{bmatrix}\Delta^2/2\\\Delta\end{bmatrix}.$$

“Linear” means $W(cx+dy)=cWx+dWy$. Expand either side coordinate by coordinate to verify it. Adding a constant bias gives an **affine** transformation; it is not strictly linear unless the bias is zero.

The transpose $W^\top$ exchanges rows and columns. The identity $I$ leaves a vector unchanged. Matrix multiplication represents composition: $U(Wx)=(UW)x$. Its order matters because applying one transformation changes what the next receives.

A neural network will compose many such recipes with nonlinear operations between them. Without the nonlinear operations, all its layers could be multiplied into a single matrix and bias. Depth alone would not create a more expressive function family.

<details><summary>Try it first: why can multiplication fail?</summary>A $3\times2$ matrix produces three numbers from two. A $4\times5$ matrix expects five, so it cannot consume that result. The inner dimensions must match. Checking this is often the fastest way to find a mistaken transpose.</details>

<!-- PAGE: I · Describing a world | A projection is a shadow -->
## A projection is a shadow

The dot product is $u^\top z=\sum_j u_jz_j$. When $u$ is a unit vector, this is the signed length of the shadow of $z$ along direction $u$. In two dimensions, let $u=(\cos\theta,\sin\theta)$; its squared length is $\cos^2\theta+\sin^2\theta=1$.

For $z=(2,1)$ and $u=(1,0)$, the shadow is $2$. Rotating the direction to $(0,1)$ gives $1$. Along the diagonal $u=(1,1)/\sqrt2$, it is $3/\sqrt2$.

<div class="lab" data-lab="projection"></div>

A single projection discards information. Every point on a line perpendicular to $u$ casts the same shadow. Yet many different projections can reveal a cloud's structure. This will become the central trick of SIGReg: study a high-dimensional cloud through inexpensive one-dimensional views.

For a matrix $Z\in\mathbb R^{B\times d}$ whose rows are embeddings, the vector $h=Zu$ contains one shadow per example. It has shape $B$, not $d$. It is those $B$ scalar values that form a sample from a one-dimensional distribution.

<details><summary>Try it first: a completely hidden difference</summary>For $u=(1,0)$, points $(2,1)$ and $(2,100)$ both project to $2$. A projection can look excellent while ignoring a large difference. Randomly changing directions reduces this blind spot; one fixed direction cannot remove it.</details>

<!-- PAGE: I · Describing a world | Distance, angles, and their assumptions -->
## Distance, angles, and their assumptions

The Euclidean squared length is a definition inspired by the Pythagorean theorem:

$$\|z\|^2=z^\top z=\sum_jz_j^2.$$

Thus squared distance is $\|z-w\|^2=\sum_j(z_j-w_j)^2$. Squaring makes each contribution nonnegative. It also penalizes a large error more strongly: doubling an error multiplies its square by four.

For nonzero vectors, cosine similarity is

$$\cos\angle(z,w)=\frac{z^\top w}{\|z\|\|w\|}.$$

Why is the ratio between $-1$ and $1$? Start from $\|z-cw\|^2\geq0$. Expanding and choosing $c=(z^\top w)/\|w\|^2$ gives $(z^\top w)^2\leq\|z\|^2\|w\|^2$. This is the Cauchy–Schwarz inequality. Divide by the positive product of lengths and take square roots.

Distance is a choice of geometry. If the first coordinate is measured in kilometers and the second in millimeters, a raw sum of squares may be meaningless. Likewise, an embedding's Euclidean distance is not automatically physical distance, safety, or task difficulty. The learned representation must make that distance useful.

<details><summary>Try it first: identical direction, different distance</summary>Vectors $(1,0)$ and $(10,0)$ have cosine similarity $1$ but squared distance $81$. Cosine ignores length; squared distance does not. Neither is universally better. They answer different questions.</details>

<!-- PAGE: I · Describing a world | A first checkpoint -->
## A first checkpoint

Let an encoder temporarily be the hand-chosen map $E(x,v)=(2x,v)$. This is not learned and it is not an image encoder. Its simplicity lets us inspect what a representation does to geometry.

For states $s=(1,0)$ and $g=(0,1)$, the physical coordinate distance is $\|s-g\|^2=2$. Their embeddings are $(2,0)$ and $(0,1)$, whose squared distance is $5$. The encoder has made position differences four times as expensive, because $(2\Delta x)^2=4\Delta x^2$.

Now transform every embedding by an orthogonal matrix $Q$, meaning $Q^\top Q=I$. Then

$$\|Qz-Qw\|^2=(z-w)^\top Q^\top Q(z-w)=\|z-w\|^2.$$

Rotations and reflections preserve this cost. A general stretching does not. Later we will see why an isotropic target fixes some geometry while leaving rotations unidentified.

**Put the pieces together.** A world has states. A sensor produces observations. An encoder produces embeddings. A predictor estimates future embeddings. An action changes the world. A cost ranks possible futures. These are six different roles, even when one program computes several of them.

<details><summary>Try it first: can a short representation preserve everything?</summary>Not necessarily. A linear map from $D$ coordinates to $d&lt;D$ has a nontrivial null space: some nonzero differences map to zero. But if the actual data occupy a smaller structured set, many discarded pixel directions may never matter. Useful compression concerns the data and future tasks, not just the raw dimension count.</details>

<!-- PAGE: II · Uncertainty | Random variables are measurements -->
## Random variables are measurements

A random variable assigns a number to a possible outcome. Before an experiment, its value is uncertain; after the experiment, we observe one realization. Uppercase $X$ will denote the variable and lowercase $x$ a possible value.

For a fair die, $P(X=k)=1/6$ for $k=1,\ldots,6$. For a continuously varying position, probabilities are described by a density $p(x)$:

$$P(a\leq X\leq b)=\int_a^bp(x)\,dx.$$

A density is not itself a probability. It can exceed one when concentrated in a narrow interval. The area under the entire curve must equal one. For a uniform variable on $[0,1/2]$, density $2$ has total area $2\cdot(1/2)=1$.

A dataset induces an **empirical distribution**: give each of its $B$ examples probability $1/B$. This is a finite approximation to the process that generated the data, not the process itself.

When we say “embeddings should be Gaussian,” we mean that many observations, passed through the encoder, should produce a cloud with a Gaussian distribution. We do not mean each individual vector is a bell curve. A vector is one point; a distribution describes how points occur.

<details><summary>Try it first: where does randomness enter a deterministic encoder?</summary>In its input. If observations $O$ vary randomly, then $Z=E(O)$ is random even when $E$ is deterministic. This induced distribution is sometimes called the pushforward distribution. The encoder reshapes a cloud; it need not inject noise.</details>

<!-- PAGE: II · Uncertainty | Expectation is a weighted average -->
## Expectation is a weighted average

The expectation of a discrete random variable is

$$\mathbb E[X]=\sum_x xP(X=x).$$

Imagine repeating an experiment many times. Values occurring more often contribute more heavily to the average. For a continuous variable, replace the sum with an integral: $\mathbb E[X]=\int xp(x)\,dx$, whenever it exists.

Linearity follows by distributing multiplication over addition:

$$\mathbb E[aX+bY]=a\mathbb E[X]+b\mathbb E[Y].$$

This does not require independence. Independence matters when factoring products: if $X$ and $Y$ are independent, their joint probabilities factor, and summing gives $\mathbb E[XY]=\mathbb E[X]\mathbb E[Y]$.

An empirical expectation is a sample average, $\bar x=B^{-1}\sum_bx_b$. With independent identically distributed samples and finite variance $\sigma^2$, it has expectation $\mu$ and variance $\sigma^2/B$. To derive the latter, expand the square of $B^{-1}\sum_b(X_b-\mu)$. The $B$ diagonal terms each contribute $\sigma^2$; the cross terms vanish by independence and zero means.

This explains a practical limit: four times as many independent samples halve the standard deviation of the mean. Four repeated copies of each sample do not. Correlated video frames are not interchangeable with independent trajectories.

<details><summary>Try it first: an expectation nobody observes</summary>A fair die has mean $(1+2+3+4+5+6)/6=3.5$. No roll equals $3.5$. A mean is a summary, not necessarily a possible outcome. This is why predicting an average future can produce an impossible-looking future.</details>

<!-- PAGE: II · Uncertainty | Variance measures spread -->
## Variance measures spread

Let $\mu=\mathbb E[X]$. Variance is the mean squared distance from the mean:

$$\operatorname{Var}(X)=\mathbb E[(X-\mu)^2]
=\mathbb E[X^2]-\mu^2.$$

The second equality follows by expanding the square: $\mathbb E[X^2]-2\mu\mathbb E[X]+\mu^2=\mathbb E[X^2]-\mu^2$. Standard deviation is its square root, restoring the original units.

For independent samples, why does the usual sample variance divide by $B-1$? The identity

$$\sum_b(X_b-\bar X)^2=\sum_b(X_b-\mu)^2-B(\bar X-\mu)^2$$

follows by expanding $X_b-\bar X=(X_b-\mu)-(\bar X-\mu)$ and using $\sum_b(X_b-\mu)=B(\bar X-\mu)$. Taking expectations yields $B\sigma^2-B(\sigma^2/B)=(B-1)\sigma^2$. Thus dividing by $B-1$ produces an unbiased estimator.

Dividing by $B$ is still a legitimate definition of the empirical distribution's variance. The two quantities answer slightly different questions. Code must choose one consistently.

For a collapsed representation, every example has the same feature value. Its variance is zero. A variance penalty therefore detects one important failure mode without understanding what any feature means.

<details><summary>Try it first: two observations</summary>For $1$ and $3$, the mean is $2$, and squared deviations sum to $2$. Empirical variance is $1$; unbiased sample variance is $2$. Neither calculation is an arithmetic error. Their denominators reflect different statistical purposes.</details>

<!-- PAGE: II · Uncertainty | Covariance detects shared movement -->
## Covariance detects shared movement

Covariance measures whether two centered variables move together:

$$\operatorname{Cov}(X,Y)=\mathbb E[(X-\mu_X)(Y-\mu_Y)].$$

Positive products occur when both are above their means or both below. Negative products occur when they move in opposite directions. For a vector $Z$, gather every coordinate pair into $\Sigma$, where $\Sigma_{ij}=\operatorname{Cov}(Z_i,Z_j)$. The diagonal contains variances.

For any vector $u$, expanding the square proves

$$\operatorname{Var}(u^\top Z)=u^\top\Sigma u.$$

Indeed, $\mathbb E[(\sum_i u_i(Z_i-\mu_i))^2]=\sum_{ij}u_iu_j\Sigma_{ij}$. A covariance matrix is therefore positive semidefinite: this quadratic form cannot be negative.

For centered data matrix $Z_c$, sample covariance is $Z_c^\top Z_c/(B-1)$. Matrix multiplication performs all the pairwise sums at once.

**Uncorrelated does not mean independent.** Let $X$ be equally likely to be $-1,0,1$, and set $Y=X^2$. Symmetry gives $\mathbb E[XY]=\mathbb E[X^3]=0$ and $\mathbb E[X]=0$, so covariance is zero. Yet observing $X$ determines $Y$ exactly. Covariance sees linear relationships, not every relationship.

<details><summary>Try it first: duplicated features</summary>If $Z=(X,X)$ with variance one, then $\Sigma=\begin{bmatrix}1&1\\1&1\end{bmatrix}$. Both coordinates vary, but the cloud lies on one line. The direction $(1,-1)/\sqrt2$ has zero projected variance. Coordinate-wise spread alone does not prevent dimensional collapse.</details>

<!-- PAGE: II · Uncertainty | Conditioning means changing the question -->
## Conditioning means changing the question

$P(Y=y\mid X=x)$ means the probability of $Y=y$ after restricting attention to cases with $X=x$. For discrete events with $P(X=x)>0$,

$$P(Y=y\mid X=x)=\frac{P(X=x,Y=y)}{P(X=x)}.$$

The denominator renormalizes the selected cases so their probabilities sum to one. For continuous variables, densities take the place of probabilities of individual points.

The conditional expectation $\mathbb E[Y\mid X=x]$ averages $Y$ within that restricted population. A predictor learns a rule from available context to an estimated future. If the context is incomplete, several futures may remain possible even with unlimited training data.

The law of total expectation says $\mathbb E[\mathbb E[Y\mid X]]=\mathbb E[Y]$. In a discrete setting, substitute the definition and cancel $P(X=x)$:

$$\sum_xP(x)\sum_y y\frac{P(x,y)}{P(x)}=\sum_y yP(y).$$

This rule lets us analyze squared-error prediction one context at a time and then average over contexts.

**Association is not intervention.** A recorded action may correlate with unobserved information available to the data-collection policy. To interpret a predictor as answering “what if I choose this action?”, we need adequate state information and relevant action coverage. Merely putting an action into a neural network does not solve hidden confounding.

<details><summary>Try it first: the missing velocity</summary>If a frame is compatible with velocities $+1$ and $-1$ equally often, conditional mean velocity is zero. More training examples do not resolve the ambiguity. Adding a previous frame may change the conditioning information and make the future predictable.</details>

<!-- PAGE: II · Uncertainty | Likelihood is a score for an explanation -->
## Likelihood is a score for an explanation

Suppose data $D$ are observed and a model has parameters $\theta$. The likelihood $p(D\mid\theta)$ asks how compatible those data are with a particular parameter choice. It is a function of $\theta$ with the data held fixed.

Bayes' rule is obtained by writing the same joint probability two ways:

$$p(\theta,D)=p(D\mid\theta)p(\theta)=p(\theta\mid D)p(D).$$

Dividing by $p(D)$ gives $p(\theta\mid D)=p(D\mid\theta)p(\theta)/p(D)$. The prior $p(\theta)$ expresses beliefs before observing $D$; the posterior expresses beliefs after.

For independent observations, likelihoods multiply. Taking logarithms turns the product into a sum. Because logarithm is increasing, maximizing likelihood and maximizing log-likelihood give the same parameter choice.

If residuals $y_i-f_\theta(x_i)$ are independent Gaussians of fixed variance $\sigma^2$, then the negative log-likelihood, apart from constants, is

$$-\log p(D\mid\theta)=\frac1{2\sigma^2}\sum_i(y_i-f_\theta(x_i))^2+\text{constant}.$$

We will derive the Gaussian density next. This calculation motivates squared error under a noise model. It does not mean every squared-error neural network supplies calibrated probabilities. LeWM uses an embedding discrepancy; it does not specify a complete density over future images.

<details><summary>Try it first: a common reversal</summary>A high likelihood $p(D\mid\theta)$ is not itself a high posterior $p(\theta\mid D)$. The posterior also depends on the prior and on alternative explanations. Confusing the two swaps the condition and the event.</details>

<!-- PAGE: II · Uncertainty | Why a Gaussian has that constant -->
## Why a Gaussian has that constant

A bell-shaped function $e^{-x^2/2}$ is positive and decays toward zero. To turn it into a density, divide by its total area. Let $I=\int_{-\infty}^{\infty}e^{-x^2/2}\,dx$. Square the integral and regard it as area over the plane:

$$I^2=\int_{\mathbb R^2}e^{-(x^2+y^2)/2}\,dx\,dy.$$

Switch to polar coordinates, $x=r\cos\theta$, $y=r\sin\theta$. A tiny polar tile has area approximately $dr\cdot r\,d\theta$, explaining the factor $r$:

$$I^2=\int_0^{2\pi}\int_0^\infty e^{-r^2/2}r\,dr\,d\theta=2\pi.$$

The inner integral is $1$, using $u=r^2/2$, $du=r\,dr$. Since $I>0$, $I=\sqrt{2\pi}$. Thus a standard Gaussian $G\sim\mathcal N(0,1)$ has density

$$p_G(x)=\frac1{\sqrt{2\pi}}e^{-x^2/2}.$$

For $X=\mu+\sigma G$ with $\sigma>0$, an interval $dx$ corresponds to $dg=dx/\sigma$. Probability is preserved, giving $p_X(x)=\sigma^{-1}p_G((x-\mu)/\sigma)$. This derives both the shifted exponent and the factor $1/\sigma$.

**Assumptions behind the calculation:** we interchange nonnegative integrals and use the change-of-variables rule from multivariable calculus. The polar area argument explains that rule in this particular case; a general measure-theoretic treatment lies beyond this book.

<details><summary>Try it first: why must a wider bell be shorter?</summary>Doubling $\sigma$ doubles every horizontal interval. To preserve total area one, the density height must halve. Leaving out $1/\sigma$ would produce a function with the wrong total probability.</details>

<!-- PAGE: II · Uncertainty | Moments of the bell -->
## Moments of the bell

Symmetry immediately gives $\mathbb E[G]=0$: the contributions from $x$ and $-x$ cancel. To compute the variance, notice that $p_G'(x)=-xp_G(x)$. Integration by parts gives

$$\mathbb E[G^2]=-\int x p_G'(x)\,dx
=-[xp_G(x)]_{-\infty}^{\infty}+\int p_G(x)\,dx=1.$$

The boundary term vanishes because exponential decay beats linear growth. We have now justified the “0” and “1” in $\mathcal N(0,1)$ rather than merely naming them.

More generally, for integer $k\geq2$,

$$\mathbb E[G^k]=(k-1)\mathbb E[G^{k-2}].$$

Derive it by replacing $x$ with $x^{k-1}$ in the same integration-by-parts calculation. Hence $\mathbb E[G^4]=3\mathbb E[G^2]=3$. Odd moments vanish by symmetry.

A distribution can share a Gaussian's mean and variance without sharing its shape. A fair random sign $S\in\{-1,+1\}$ has mean zero and variance one, but fourth moment one, not three. Matching two moments is a useful constraint; it is not Gaussianity.

Likewise, a bell-shaped histogram from a small sample is evidence, not proof. Bins and sample size can hide important differences. We will need a more systematic comparison before a normality test can guide an encoder.

<details><summary>Try it first: transform the moments</summary>For $X=\mu+\sigma G$, linearity gives mean $\mu$. Centering gives $X-\mu=\sigma G$, so variance is $\sigma^2\mathbb E[G^2]=\sigma^2$. This derivation does not require integrating the transformed density again.</details>

<!-- PAGE: II · Uncertainty | An isotropic cloud -->
## An isotropic cloud

Take $d$ independent standard Gaussians and arrange them into $G\in\mathbb R^d$. Independence multiplies their densities:

$$p_G(g)=(2\pi)^{-d/2}\exp(-\|g\|^2/2).$$

Its mean is zero and covariance is $I$: each coordinate has variance one, and distinct coordinates have zero covariance by independence. We write $G\sim\mathcal N(0,I)$.

**Isotropic** means the distribution has no preferred direction. If $Q^\top Q=I$, then $\|Qg\|^2=\|g\|^2$. Also $|\det Q|=1$, because taking determinants of $Q^\top Q=I$ gives $(\det Q)^2=1$. Rotation therefore preserves both density and volume. $QG$ has the same distribution as $G$.

A general Gaussian can be made as $Z=\mu+LG$. Its covariance is $LL^\top$, obtained by expanding $\mathbb E[(LG)(LG)^\top]$. A covariance's eigenvectors are directions that it merely stretches; its eigenvalues are the stretch factors. For a symmetric covariance, orthogonal eigenvectors form a coordinate system, and each eigenvalue is a variance along one such direction.

A low eigenvalue signals a nearly unused direction. A zero eigenvalue means the cloud has zero spread in that direction. This is the geometric meaning of dimensional collapse.

<details><summary>Try it first: is a circle Gaussian?</summary>No. A uniform point on a circle is rotationally symmetric but has fixed radius. A Gaussian's radius varies. Isotropy of a covariance, rotational symmetry of a distribution, and Gaussianity are three different properties.</details>

<!-- PAGE: II · Uncertainty | Every Gaussian shadow is Gaussian -->
## Every Gaussian shadow is Gaussian

Let $G\sim\mathcal N(0,I)$ and let $u$ have length one. Choose an orthogonal coordinate system whose first axis is $u$. Such a basis can be constructed by repeatedly subtracting projections from independent vectors and normalizing what remains: the Gram–Schmidt procedure.

In this system the first coordinate is $u^\top G$. Rotational invariance says that the transformed vector is still a standard multivariate Gaussian. Its first coordinate is therefore standard normal:

$$u^\top G\sim\mathcal N(0,1).$$

For arbitrary $v\ne0$, write $v=\|v\|u$. Scaling the previous result gives $v^\top G\sim\mathcal N(0,\|v\|^2)$. For $Z=\mu+LG$,

$$u^\top Z\sim\mathcal N(u^\top\mu,\ u^\top LL^\top u).$$

This establishes one direction of an important story: Gaussian cloud implies Gaussian shadows. The converse requires **all directions**, not merely the coordinate axes. We will prove that statement after introducing characteristic functions.

The computational appeal is already visible. A cloud in hundreds of dimensions is difficult to inspect directly. Its shadow is a list of scalar numbers. If the desired cloud is $\mathcal N(0,I)$, every unit-direction shadow has the same target, $\mathcal N(0,1)$. One scalar comparison routine can be reused in every direction.

<details><summary>Try it first: why normalize directions?</summary>If $\|u\|=2$, even a perfect isotropic Gaussian produces projected variance $4$. Comparing that projection to variance one would penalize the correct cloud. Normalizing directions ensures that differences come from the embeddings, not arbitrary projection length.</details>

<!-- PAGE: III · Learning | Derivatives measure sensitivity -->
## Derivatives measure sensitivity

A derivative measures the local change in output per change in input:

$$f'(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}h.$$

For $f(x)=x^2$, expand $(x+h)^2=x^2+2xh+h^2$. Dividing the difference by $h$ gives $2x+h$, which tends to $2x$. The derivative is $2x$.

The practical interpretation is $f(x+h)\approx f(x)+f'(x)h$ for small $h$. A derivative is a local linear approximation, not a guarantee about large steps.

For a composition $y=f(g(x))$, small changes obey $\Delta g\approx g'(x)\Delta x$ and $\Delta y\approx f'(g(x))\Delta g$. Combining these and taking the limit gives the chain rule:

$$\frac{dy}{dx}=f'(g(x))g'(x).$$

For multiple inputs, a partial derivative varies one coordinate while holding the others fixed. The gradient collects these sensitivities into a vector, $\nabla f=(\partial f/\partial x_1,\ldots,\partial f/\partial x_d)$.

A Jacobian collects the partial derivatives of a vector-valued function: $J_{ij}=\partial y_i/\partial x_j$. The first-order change is $\Delta y\approx J\Delta x$. Backpropagation will apply this rule repeatedly, keeping track of which intermediate quantities affect the final loss.

<details><summary>Try it first: a nested computation</summary>If $y=(3x+1)^2$, set $g=3x+1$. Then $dy/dg=2g$ and $dg/dx=3$, so $dy/dx=6(3x+1)$. Expanding the square and differentiating gives $18x+6$, the same answer. The chain rule saves expansion in a large network.</details>

<!-- PAGE: III · Learning | Walking downhill -->
## Walking downhill

Suppose a model has adjustable parameters $\theta$ and loss $L(\theta)$. The first-order approximation is

$$L(\theta+\delta)\approx L(\theta)+\nabla L(\theta)^\top\delta.$$

Choose $\delta=-\eta\nabla L$ with learning rate $\eta>0$. The predicted change is $-\eta\|\nabla L\|^2$, which is nonpositive. This motivates gradient descent:

$$\theta_{k+1}=\theta_k-\eta\nabla L(\theta_k).$$

The argument is local. If $\eta$ is too large, the neglected curvature can reverse the predicted improvement. For $L(\theta)=\theta^2$, the update is $\theta_{k+1}=(1-2\eta)\theta_k$. Its magnitude shrinks exactly when $|1-2\eta|<1$, or $0<\eta<1$.

A stationary point has zero gradient. It can be a minimum, maximum, or saddle. Neural network training does not come with a general guarantee that gradient descent finds the best possible representation.

A **parameter** is adjusted by the optimizer. A **hyperparameter** controls the procedure, such as learning rate or loss weight. Saying a method has one principal loss hyperparameter does not remove all its other design choices.

<details><summary>Try it first: overshooting</summary>Start at $\theta=1$. With $\eta=0.25$, the next value is $0.5$ and loss falls from $1$ to $0.25$. With $\eta=1.2$, it becomes $-1.4$ and loss rises to $1.96$. A direction can be downhill locally while the chosen step is harmful.</details>

<!-- PAGE: III · Learning | Fitting a line, completely -->
## Fitting a line, completely

Take examples $(x_i,y_i)$ and predict $\hat y_i=wx_i$. Define the mean squared error

$$L(w)=\frac1B\sum_i(wx_i-y_i)^2.$$

Differentiate each term using the chain rule:

$$L'(w)=\frac2B\sum_i x_i(wx_i-y_i).$$

Set the derivative to zero and collect terms:

$$w\sum_i x_i^2=\sum_i x_iy_i,
\qquad w^*=\frac{\sum_i x_iy_i}{\sum_i x_i^2}.$$

The denominator must be nonzero. If every $x_i=0$, the data contain no information about $w$. When the denominator is positive, the second derivative is $2\sum_i x_i^2/B>0$, proving this stationary point is the unique minimum.

For $(x,y)=(1,2),(2,3)$, we obtain $w^*=8/5=1.6$. Predictions are $1.6$ and $3.2$; errors are $-0.4$ and $0.2$; MSE is $(0.16+0.04)/2=0.1$.

A neural network replaces the simple formula $wx$ with a more flexible one. The basic structure remains: choose a family of functions, choose a discrepancy, and adjust parameters. A loss function tells the optimizer what counts as success; it cannot know whether that definition matches our intention.

<details><summary>Try it first: add an intercept</summary>For $wx+b$, the derivative with respect to $b$ gives $\sum_i(wx_i+b-y_i)=0$, hence $b=\bar y-w\bar x$. Substitute this into the derivative for $w$ to obtain $w=\sum_i(x_i-\bar x)(y_i-\bar y)/\sum_i(x_i-\bar x)^2$. Centering removes the intercept.</details>

<!-- PAGE: III · Learning | Why squared error predicts the average -->
## Why squared error predicts the average

Fix the available context $c$. Let $Y$ be the uncertain target and $m=\mathbb E[Y\mid c]$. Any deterministic prediction $q$ has conditional squared error

$$\mathbb E[(Y-q)^2\mid c]
=\mathbb E[(Y-m)^2\mid c]+(m-q)^2.$$

To prove it, write $Y-q=(Y-m)+(m-q)$ and expand the square. The cross term is $2(m-q)\mathbb E[Y-m\mid c]=0$. The first term does not depend on $q$, while the second is minimized at $q=m$.

The vector version follows by summing this identity over coordinates. Thus mean squared error learns a conditional mean, assuming sufficient model capacity and successful population optimization.

<div class="lab" data-lab="mean"></div>

If two equally likely futures place an object at $-1$ and $+1$, the best squared-error prediction is $0$, even if the object never appears there. In pixel space that averaging can produce blur. Predicting embeddings can discard irrelevant uncertainty, but it does not magically remove ambiguity about important futures.

A deterministic latent predictor may still average incompatible states. Alternatives include additional history, a stochastic latent variable, or multiple hypotheses. Which is appropriate depends on what causes the uncertainty.

<details><summary>Try it first: unequal futures</summary>If $Y=-1$ with probability $p$ and $Y=1$ otherwise, the optimal prediction is $1-2p$. The irreducible error is $1-(1-2p)^2=4p(1-p)$. More data cannot reduce it while the information in the context stays unchanged.</details>

<!-- PAGE: III · Learning | Regularization means expressing a preference -->
## Regularization means expressing a preference

Several models may fit the observations similarly while behaving differently elsewhere. Regularization adds a preference among them:

$$L_{\mathrm{total}}(\theta)=L_{\mathrm{fit}}(\theta)+\lambda R(\theta),\quad\lambda\geq0.$$

This is a definition of a training objective, not a theorem. Imagine selecting a route by travel time plus a toll penalty. Changing the exchange rate between minutes and money changes the preferred route. Likewise, $\lambda$ controls how much fit we trade for the regularizer's preference.

For the line-fitting example, choose $R(w)=w^2$ and use an unaveraged squared-error sum. The derivative becomes $2\sum_i x_i(wx_i-y_i)+2\lambda w$. Solving gives

$$w^*_{\mathrm{ridge}}=\frac{\sum_i x_iy_i}{\sum_i x_i^2+\lambda}.$$

Compared with ordinary least squares, the larger denominator shrinks $w$ toward zero. This can reduce sensitivity to noisy observations, at the cost of bias. It also shows why loss reductions matter: averaging the fitting term but not the penalty changes the effective $\lambda$ by a factor of $B$.

SIGReg regularizes **the distribution of outputs**, not simply the magnitude of weights. Its preference is a spread-out Gaussian embedding cloud. Weight decay and distribution matching can both be called regularization, while solving different problems.

<details><summary>Try it first: the wrong penalty for collapse</summary>If the problem is that all embeddings become zero, adding $\sum_b\|z_b\|^2$ rewards that collapse even more. A regularizer is not automatically helpful. Its preferred solutions must oppose the actual failure mode.</details>

<!-- PAGE: III · Learning | Bias, variance, and generalization -->
## Bias, variance, and generalization

Let a training dataset $D$ produce predictor $\hat f_D(x)$. Suppose a new target is $Y=f(x)+\varepsilon$, with mean-zero independent noise of variance $\sigma^2$. Let $m(x)=\mathbb E_D[\hat f_D(x)]$.

Add and subtract $m$ inside the prediction error, expand the square, and use the zero means of $\hat f_D-m$ and $\varepsilon$. The cross terms disappear:

$$\mathbb E[(Y-\hat f_D)^2]
=(f-m)^2+\mathbb E_D[(\hat f_D-m)^2]+\sigma^2.$$

The three terms are squared bias, variance across training sets, and irreducible noise. The decomposition is exact under the assumptions just stated. It does not say that all modern models follow a simple monotone bias–variance curve as their size changes.

Training error measures fit to reused examples. Generalization concerns fresh examples from a specified distribution. A model can memorize training trajectories, retain large embedding variance, and still fail on new trajectories. Anti-collapse is necessary for useful distinctions; it is not enough for generalization.

A validation set helps choose hyperparameters. A test set estimates final performance after those choices are fixed. Repeatedly choosing changes based on the test set gradually turns it into a validation set.

<details><summary>Try it first: two kinds of instability</summary>Different predictions under different training samples contribute to statistical variance. Different results under different initialization seeds with the same sample reflect optimization randomness. Both matter, but they are not the same experimental variable. Report which one was varied.</details>

<!-- PAGE: III · Learning | Neural networks as compositions -->
## Neural networks as compositions

A simple network is

$$h=\rho(W_1x+b_1),\qquad f_\theta(x)=W_2h+b_2.$$

Here $\rho$ acts separately on coordinates. For ReLU, $\rho(r)=\max(0,r)$. Its derivative is $0$ below zero and $1$ above; at zero we choose a subgradient convention. Nonlinearity lets the model use different linear recipes in different input regions.

A hidden unit can detect a condition such as “position is above a threshold.” Combining many such conditions builds a flexible function. This is a mathematical model of computation, not a claim that the unit corresponds to a human concept.

An **encoder** is a network used to turn observations into representations. A **predictor** is a network used to estimate another quantity from those representations. The same architecture can serve different roles depending on what we ask it to learn.

Other activations smooth the transition. The exact GELU is defined as $\operatorname{GELU}(x)=x\Phi(x)$, where $\Phi(x)=P(G\leq x)$ for a standard Gaussian. Product differentiation gives $\operatorname{GELU}'(x)=\Phi(x)+xp_G(x)$. It gates a value according to how far it lies above or below zero.

<details><summary>Try it first: count the parameters</summary>A dense layer from $D$ inputs to $K$ outputs has $DK$ weights and $K$ biases. A $4\to8\to2$ network therefore has $4\cdot8+8+8\cdot2+2=58$ parameters. Parameter count measures storage, but runtime also depends on the number of examples and repeated uses.</details>

<!-- PAGE: III · Learning | Backpropagation through both branches -->
## Backpropagation through both branches

Let $z=E_\theta(o)$, $y=E_\theta(o')$, and $\hat y=P_\phi(z,a)$. For the squared prediction loss $L=\|\hat y-y\|^2$, define $r=\hat y-y$.

The differential of a squared norm is $dL=2r^\top dr$. Because $dr=d\hat y-dy$, the shared encoder receives two contributions:

$$\nabla_\theta L
=2(J_{\hat y,\theta}-J_{y,\theta})^\top r.$$

The prediction branch Jacobian itself contains a composition: $J_{\hat y,\theta}=J_{P,z}J_{E(o),\theta}$. The target branch contributes $-J_{E(o'),\theta}$. Both routes change the same parameter vector $\theta$.

This is why learning a target differs from fitting fixed labels. The system can lower loss by improving its forecast, changing its representation of the future, or both. The second option creates the collapse loophole.

A **stop-gradient** operation keeps a value in the forward calculation but defines its derivative as zero. Applying it to $y$ removes the target-branch contribution. This changes the update rule even though the displayed scalar loss can have the same value. LeWM does not detach that branch.

<details><summary>Try it first: a scalar shared encoder</summary>Take $E_\theta(o)=\theta o$ and $P(z)=z$. Then $L=\theta^2(o-o')^2$, so $dL/d\theta=2\theta(o-o')^2$. For varying consecutive observations, decreasing $\theta$ toward zero improves prediction loss by erasing both observations. The derivative exposes the shortcut directly.</details>

<!-- PAGE: III · Learning | Minibatches and adaptive steps -->
## Minibatches and adaptive steps

For an additive empirical loss $L=N^{-1}\sum_i\ell_i$, the gradient of a uniformly sampled minibatch average is an unbiased estimate of $\nabla L$. Linearity of expectation proves this by giving each example equal expected weight. This is stochastic gradient descent, or SGD.

Momentum averages recent gradients: $m_k=\beta m_{k-1}+(1-\beta)g_k$. Expanding the recursion shows exponentially decaying weights on older gradients. If initialized at zero and the gradient has constant mean $g$, then $\mathbb E[m_k]=(1-\beta^k)g$. Dividing by $1-\beta^k$ corrects this initialization bias.

Adam applies that correction to both a first-moment estimate and an elementwise squared-gradient estimate:

$$m_k=\beta_1m_{k-1}+(1-\beta_1)g_k,$$
$$v_k=\beta_2v_{k-1}+(1-\beta_2)g_k^2,\qquad
\theta_{k+1}=\theta_k-\eta\frac{\hat m_k}{\sqrt{\hat v_k}+\epsilon}.$$

Squares, division, and roots here are coordinate-wise. The update is an algorithmic choice, not an exact solution to the training problem. $\epsilon>0$ avoids division by zero.

A batch-level distribution statistic such as SIGReg is not a sum of independent per-example losses. Averaging statistics from several small batches generally differs from computing one statistic on their union. Accumulating gradients does not automatically reconstruct the large-batch objective.

<details><summary>Try it first: an exponential memory</summary>With $\beta=0.9$, a gradient's relative contribution after ten more steps is multiplied by $0.9^{10}\approx0.35$. Momentum remembers recent directions gradually; it does not keep a fixed ten-step window.</details>

<!-- PAGE: III · Learning | The dataset is part of the model -->
## The dataset is part of the model

Suppose every training trajectory pushes the puck right. A network can fit those transitions perfectly while responding arbitrarily to a leftward action. The training loss has never asked it to distinguish those possibilities.

Offline learning means the data are fixed before training. Reward-free means no task-reward labels are used to train the world model. Neither means that the data are free of human choices, purposeful behavior, or task structure. A collection policy can be expert-like even when its rewards are not included in the saved examples.

Split by complete trajectories, collection sessions, or independent environment seeds. Splitting neighboring frames randomly can put nearly identical images on both sides of the boundary. That estimates interpolation between adjacent frames rather than generalization to new episodes.

Keep three questions separate. Can the model predict held-out trajectories? Can a planner use it to reach goals? Can it handle changed mechanics or appearances? Each requires its own evaluation distribution.

For action alignment, the pair $(o_t,a_t,o_{t+1})$ means the action was applied **between** those observations. If frames are skipped, the action input may be a block of several actions. Accidentally shifting an action by one index can create a model that appears to learn but predicts the wrong causal transition.

<details><summary>Try it first: a leakage audit</summary>A simulator supplies true velocity. If you use it only to evaluate a frozen representation, it is a probe label. If you feed it to the encoder, predictor, training target, or planner without disclosure, you have changed the pixels-only task. Label every channel by its role before interpreting the result.</details>

<!-- PAGE: IV · Learning what to remember | An embedding is a learned description -->
## An embedding is a learned description

An embedding is a vector used to represent an object, observation, or context. Here it is $\lat=E_\theta(\obs)\in\mathbb R^d$. The word does not guarantee that the map is invertible, distance-preserving, meaningful, or low-dimensional. Those are separate properties to investigate.

Think of a train map. It preserves connections useful for travel while distorting geographic distances. It succeeds because its distortions suit a purpose. A world-model embedding should preserve distinctions needed for prediction and control, even if it discards unpredictable texture.

A representation is **invariant** to a transformation $T$ when $E(T(o))=E(o)$. It is **equivariant** when the representation changes by a corresponding rule, $E(T(o))=S(E(o))$. Ignoring object color might be helpful for a shape task; ignoring object position would be disastrous for navigation.

For an ideal controlled state abstraction, states mapped to the same representation should have compatible future represented transitions under relevant actions. Otherwise the predictor is asked to assign different next states to the same input. A short vector alone does not guarantee this consistency.

A downstream task is one introduced after representation learning. “Task-agnostic” training does not ensure optimality for every imaginable downstream task. Information discarded during pretraining cannot be recovered from the embedding by a clever readout.

<details><summary>Try it first: a bad invariant</summary>Making an encoder invariant to horizontal translation can help recognize an object regardless of location. But if the controller must move it to a particular coordinate, that invariance can erase the very quantity the goal requires. Useful invariance is always relative to a task family.</details>

<!-- PAGE: IV · Learning what to remember | Predicting pictures and predicting descriptions -->
## Predicting pictures and predicting descriptions

A reconstructive model learns a decoder $D$ and tries to recover an observation from its code: $\hat o=D(E(o))$. A pixel predictor estimates a future image, possibly using a probability distribution or a stochastic generator.

A JEPA instead compares a predicted representation to a representation of the target. For a temporal action-conditioned example,

$$\pred_{t+1}=P_\phi(\lat_t,\act_t),\qquad
\lat_{t+1}=E_\theta(\obs_{t+1}).$$

The learning signal can be $\|\pred_{t+1}-\lat_{t+1}\|^2$. It need not reconstruct the wallpaper to learn how an object moves. But because the target representation is learned too, the system must be constrained against erasing everything.

A generative model can also use latent states internally, and a JEPA can later be paired with a decoder for inspection. The distinction concerns the training objective and use of predictions, not whether a vector ever appears inside the program.

If a separately trained decoder produces plausible images from frozen embeddings, that reveals recoverable visual information. It does not mean image reconstruction trained the world model. Conversely, a decoder may invent plausible details not faithfully contained in each prediction.

**Our recurring question:** what information must remain so that a different goal tomorrow can reuse the same world knowledge? This motivates reward-free predictive representations, while leaving their adequacy an empirical question.

<details><summary>Try it first: prediction without rendering</summary>A planner can compare predicted and desired embeddings directly. It needs no image decoder if the latent cost ranks candidate futures usefully. A human may still want a decoder to inspect the plan; that is a display requirement, not a mathematical requirement for planning.</details>

<!-- PAGE: IV · Learning what to remember | Energy measures compatibility -->
## Energy measures compatibility

An energy function assigns a scalar compatibility score, usually with lower values meaning a better match. A simple conditional energy is

$$F(o,a,o')=\|P(E(o),a)-E(o')\|^2.$$

It asks whether the second observation agrees with the predicted consequence of the first observation and action. This “energy” is not measured in joules. It is a machine-learning score.

One can sometimes turn an energy into a probability density by defining

$$p(y\mid x)=\frac{e^{-F(x,y)/\tau}}{\int e^{-F(x,u)/\tau}\,du},\quad\tau>0.$$

The denominator normalizes total probability to one, if the integral is finite. The temperature $\tau$ controls concentration. Adding a function of $x$ alone to the energy leaves the density unchanged because the common exponential factor cancels.

JEPA training need not compute this normalization or specify a density over observations. An energy-based viewpoint is broader than maximum likelihood. It can focus on compatibility while avoiding the cost of normalizing over all possible targets.

That freedom creates a design question: what stops the energy from being low everywhere? Contrastive approaches raise energy for incompatible pairs. Regularized approaches restrict the representation so that all inputs cannot become identical. LeWM belongs to the latter route.

<details><summary>Try it first: an invalid density</summary>If $F(x,y)=0$ for every real $y$, the normalization integral is infinite. The energy is a well-defined score but does not define a probability density on the real line through this formula. A useful energy and a normalized probability model are different claims.</details>

<!-- PAGE: IV · Learning what to remember | LeCun's larger program -->
## LeCun's larger program

LeCun's 2022 position paper proposes an architecture for autonomous intelligence in which perception, predictive world models, objectives, memory, and action selection play distinct roles. Its central invitation is to learn enough about how the world changes to evaluate actions before executing them. It also proposes abstraction across multiple time scales. [LeCun 2022, §§2–4](https://openreview.net/forum?id=BZ5a1r-kVsf)

A useful analogy is planning a journey. At one level you choose a destination city; at another, a road; at another, a steering adjustment. A single model operating at millisecond resolution may be a poor tool for deciding a journey lasting hours.

This is a research program, not a claim that every JEPA already implements a complete autonomous agent. LeWM instantiates a narrower problem: learning compact, action-conditioned latent dynamics and using them for finite-horizon control. It does not implement all the memory, intrinsic-objective, or hierarchical machinery envisioned in the position paper.

The separation between **knowledge** and **preference** is especially useful. A dynamics model estimates what an action will do. A cost says whether that consequence is desirable. Changing the goal need not require relearning the mechanics, provided the representation retained the necessary information.

<details><summary>Try it first: change the goal or change the world?</summary>Asking the same puck to reach a different location changes the objective. Replacing its surface with a much rougher material changes the dynamics. A frozen model may handle the new goal immediately but need new data for the new friction. These are different kinds of generalization.</details>

<!-- PAGE: IV · Learning what to remember | Perfect prediction, no knowledge -->
## Perfect prediction, no knowledge

Consider the joint objective containing only prediction error:

$$L_{\mathrm{pred}}=\mathbb E\|P_\phi(E_\theta(O),A)-E_\theta(O')\|^2.$$

Choose an encoder that returns the same constant $c$ for every observation, and a predictor that always returns $c$. Every difference is zero. Since squared error cannot be negative, this achieves a global minimum.

We have proved the existence of a useless optimal solution. We have not proved that every training run converges to it. Architecture, initialization, optimization, and data can affect which solution is reached. Nevertheless, an objective that rewards this solution needs additional structure.

<div class="lab" data-lab="collapse"></div>

This experiment scales a fixed synthetic embedding cloud. Predictions have a fixed relative error, so shrinking the cloud reduces their absolute error quadratically. It demonstrates the loophole algebraically; it is not a claim about the trajectory of a trained transformer.

The issue is deeper than a numerical inconvenience. If two physically different states share the same representation, a planner cannot distinguish them using that representation. Excellent prediction loss can coincide with complete loss of control-relevant knowledge.

<details><summary>Try it first: does adding noise solve it?</summary>Random outputs may have nonzero variance, but independent noise is hard to predict and may carry no useful state information. We need representations that both preserve distinctions and support prediction. Spread alone is not the desired outcome.</details>

<!-- PAGE: IV · Learning what to remember | Collapse can hide inside a large vector -->
## Collapse can hide inside a large vector

An encoder can output hundreds of varying coordinates that are all copies of one number. It avoids complete collapse, but uses only one direction of its available space. This is dimensional collapse.

For $Z=(X,X)$ with $\operatorname{Var}(X)=1$, the covariance matrix is

$$\Sigma=\begin{bmatrix}1&1\\1&1\end{bmatrix}.$$

Multiplying it by $(1,1)$ gives $2(1,1)$; multiplying by $(1,-1)$ gives zero. Its eigenvalues are $2$ and $0$. Coordinate-wise variances are both one, yet one entire direction has no variation.

The trace, $\operatorname{tr}\Sigma=\sum_i\Sigma_{ii}$, sums variances and equals the sum of eigenvalues. Here it is two, the same as an isotropic two-dimensional cloud. Total variance alone cannot distinguish “two useful directions” from “one direction with twice the variance.”

A full covariance constraint can address this second-order failure. It still does not ensure Gaussian shape or semantic usefulness. The distribution might lie on a nonlinear curve while having full-rank covariance.

This motivates a ladder of increasingly demanding checks: are all examples identical; are features redundant linearly; does the whole cloud match a chosen distribution; does the representation support useful predictions and actions? Passing an earlier check does not imply passing the later ones.

<details><summary>Try it first: a curved counterexample</summary>Take $Z=(X,X^2)$ for a symmetric, nondegenerate continuous $X$. Its covariance can be diagonal with positive entries, yet every point lies on a parabola. Linear rank sees two varying directions; the underlying data still depend on one scalar.</details>

<!-- PAGE: IV · Learning what to remember | One answer: compare against alternatives -->
## One answer: compare against alternatives

Suppose an anchor embedding $z$ should match a positive example $z^+$ and differ from candidates $z_j$. Define similarity scores $s_j=z^\top z_j/\tau$. Turn them into probabilities with softmax:

$$p_j=\frac{e^{s_j}}{\sum_k e^{s_k}},\qquad L=-\log p_+.$$

This is a modeling choice: training becomes a classification problem in which the correct answer is the positive match. The logarithm punishes assigning it little probability.

If all $K$ candidates have the same representation, each has probability $1/K$, so the loss is $\log K$. When the system can make the positive score exceed the others, its loss can be smaller. Complete collapse is therefore not a globally best solution in a separable setting, although it can still be a stationary configuration in some parameterizations.

Differentiating $L=-s_++\log\sum_j e^{s_j}$ gives $\partial L/\partial s_j=p_j-\mathbf1(j=+)$. The positive score is pushed up; other scores are pushed down in proportion to their assigned probabilities.

Negative examples are not automatically semantically negative. Two images of the same object can occur as different batch members. Choosing comparisons shapes what invariances the representation learns. LeWM's Gaussian regularization takes another route: it controls the overall cloud without labeling each other example an incompatible target.

<details><summary>Try it first: temperature</summary>As $\tau$ decreases, score differences are magnified and softmax concentrates more strongly on the largest dot product. This can sharpen discrimination but also change gradient behavior. Temperature is a modeling and optimization choice, not merely a display setting.</details>

<!-- PAGE: IV · Learning what to remember | Another answer: a slowly moving teacher -->
## Another answer: a slowly moving teacher

A target encoder can be updated by an exponential moving average of an online encoder:

$$\bar\theta_{k+1}=\beta\bar\theta_k+(1-\beta)\theta_k.$$

A typical target is $\operatorname{sg}(E_{\bar\theta}(o'))$, where $\operatorname{sg}$ denotes stop-gradient. The online branch learns to match a target whose parameters move more slowly.

Expanding the update shows why it smooths changes:

$$\bar\theta_k=\beta^k\bar\theta_0
+(1-\beta)\sum_{j=0}^{k-1}\beta^{k-1-j}\theta_j.$$

Older online parameters receive geometrically smaller weights. For $\beta$ near one, the target changes gradually. However, because a neural network is nonlinear in its weights, averaging weights is not generally identical to averaging its predictions.

Such teacher–student recipes can work well. Neither the existence of an EMA nor a detached target is by itself a universal anti-collapse theorem. Their behavior depends on the other pieces of training. Moreover, the two coupled update rules are not simply gradient descent on the displayed instantaneous scalar loss with respect to all parameters.

LeWM's alternative is to retain ordinary gradients through both branches and explicitly penalize a collapsed distribution. This makes the objective easier to inspect algebraically, while leaving optimization and generalization questions open.

<details><summary>Try it first: an EMA step</summary>With old target weight $2$, online weight $4$, and $\beta=0.9$, the new target is $2.2$. Setting $\beta=1$ freezes it; setting $\beta=0$ copies the online weight immediately. These extremes clarify the role of the interpolation.</details>

<!-- PAGE: IV · Learning what to remember | VICReg: three distinct jobs -->
## VICReg: three distinct jobs

VICReg pairs two views of an example and combines agreement with variance and covariance regularization. It is an important predecessor because it explicitly separates “match related examples” from “keep representations varied.” [VICReg, §3](https://arxiv.org/pdf/2105.04906v1)

For batch matrices $Z,Z'\in\mathbb R^{B\times d}$, a representative convention is

$$s(Z,Z')=\frac1B\sum_b\|z_b-z'_b\|^2,$$
$$v(Z)=\frac1d\sum_j\max(0,\gamma-\sqrt{C_{jj}+\epsilon}),$$
$$c(Z)=\frac1d\sum_{i\ne j}C_{ij}^2.$$

Here $C$ is the sample covariance. Apply the variance and covariance terms to both branches, then weight their contributions. These are designed penalties, not identities derived from probability laws.

Agreement encourages a shared description. The hinge in $v$ penalizes standard deviations below threshold $\gamma$ and stops pushing once they are large enough. The squared off-diagonal entries in $c$ penalize linear redundancy regardless of sign.

Squaring matters: summing signed covariances could let positive and negative correlations cancel. The LeWM v1 baseline appendix prints covariance expressions without these squares; when studying that baseline, distinguish the printed expression from canonical VICReg and check its implementation.

<details><summary>Try it first: what does VICReg not guarantee?</summary>Even zero off-diagonal covariance and acceptable feature variance do not imply independence or normality. The nonlinear-dependence example on page 14 remains possible. Nor does either penalty certify that the represented distinctions are useful for a downstream goal.</details>

<!-- PAGE: IV · Learning what to remember | Seeing the limits of moments -->
## Seeing the limits of moments

Consider a two-dimensional cloud with covariance

$$C=\begin{bmatrix}1&\rho\\\rho&1\end{bmatrix},\qquad -1\leq\rho\leq1.$$

Both coordinate standard deviations are one. With threshold one and negligible $\epsilon$, the variance penalty is zero. The covariance penalty defined on the previous page is $(\rho^2+\rho^2)/2=\rho^2$.

The eigenvectors are the two diagonal directions. Direct multiplication gives eigenvalues $1+\rho$ and $1-\rho$. As $\rho$ approaches one, the cloud becomes almost one-dimensional even though both coordinate histograms keep their spread.

<div class="lab" data-lab="covariance"></div>

The plot uses paired synthetic Gaussian samples and shows the **sample** covariance, which fluctuates around the chosen population value. Changing the correlation changes the sampled geometry; no network is being trained here.

A whitening transformation can force a sample covariance close to identity. It cannot, by itself, remove every nonlinear dependence or make a non-Gaussian cloud Gaussian. SIGReg will compare more than covariance by looking at the full distribution of projected values.

<details><summary>Try it first: a penalty can be satisfied without semantics</summary>Assign unrelated random vectors to each training image and spread them approximately isotropically. Moment penalties can look healthy while nearby physical states receive unrelated codes. The prediction task and generalization checks are what connect the cloud's geometry to the environment.</details>

<!-- PAGE: V · The paper trail | I-JEPA: predict the missing representation -->
## I-JEPA: predict the missing representation

I-JEPA learns from images by predicting representations of target regions using a visible context region. The target comes from a moving-average encoder and is detached during the online update. Mask geometry is part of the learning problem: context and targets are selected to encourage useful visual structure. [I-JEPA, §3](https://arxiv.org/pdf/2301.08243v1)

This is not yet an action-conditioned model of temporal dynamics. A “prediction” can concern a hidden part of a present image rather than the next moment in time. The general JEPA idea is broader than video or control.

Think of covering part of a photograph of a bicycle. Predicting a useful description of the covered area may require understanding how the visible wheel, frame, and handlebars fit together. Reconstructing each pixel would additionally require predicting texture, lighting, and other uncertain details.

Masking is an information bottleneck: the predictor cannot directly copy a target region it has not received. Yet a bottleneck does not determine which concepts will emerge. The architecture, data, target construction, and objective jointly influence the result.

The conceptual inheritance for our final paper is the **prediction in representation space**. The teacher update and masking recipe are separate implementation decisions. We should not attach every feature of I-JEPA to every later JEPA simply because the names are related.

<details><summary>Try it first: what extra ingredient makes a controller?</summary>A controller needs predictions conditioned on candidate actions and a way to rank resulting futures. Predicting masked image regions may produce a valuable visual encoder, but that alone does not answer what will happen if the agent pushes left.</details>

<!-- PAGE: V · The paper trail | V-JEPA: time enters the representation -->
## V-JEPA: time enters the representation

V-JEPA extends feature prediction to video. Its pretraining task predicts representations of masked spatiotemporal regions, using a target encoder updated by an exponential moving average. The learned features are evaluated on video understanding tasks. [V-JEPA, §§2–3](https://arxiv.org/pdf/2404.08471v1)

Time matters because motion disambiguates structure. A changing view can reveal which surfaces belong to one object. A hand approaching a cup can provide context for what happens next. But a video sequence alone does not label every intervention the observer could choose.

It is helpful to distinguish three tasks. **Video representation learning** builds useful descriptions of clips. **Future prediction** estimates what follows from available context. **Action-conditioned prediction** estimates what follows when a specified action is taken. These tasks overlap, but none should be silently substituted for another.

A temporal mask also differs from a causal mask. A model can be asked to predict a missing middle segment using observations from both before and after it. A deployed causal predictor cannot use observations from after the moment it is forecasting. Evaluation must respect the intended information boundary.

The lesson for LeWM is that a useful temporal representation and a useful controlled dynamics model have related motivations but distinct training interfaces.

<details><summary>Try it first: a future-information leak</summary>If a training window contains frames $1,2,3,4$ and a prediction of frame 3 attends to frame 4, it is solving a reconstruction problem with future context. Low error there does not establish an ability to predict frame 3 online from frames 1 and 2.</details>

<!-- PAGE: V · The paper trail | V-JEPA 2: connecting observation to action -->
## V-JEPA 2: connecting observation to action

V-JEPA 2 combines large-scale video representation learning with an action-conditioned stage for robot planning. Its recipe and scale differ substantially from LeWM's end-to-end training on environment trajectories. [V-JEPA 2, §§3–4](https://arxiv.org/pdf/2506.09985v1)

The important conceptual move is to use a learned visual description as the state in which candidate actions are evaluated. A desired observation supplies a goal description; the model estimates the consequences of a proposed action sequence; a search procedure chooses among them.

The word “self-supervised” describes how training targets are obtained. It does not mean an entire system has no engineered components. Crops, masks, robot action conventions, data filters, architectures, and planners all encode design choices.

Similarly, a successful demonstration in a robot setting does not settle whether the same representation supports arbitrary robots, tasks, or changes in dynamics. The proper question is which forms of transfer were actually tested.

As you read the series, keep a comparison notebook with four columns: where the encoder comes from, what the predictor receives, what prevents collapse, and how control is evaluated. This is more informative than arranging papers along a single “better versus worse” axis.

<details><summary>Try it first: why might pretraining help and hurt?</summary>Broad pretraining can supply useful visual features with less environment-specific data. But a frozen or constrained representation may omit a subtle feature that a particular controller needs. Joint learning can adapt the representation, while reintroducing the collapse problem and depending heavily on the available trajectories.</details>

<!-- PAGE: V · The paper trail | Two bridges: DINO-WM and PLDM -->
## Two bridges: DINO-WM and PLDM

DINO-WM predicts in representations supplied by a pretrained DINOv2 visual encoder. Freezing that encoder removes the possibility that dynamics training collapses it, though it does not guarantee every feature is appropriate for control. Its patch-level representation is richer and more expensive to repeatedly process than a compact single-vector representation. [DINO-WM, §3](https://arxiv.org/pdf/2411.04983v1)

PLDM explores planning with learned latent dynamics from reward-free offline trajectories. In the LeWM comparison, its training recipe uses several prediction and regularization terms based on VICReg and temporal structure. [PLDM](https://arxiv.org/pdf/2502.14819v1); [LeWM v1, Appendix C.2](https://arxiv.org/html/2603.19312v1#A3.SS2)

| Design question | Frozen representation | Joint representation learning |
|---|---|---|
| Can dynamics training change the encoder? | No | Yes |
| Can that training collapse the encoder? | No update, so no | Yes, unless constrained |
| What prior knowledge is available? | Pretraining data and recipe | Architecture and collected data |
| What must be evaluated? | Feature adequacy and dynamics | Feature adequacy, collapse, dynamics |

Neither column wins automatically. A comparison also depends on data volume, auxiliary inputs, model size, search budget, and task difficulty.

<details><summary>Try it first: a fair efficiency comparison</summary>If one method uses a large pretrained encoder and another trains from scratch, report both downstream compute and pretraining assumptions. A fast downstream learner may inherit an expensive upstream investment. Conversely, pretraining reused across many tasks can have practical value.</details>

<!-- PAGE: V · The paper trail | LeJEPA: why choose a Gaussian target? -->
## LeJEPA: why choose a Gaussian target?

LeJEPA combines predictive agreement with SIGReg. Its theory studies representation geometry through linear and nonlinear downstream probes under stated assumptions and covariance constraints. It motivates an isotropic Gaussian target; it does not prove that Gaussianizing arbitrary data recovers all physical variables. [LeJEPA, §3 and Appendices A–B](https://arxiv.org/pdf/2511.08544v1)

We can prove one underlying geometric fact now. Suppose a full-rank linear design matrix has eigenvalues $\lambda_1,\ldots,\lambda_d>0$ in $Z^\top Z$. With independent noise of variance $\sigma^2$, the least-squares coefficient variance has trace $\sigma^2\sum_j1/\lambda_j$; page 82 derives that expression.

At fixed total $S=\sum_j\lambda_j$, Cauchy–Schwarz gives

$$d^2=\left(\sum_j\sqrt{\lambda_j}\frac1{\sqrt{\lambda_j}}\right)^2
\leq S\sum_j\frac1{\lambda_j}.$$

Thus equal eigenvalues minimize this total coefficient variance. Equality requires all $\lambda_j$ equal. An elongated cloud makes some directions harder to estimate reliably.

This argument supports isotropy of second-order geometry. It does **not** single out a Gaussian, because many distributions have identity covariance. Page 96 develops a separate smooth-density argument involving the score function. Keep those two levels of reasoning distinct.

<details><summary>Try it first: what remains unidentified?</summary>An orthogonal rotation preserves a standard Gaussian distribution and Euclidean distances. The regularizer therefore cannot decide which coordinate should mean position or velocity. Gaussian geometry alone does not name the physical variables or guarantee linear recovery of them.</details>

<!-- PAGE: VI · From tests to objectives | What a normality test actually says -->
## What a normality test actually says

A statistical test begins with a null hypothesis, such as $H_0:X\sim\mathcal N(0,1)$. It computes a statistic $T$ that becomes large when a sample disagrees with that hypothesis.

A p-value is the probability, **assuming the null and the sampling assumptions**, of obtaining a statistic at least as extreme as the observed one:

$$p=P_{H_0}(T\geq T_{\mathrm{observed}}).$$

It is not the probability that the null is true. For an exactly calibrated continuous statistic, choosing a rejection threshold with null tail probability $\alpha$ gives false-rejection probability $\alpha$. This follows directly from how the threshold is defined.

A goodness-of-fit test for an unspecified Gaussian, with mean and variance estimated from the data, differs from testing the specific target $\mathcal N(0,1)$. Standardizing every projection can hide the shrinking and shifting that SIGReg is meant to detect.

SIGReg borrows a discrepancy statistic as a differentiable penalty. It minimizes that discrepancy; it need not convert it into a p-value or run a reject/accept decision during training. Repeated adaptive training on the same data also changes how ordinary test calibration should be interpreted.

**Failure to reject is not proof of equality.** A small sample or insensitive statistic can miss real differences. Increasing the number of examples, projection directions, and frequency evaluations addresses different limits.

<details><summary>Try it first: why a large p-value is not 95% confidence in normality</summary>The p-value is calculated in a hypothetical world where normality is assumed. It does not compare the prior plausibility or likelihood of all possible alternative distributions. That would require a different inferential framework.</details>

<!-- PAGE: VI · From tests to objectives | Two moments do not describe a distribution -->
## Two moments do not describe a distribution

Both a standard Gaussian and a fair random sign have mean zero and variance one. One spreads continuously across the real line; the other takes only two values. A mean-and-variance penalty cannot distinguish them.

<div class="lab" data-lab="moments"></div>

This experiment compares the two distributions using their characteristic functions, which we will build next. The Gaussian's function is $e^{-t^2/2}$; the random sign's is $\cos t$. Near zero they agree through the quadratic term but differ at higher orders:

$$\cos t=1-\frac{t^2}{2}+\frac{t^4}{24}+\cdots,$$
$$e^{-t^2/2}=1-\frac{t^2}{2}+\frac{t^4}{8}+\cdots.$$

These expansions come from repeated differentiation at zero in the Taylor series. The differing fourth-order coefficients encode the fourth-moment difference derived on page 18.

Adding a few more moments helps distinguish some alternatives, but any fixed finite list can miss other distributions. High-order moment estimates can also be dominated by rare, large observations because powers amplify the tails.

A bounded oscillating function provides another way to ask about the whole distribution without raising data values to large powers. That is the motivation for characteristic functions, not a claim that every other normality test is useless.

<details><summary>Try it first: another matching pair</summary>A uniform variable on $[-\sqrt3,\sqrt3]$ has variance one: integrate $x^2/(2\sqrt3)$ over that interval. Its fourth moment is $9/5$, different from both the Gaussian's $3$ and the random sign's $1$.</details>

<!-- PAGE: VI · From tests to objectives | A small detour through complex numbers -->
## A small detour through complex numbers

A complex number is a pair of real numbers, written $a+ib$, where $i^2=-1$. Think of $a$ as horizontal and $b$ as vertical. Its squared magnitude is $|a+ib|^2=a^2+b^2$.

The exponential has power series $e^x=\sum_{k=0}^\infty x^k/k!$. Substitute $ix$, group even and odd powers, and use $i^{2k}=(-1)^k$ and $i^{2k+1}=i(-1)^k$:

$$e^{ix}=\sum_k\frac{(-1)^kx^{2k}}{(2k)!}
+i\sum_k\frac{(-1)^kx^{2k+1}}{(2k+1)!}
=\cos x+i\sin x.$$

This is Euler's formula. The rearrangement is valid because these series converge absolutely for finite $x$.

The number $e^{ix}$ lies on the unit circle. As $x$ changes, it rotates. Its magnitude is one because $\cos^2x+\sin^2x=1$. Multiplying two such numbers adds their angles.

Why introduce this machinery? We want a bounded way to turn any real observation into an oscillation. Large input values do not create enormous outputs; they merely rotate farther. Averaging many such arrows reveals whether their phases reinforce or cancel.

Nothing in the eventual implementation requires a complex-number library. We can store the cosine average and sine average separately, then add their squared errors.

<details><summary>Try it first: two opposite arrows</summary>The average of $e^{i0}=1$ and $e^{i\pi}=-1$ is zero. Each arrow has magnitude one, but their average has magnitude zero. The characteristic function uses exactly this possibility of cancellation.</details>

<!-- PAGE: VI · From tests to objectives | The distribution's oscillating fingerprint -->
## The distribution's oscillating fingerprint

The characteristic function of a real random variable is defined by

$$\varphi_X(t)=\mathbb E[e^{itX}]
=\mathbb E[\cos(tX)]+i\mathbb E[\sin(tX)].$$

The input $t$ is a frequency, not physical time here. At $t=0$, every arrow equals one, so $\varphi_X(0)=1$. Its magnitude is at most one because averaging unit arrows cannot make a vector longer than one.

For a constant $X=c$, the function is $e^{itc}$. For a fair random sign, it is $(e^{it}+e^{-it})/2=\cos t$. The whole family of frequencies forms a fingerprint of the distribution; page 52 explains why it determines the distribution uniquely.

Several useful rules follow immediately. For $Y=aX+b$, substitute into the definition to obtain $\varphi_Y(t)=e^{itb}\varphi_X(at)$. For independent $X$ and $Y$, factor the expectation of $e^{itX}e^{itY}$ to obtain $\varphi_{X+Y}(t)=\varphi_X(t)\varphi_Y(t)$.

If suitable moments exist, differentiation under the expectation yields $\varphi_X'(0)=i\mathbb E[X]$ and $\varphi_X''(0)=-\mathbb E[X^2]$. Thus matching the fingerprint includes information about moments but is not restricted to a finite list of them.

<details><summary>Try it first: why can we always define it?</summary>The real and imaginary parts are bounded between $-1$ and $1$, so their expectations exist for every probability distribution. A heavy-tailed variable may lack a mean or variance while still possessing a characteristic function. The moment-derivative statements then need separate assumptions.</details>

<!-- PAGE: VI · From tests to objectives | Deriving the Gaussian fingerprint -->
## Deriving the Gaussian fingerprint

Let $G\sim\mathcal N(0,1)$ and $\varphi(t)=\int e^{itx}p_G(x)\,dx$. Differentiate with respect to $t$:

$$\varphi'(t)=i\int xe^{itx}p_G(x)\,dx.$$

Since $p_G'(x)=-xp_G(x)$, integrate by parts:

$$\varphi'(t)=-i\int e^{itx}p_G'(x)\,dx
=-i[e^{itx}p_G(x)]_{-\infty}^{\infty}
+i(it)\int e^{itx}p_G(x)\,dx=-t\varphi(t).$$

The boundary term vanishes. Differentiating under the integral is justified by the integrable bound $|x|p_G(x)$. Solve the differential equation without dividing by a possibly zero function: differentiating $e^{t^2/2}\varphi(t)$ gives zero. It is constant, and $\varphi(0)=1$. Therefore

$$\boxed{\varphi_G(t)=e^{-t^2/2}.}$$

This is the target curve inside SIGReg. It is real because the Gaussian is symmetric: the sine terms cancel. For $X=\mu+\sigma G$, the transformation rule gives $\varphi_X(t)=e^{it\mu-\sigma^2t^2/2}$.

For independent standard Gaussian coordinates, factor their characteristic functions to obtain $\varphi_G(v)=e^{-\|v\|^2/2}$ in multiple dimensions. This is another proof that a unit projection has the standard Gaussian target.

<details><summary>Try it first: a shifted Gaussian</summary>Changing the mean multiplies the fingerprint by $e^{it\mu}$, introducing a phase. Changing the variance changes how fast its magnitude decays. Matching only the real part or only the magnitude would lose some of this information.</details>

<!-- PAGE: VI · From tests to objectives | Estimating the fingerprint from a batch -->
## Estimating the fingerprint from a batch

For scalar samples $h_1,\ldots,h_B$, replace the expectation by an average:

$$\hat\varphi_B(t)=\frac1B\sum_be^{ith_b}=c(t)+is(t),$$

where $c=B^{-1}\sum_b\cos(th_b)$ and $s=B^{-1}\sum_b\sin(th_b)$. This is the empirical characteristic function, or ECF.

Under independent identically distributed sampling, its expectation equals $\varphi(t)$. Its mean squared estimation error is

$$\mathbb E|\hat\varphi_B(t)-\varphi(t)|^2
=\frac{1-|\varphi(t)|^2}{B}.$$

To derive it, center each unit arrow, expand the squared magnitude of their average, and observe that cross terms vanish by independence. Each diagonal term is $\mathbb E|e^{itX}-\varphi|^2=1-|\varphi|^2$.

Even a perfect population Gaussian therefore has a nonzero expected finite-batch discrepancy. Multiplying the statistic by $B$ makes that sampling contribution order one. It does not make it disappear.

This distinction prevents a serious misreading of training curves. “The population distribution matches the target” and “the statistic on every small batch equals zero” are different claims. A finite collection of point masses cannot exactly equal a continuous Gaussian distribution.

<details><summary>Try it first: the special frequency</summary>At $t=0$, every sample contributes one, so the ECF has no estimation error. The formula confirms this: $(1-|\varphi(0)|^2)/B=(1-1)/B=0$. Including zero in a frequency grid is harmless, but it provides no discrepancy signal by itself.</details>

<!-- PAGE: VI · From tests to objectives | Why the fingerprint determines the cloud -->
## Why the fingerprint determines the cloud

Here is a proof route that also works for distributions without densities. Add a tiny independent Gaussian: $X_\epsilon=X+\epsilon G$ with $\epsilon>0$. The resulting distribution has smooth density

$$p_\epsilon(x)=\mathbb E\left[\frac1{\epsilon\sqrt{2\pi}}
 e^{-(x-X)^2/(2\epsilon^2)}\right].$$

The Gaussian integral from pages 17 and 50, after rescaling, gives

$$p_\epsilon(x)=\frac1{2\pi}\int_{\mathbb R}
 e^{-itx}\varphi_X(t)e^{-\epsilon^2t^2/2}\,dt.$$

To check it, substitute $\varphi_X(t)=\mathbb E[e^{itX}]$, interchange expectation and integral using the integrable Gaussian bound, and evaluate the inner Gaussian transform. Thus equal characteristic functions imply equal smoothed densities for every $\epsilon>0$.

As $\epsilon\to0$, $X+\epsilon G$ approaches $X$. For any bounded continuous function $f$, $f(X+\epsilon G)\to f(X)$ pointwise and is bounded; averaging preserves this limit. Equal smoothed laws therefore give equal expectations of every bounded continuous $f$.

Continuous ramps can approximate indicators of intervals at continuity points of a distribution function. Their equal expectations imply equal interval probabilities and hence the same distribution. This completes the uniqueness argument. In $d$ dimensions, use a product Gaussian and boxes instead of intervals.

**Analytic footing:** the proof uses dominated convergence and interchange of absolutely integrable integrals. These rules say that a uniform integrable bound permits the indicated limit operations; they are stated here rather than proved from measure theory.

<!-- PAGE: VI · From tests to objectives | Cramér–Wold: all shadows determine the object -->
## Cramér–Wold: all shadows determine the object

Suppose random vectors $X,Y\in\mathbb R^d$ have the same distribution after projection onto every unit direction $u$. We will show that $X$ and $Y$ have the same joint distribution.

Their multivariate characteristic functions are $\varphi_X(v)=\mathbb E[e^{iv^\top X}]$ and $\varphi_Y(v)=\mathbb E[e^{iv^\top Y}]$. For any $v\ne0$, set $r=\|v\|$ and $u=v/r$. Then

$$\varphi_X(v)=\mathbb E[e^{ir(u^\top X)}]
=\varphi_{u^\top X}(r).$$

The assumed equality of projected distributions gives $\varphi_{u^\top X}(r)=\varphi_{u^\top Y}(r)=\varphi_Y(v)$. At $v=0$, both functions equal one. Thus the characteristic functions agree everywhere, and page 52's uniqueness result proves equality of distributions.

The reverse direction is immediate: applying the same measurable function, $x\mapsto u^\top x$, to equal distributions produces equal distributions. This is the distribution-identification form of the Cramér–Wold theorem.

Now choose $Y\sim\mathcal N(0,I)$. Every one-dimensional unit projection of $X$ being exactly standard Gaussian is equivalent to $X$ itself being standard multivariate Gaussian.

**Read the quantifiers.** This statement requires every direction and the entire projected distribution. A finite set of projections on a finite batch at finitely many frequencies is an approximation to those requirements, not the theorem itself.

<details><summary>Try it first: why coordinate marginals are insufficient</summary>Let $X=(G,SG)$ where $G$ is standard Gaussian and $S$ an independent fair sign. Each coordinate is Gaussian, and their covariance is zero. But points lie on two diagonal lines. Their joint distribution is not a two-dimensional Gaussian.</details>

<!-- PAGE: VI · From tests to objectives | What a finite sketch can miss -->
## What a finite sketch can miss

Return to $X=(G,SG)$ from the previous page. A diagonal projection is

$$\frac{X_1+X_2}{\sqrt2}=\frac{(1+S)G}{\sqrt2}.$$

Half the time it is exactly zero; half the time it is $\sqrt2G$. It has variance one but is not Gaussian. Looking along either coordinate axis misses the problem; looking diagonally reveals it.

<div class="lab" data-lab="directions"></div>

A **sketch** is a compressed set of measurements. SIGReg samples a finite collection of directions and averages their discrepancies. Fresh directions expose different aspects of the cloud over training. More directions improve the approximation to a directional average; they do not create more independent observations.

To sample a uniform direction, draw $g\sim\mathcal N(0,I)$ and normalize: $u=g/\|g\|$. Rotational invariance of $g$ implies rotational invariance of $u$; this is the uniform distribution on the sphere. The zero vector has probability zero under a continuous Gaussian, with a tiny numerical guard useful in code.

The population directional average of a continuous, nonnegative discrepancy can identify the target when it vanishes: a positive discrepancy at one direction would remain positive in a neighborhood with positive spherical measure. Finite random sketches only estimate this ideal.

<details><summary>Try it first: one thousand directions or one thousand samples?</summary>Directions ask more questions about the same cloud. Samples improve our estimate of the cloud itself. Repeatedly projecting ten observations does not turn them into ten thousand independent observations. Both budgets matter, and their effects should be measured separately.</details>

<!-- PAGE: VI · From tests to objectives | The Epps–Pulley discrepancy -->
## The Epps–Pulley discrepancy

We need a scalar mismatch between a projected ECF and the standard Gaussian fingerprint. A weighted squared difference provides one:

$$D(h)=\int_{-\infty}^{\infty}w(t)
\left|\hat\varphi_B(t)-e^{-t^2/2}\right|^2dt.$$

This is an Epps–Pulley-type characteristic-function discrepancy. The original normality-test setting and a fixed-target training penalty have different standardization and calibration choices. [Epps & Pulley, 1983](https://doi.org/10.1093/biomet/70.3.723); [LeWM v1, Appendix A](https://arxiv.org/pdf/2603.19312v1)

Using $\hat\varphi_B=c+is$ and real target $q=e^{-t^2/2}$ gives

$$|\hat\varphi_B-q|^2=(c-q)^2+s^2.$$

So the complex notation disappears in implementation. Both terms are necessary: a shifted asymmetric cloud can have a nonzero imaginary part.

The weight $w(t)>0$ controls which frequencies receive emphasis and makes the integral manageable. For the convention developed here, $w(t)=e^{-t^2/2}$. This choice is not forced by Cramér–Wold. Different windows and constant factors define differently scaled losses.

At the population level, a zero integral with a positive weight implies equality everywhere because characteristic functions are continuous and squared mismatch is nonnegative. The uniqueness theorem then identifies the target distribution. A finite numerical grid gives a weaker condition.

<details><summary>Try it first: collapse at zero</summary>If every $h_b=0$, then $c(t)=1$ and $s(t)=0$. For every nonzero frequency, $(1-e^{-t^2/2})^2>0$. Unlike prediction loss alone, this discrepancy penalizes the all-zero representation.</details>

<!-- PAGE: VI · From tests to objectives | An exact formula hiding inside the integral -->
## An exact formula hiding inside the integral

For $w(t)=e^{-t^2/2}$, expand the discrepancy from page 55:

$$|\hat\varphi-q|^2
=\frac1{B^2}\sum_{i,j}\cos(t(h_i-h_j))
-\frac{2q}{B}\sum_i\cos(th_i)+q^2.$$

The imaginary pair terms cancel because swapping $i$ and $j$ changes their signs. We already know the Gaussian transform. Scaling it gives

$$\int_{\mathbb R}e^{-\alpha t^2/2}\cos(bt)\,dt
=\sqrt{\frac{2\pi}{\alpha}}e^{-b^2/(2\alpha)},\quad\alpha>0.$$

Apply this with $\alpha=1,2,3$ to the three terms:

$$\begin{aligned}
D(h)={}&\frac{\sqrt{2\pi}}{B^2}\sum_{i,j}e^{-(h_i-h_j)^2/2}\\
&-\frac{2\sqrt\pi}{B}\sum_i e^{-h_i^2/4}+\sqrt{\frac{2\pi}{3}}.
\end{aligned}$$

This is an exact full-line integral for this chosen window and fixed target. The first term compares pairs of samples, the second compares samples to the target, and the last is target-only. Its pairwise cost grows quadratically with batch size.

The frequency-grid implementation instead evaluates averages at a fixed number of frequencies, making its work linear in batch size for fixed grid and projection counts. Numerical integration trades an exact expression for scalable computation.

<details><summary>Try it first: a reference check</summary>For one sample at zero, substitute $B=1,h_1=0$. The result is $\sqrt{2\pi}-2\sqrt\pi+\sqrt{2\pi/3}\approx0.409$. This is a useful independent check of quadrature code. A truncated grid should approximate it, not match it perfectly.</details>

<!-- PAGE: VI · From tests to objectives | Turning an integral into arithmetic -->
## Turning an integral into arithmetic

The discrepancy integrand is even: the cosine mean is even, the sine mean odd, and its square even. Therefore the full-line integral is twice the integral over nonnegative frequencies.

On nodes $t_k=k\Delta$, $k=0,\ldots,K-1$, the trapezoid rule approximates each small area by width times the average of its endpoint heights. Adding adjacent trapezoids gives

$$2\int_0^R f(t)dt\approx
\Delta f(0)+2\Delta\sum_{k=1}^{K-2}f(t_k)+\Delta f(R),$$

where $\Delta=R/(K-1)$. The two endpoint coefficients are half the interior coefficients because they belong to only one trapezoid.

The pinned LeWM implementation uses $K=17$, $R=3$, $q_k=e^{-t_k^2/2}$, and coefficients

$$\omega_k=\begin{cases}\Delta q_k&k=0,K-1\\2\Delta q_k&\text{otherwise.}\end{cases}$$

Its projected statistic is $T_B(h)=B\sum_k\omega_k[(c_k-q_k)^2+s_k^2]$. The factor $B$ is explicit. The v1 appendix describes an unscaled integral and gives a different example grid. We label this as a **pinned-code convention**, not a literal transcription of that appendix.

Finite $R$ truncates tails; finite $K$ approximates the remaining integral. Increasing one without the other addresses a different error. Fixed-grid agreement is not full distributional equality.

<details><summary>Try it first: the step size</summary>Seventeen nodes from zero to three define sixteen intervals, so $\Delta=3/16$, not $3/17$. Endpoint counting errors change every weight and therefore change the effective regularization coefficient.</details>

<!-- PAGE: VI · From tests to objectives | The regularizer has a usable gradient -->
## The regularizer has a usable gradient

For one projection, write $c_k=B^{-1}\sum_b\cos(t_kh_b)$ and $s_k=B^{-1}\sum_b\sin(t_kh_b)$. Differentiate one sample's contribution:

$$\frac{\partial c_k}{\partial h_b}=-\frac{t_k}{B}\sin(t_kh_b),\qquad
\frac{\partial s_k}{\partial h_b}=\frac{t_k}{B}\cos(t_kh_b).$$

Apply the chain rule to the $B$-scaled statistic:

$$\frac{\partial T_B}{\partial h_b}
=2\sum_k\omega_kt_k\left[-(c_k-q_k)\sin(t_kh_b)+s_k\cos(t_kh_b)\right].$$

The leading $B$ cancels the $1/B$ from differentiating each average. If $h_b=u^\top z_b$, then $\nabla_{z_b}T_B=(\partial T_B/\partial h_b)u$. Average this across directions and propagate through the encoder.

For a finite grid, $|c_k-q_k|\leq2$ and $|s_k|\leq1$, so $|\partial T_B/\partial h_b|\leq6\sum_k\omega_k|t_k|$. The derivative with respect to projected values is bounded independently of how large those values become. Network parameter gradients can still be large because they also contain the encoder Jacobian.

At exactly $h_b=0$ for every sample, this derivative is zero despite positive discrepancy. Thus “collapse is penalized” does not mean “every collapsed initialization receives a nonzero escape gradient.” Nondegenerate initialization and actual optimization behavior remain important.

<details><summary>Try it first: checking a derivative</summary>Hold the data and projection fixed. Compare the formula to $[T(h+\epsilon e_b)-T(h-\epsilon e_b)]/(2\epsilon)$. Use several moderate $\epsilon$ values: too large incurs approximation error, too small exposes floating-point cancellation.</details>

<!-- PAGE: VI · From tests to objectives | The axes are part of the mathematics -->
## The axes are part of the mathematics

Let embeddings have shape $Z\in\mathbb R^{T\times B\times d}$: time position, batch example, feature. Let $U\in\mathbb R^{d\times M}$ contain unit directions. Multiplication produces projected values with shape $(T,B,M)$.

At every fixed time and direction, average cosine and sine **over the batch**. Then integrate over frequencies, multiply by $B$, and average across time and directions:

$$\mathrm{SIGReg}(Z)=\frac1{TM}\sum_{\tau,m}T_B(Z_{\tau,:, :}u_m).$$

Flattening time into the batch changes this objective. Imagine every example at time one has embedding $-1$, and every example at time two has embedding $+1$. Each time slice is collapsed; the combined collection has spread. A pooled statistic can hide the within-time failure.

Nor can we average two microbatch statistics to reproduce a full-batch statistic. If their ECFs are $a$ and $b$ and target is $q$, then

$$\left|\frac{a+b}{2}-q\right|^2
=\frac{|a-q|^2+|b-q|^2}{2}-\frac{|a-b|^2}{4}.$$

Expand both sides to verify the missing cross term. To reproduce the full-batch ECF, aggregate sums of cosines and sines with their counts **before squaring**, and preserve gradient connectivity.

<details><summary>Try it first: distributed training</summary>If devices hold different pieces of a batch, globally reducing the scalar regularizer after local squaring differs from globally aggregating the ECF before squaring. The relevant distinction is the mathematical reduction order, not the number of devices.</details>

<!-- PAGE: VI · From tests to objectives | A laboratory for SIGReg -->
## A laboratory for SIGReg

We can now inspect the regularizer without a neural network. Generate a two-dimensional synthetic cloud, project onto seeded random unit directions, compute cosine and sine averages on the seventeen-node grid, and evaluate the pinned-code statistic.

<div class="lab" data-lab="sigreg"></div>

Compare a Gaussian, a shifted Gaussian, a thin Gaussian, and the two-line counterexample. Shift and scale alter different parts of the characteristic function. The two-line cloud has approximately correct coordinate marginals but fails oblique projections.

The number displayed is a finite-sample, finite-direction, finite-grid statistic. Its precise value depends on the seed and sample size. A nonzero number for the Gaussian is expected, as page 51 showed. The panel also reports sample means and covariance so that agreement of moments cannot masquerade as distributional equality.

**What this experiment establishes:** the implemented arithmetic responds to several known defects. **What it does not establish:** that a trained encoder will discover physical state variables, or that this finite sketch detects every possible defect.

The regularizer supplies a pressure toward a chosen distribution. Prediction supplies a pressure toward temporal usefulness. Their balance, data coverage, and model capacity determine the learned compromise.

<details><summary>Try it first: a representation cannot create information</summary>If the observation is identical in two states and the encoder is deterministic, its output is identical too. No distribution penalty can recover the missing state distinction from that observation alone. More context or a different sensor is required.</details>

<!-- PAGE: VII · Building LeWorldModel | Attention is a content-dependent average -->
## Attention is a content-dependent average

A transformer repeatedly lets tokens exchange information. A token is a vector representing an image patch, a time position, or another item. Attention determines which other tokens should influence it.

For token matrix $X$, form queries $Q=XW_Q$, keys $K=XW_K$, and values $V=XW_V$. For query $q_i$, compute scores against keys and turn them into positive weights summing to one:

$$\alpha_{ij}=\frac{\exp(q_i^\top k_j/\sqrt{d_k})}
{\sum_\ell\exp(q_i^\top k_\ell/\sqrt{d_k})},\qquad
h_i=\sum_j\alpha_{ij}v_j.$$

This is an architectural definition. It resembles looking up a question in a notebook: the query asks, keys indicate relevance, and values provide the content. The analogy does not mean tokens literally formulate questions.

Why divide by $\sqrt{d_k}$? Under a simplifying initialization model with independent zero-mean, unit-variance query and key coordinates, each product has variance one and the dot product has variance $d_k$. Dividing by its square root keeps score variance near one. Learned coordinates need not obey those assumptions exactly; the scaling is a practical normalization.

Multiple heads apply several such transformations, concatenate their outputs, and project back to the model width. They allow different learned interactions, but a head is not guaranteed to specialize in a human-interpretable relation.

<details><summary>Try it first: equal relevance</summary>If all scores are equal, every weight is $1/n$ and attention returns the average of the value vectors. If one score dominates, its value dominates the output. Attention is a learned averaging rule whose weights depend on the inputs.</details>

<!-- PAGE: VII · Building LeWorldModel | Softmax, masks, and residuals -->
## Softmax, masks, and residuals

For scores $s_j$, softmax is $p_j=e^{s_j}/\sum_ke^{s_k}$. Positive exponentials guarantee positive weights, and division makes their sum one. Subtracting any shared constant $c$ leaves the result unchanged because the factors $e^{-c}$ cancel. Implementations subtract the maximum score to avoid numerical overflow.

Its derivative follows from the quotient rule:

$$\frac{\partial p_i}{\partial s_j}=p_i(\mathbf1(i=j)-p_j).$$

Increasing one score raises its own probability and lowers the others. The changes must sum to zero because the total remains one.

A causal mask excludes future tokens by setting their scores to negative infinity before softmax. Their exponentials become zero. A token at time $t$ can then use only permitted context positions. In practice, optimized kernels implement this without literally storing infinities everywhere.

A transformer block typically has a residual form $x'=x+F(x)$. Its derivative is $I+J_F$, so there is a direct identity route for changes as well as the learned route. This helps optimization but does not prove it will succeed.

A feed-forward sublayer transforms each token separately; attention communicates between tokens. Positional information is needed because without it, ordinary self-attention treats a permutation of tokens as the corresponding permutation of outputs.

<details><summary>Try it first: numerical stability</summary>Scores $(1000,1001)$ may overflow when exponentiated directly. Subtracting $1001$ gives $(-1,0)$, whose exponentials are safe. The normalized probabilities are exactly the same in real arithmetic.</details>

<!-- PAGE: VII · Building LeWorldModel | Turning an image into tokens -->
## Turning an image into tokens

A Vision Transformer divides an image into patches, flattens each patch, and applies a learned linear projection. With $224\times224$ RGB images and patch width $14$, there are $(224/14)^2=256$ patches. Each raw patch contains $14\cdot14\cdot3=588$ numbers.

A learned matrix maps each patch to the model width. Positional embeddings record where patches came from. A special classification token, written **[CLS]**, can attend to patch information and serve as a single summary vector. Its historical name does not require that this model train a classifier.

LeWM v1 describes a ViT-Tiny encoder with twelve layers, three attention heads, and width 192, followed by a projection stage. Its predictor uses a transformer over a history of encoded frames. [LeWM v1, §3.1 and Appendix D](https://arxiv.org/pdf/2603.19312v1)

The raw image dimension and final embedding dimension play different roles. Compactness reduces the work needed to repeat predictions during planning. It may also discard useful local information, so a small token count is a computational advantage with a representational tradeoff.

There are two spatial resolutions in the paper's architecture descriptions: encoder patch size 14, and diagnostic decoder patch size 16. They belong to different modules. Confusing them changes token counts and implementation shapes.

<details><summary>Try it first: attention cost</summary>For $n$ tokens, each query compares with $n$ keys, producing $n^2$ scores per head. Holding other dimensions fixed, doubling token count roughly quadruples this attention-score work. Full runtime also includes projections, feed-forward layers, memory movement, and hardware effects.</details>

<!-- PAGE: VII · Building LeWorldModel | Normalization can constrain the wrong thing -->
## Normalization can constrain the wrong thing

Layer normalization standardizes coordinates **within one example**. For vector $x\in\mathbb R^d$, define its coordinate mean $\mu_x=d^{-1}\sum_jx_j$ and variance $v_x=d^{-1}\sum_j(x_j-\mu_x)^2$:

$$\operatorname{LN}(x)_j=\gamma_j\frac{x_j-\mu_x}{\sqrt{v_x+\epsilon}}+\beta_j.$$

Without the learned affine part and ignoring $\epsilon$, every output has coordinate sum zero and squared length $d$. Such vectors occupy a constrained surface. A full-dimensional Gaussian has neither a fixed sum nor a fixed radius, so directly asking these normalized outputs to match it creates a conflict.

Batch normalization instead computes statistics for each feature **across examples**. During training, one example's output therefore depends on the others in its batch; at evaluation it commonly uses running estimates. That is a different axis and a different dependence structure.

LeWM places a projection stage after the encoder's final normalization, allowing the regularized representation to change distribution beyond the directly normalized summary. The paper also uses a projection stage after the predictor. [LeWM v1, §3.1](https://arxiv.org/pdf/2603.19312v1)

Do not center, standardize, or unit-normalize each SIGReg projection as an unannounced preprocessing step. Those operations can remove precisely the mean and scale errors the fixed Gaussian target is supposed to penalize.

<details><summary>Try it first: normalization versus Gaussianization</summary>A batch can be standardized to empirical mean zero and variance one while remaining bimodal, discrete, or strongly dependent across coordinates. Normalization enforces selected summaries. It is not a general transformation to a Gaussian distribution.</details>

<!-- PAGE: VII · Building LeWorldModel | Letting actions change the prediction -->
## Letting actions change the prediction

A predictor must react differently to different actions from the same context. One simple design concatenates an action vector with the embedding. LeWM instead injects action information into its transformer through adaptive layer normalization, or AdaLN.

Let an action embedding $c$ produce scale and shift functions. A representative modulation is

$$\operatorname{AdaLN}(x,c)=(1+\gamma(c))\odot\operatorname{LN}(x)+\beta(c).$$

The symbol $\odot$ means coordinate-wise multiplication. Unlike a fixed normalization, this transformation depends on the proposed action. A residual gate can also depend on $c$:

$$x'=x+g(c)\odot F(\operatorname{AdaLN}(x,c)).$$

These are design definitions. Their purpose is to let the action alter how latent features are processed rather than merely append a label at the end. The pinned implementation uses separate shifts, scales, and gates for attention and feed-forward branches.

Initializing the modulation output to zero makes $1+\gamma$ start at one, $\beta$ at zero, and the gates at zero. The corresponding residual block initially behaves like an identity route; action-dependent transformations enter as learning changes the gates and modulation parameters.

A gated branch's internal weights can initially receive zero gradient while the gate itself receives a gradient. This is a staged optimization effect, not a claim that every component learns at equal speed from the first update.

<details><summary>Try it first: why the “1 plus”?</summary>If the scale were $\gamma(c)$ with zero initialization, it would zero the normalized features. Writing $1+\gamma(c)$ instead starts with an unchanged scale. Small learned values then represent small deviations from that starting behavior.</details>

<!-- PAGE: VII · Building LeWorldModel | History and teacher forcing -->
## History and teacher forcing

The shorthand $\hat z_{t+1}=P(z_t,a_t)$ can hide a predictor that actually receives several frames and aligned actions. More explicitly,

$$\hat z_{t+1}=P(z_{t-N+1:t},a_{t-N+1:t}).$$

A colon denotes a sequence of indices. The action at the final context position causes the transition we are trying to predict. Earlier actions explain transitions within the history.

During **teacher forcing**, each training prediction uses encoded real context frames. During an autoregressive rollout, later context slots contain the model's own predicted embeddings. These input distributions can differ, because earlier errors become later inputs.

If each model step spans five environment actions, the action token must represent the relevant block, not just one arbitrarily chosen action. History length, frame skip, and rollout horizon measure different things. A five-step model rollout with frame skip five spans twenty-five environment steps.

Causal attention prevents direct access to future frame embeddings within a training sequence. Data preparation must also avoid other leaks, such as inadvertently including the target in a pooled context feature. Layer placement, batch statistics, and target construction deserve explicit audits.

<details><summary>Try it first: aligning two context frames</summary>With observations $o_{t-1},o_t$ and actions $a_{t-1},a_t$, predict $o_{t+1}$. Here $a_{t-1}$ produced the observed move into $o_t$; $a_t$ is the candidate move out of it. After rollout, shift both observation and action histories together. Shifting just one changes their temporal meaning.</details>

<!-- PAGE: VII · Building LeWorldModel | The complete objective -->
## The complete objective

Let $z_{b,t}=E_\theta(o_{b,t})$, and let $\hat z_{b,t+1}$ be the action-conditioned prediction. A fully specified mean-reduction convention is

$$L_{\mathrm{pred}}=\frac1{B(T-1)d}
\sum_{b=1}^B\sum_{t=1}^{T-1}\|\hat z_{b,t+1}-z_{b,t+1}\|^2.$$

The joint objective is

$$\boxed{\loss=L_{\mathrm{pred}}+\lambda\,\mathrm{SIGReg}(Z).}$$

The first term asks descriptions to be predictable. The second asks their cloud to maintain a particular distribution. Gradients pass through both the predicted and target embeddings and through the distribution statistic. Neither a frozen target encoder nor an EMA update is needed for this objective.

The paper writes individual squared distances compactly; implementations must decide whether to sum or average features, frames, and examples. Dividing the prediction term by $d$ changes its scale relative to an unchanged regularizer. A published $\lambda$ only makes sense together with these conventions.

The Gaussian target concerns the **aggregate representation distribution**, not the conditional distribution of the next state given an action. It does not mean environment dynamics are Gaussian or that every predicted future comes with Gaussian uncertainty.

<details><summary>Try it first: what could still go wrong?</summary>The encoder could preserve predictable but unhelpful information, the predictor could fail off the data distribution, or the regularizer could be imperfectly optimized. The two-term objective removes a particular incentive for collapse. It is not a complete certificate of a useful world model.</details>

<!-- PAGE: VII · Building LeWorldModel | Train the smallest possible example -->
## Train the smallest possible example

We can isolate the tradeoff with a scalar encoder $z=wx$ and a fixed predictor that returns $z$. Suppose consecutive synthetic values are independent standard Gaussians. The population prediction error is

$$\mathbb E[(wx-wx')^2]=2w^2.$$

Expand the square: each squared term contributes $w^2$, and independence makes the cross expectation zero. Prediction alone prefers $w=0$.

Now add the finite-batch SIGReg statistic on the encoded values. A spread penalty opposes shrinking, but the precise optimum depends on $\lambda$, the finite sample, and the chosen statistic. This toy is intentionally not a useful dynamics problem; it makes the competing incentives visible.

<div class="lab" data-lab="training"></div>

The button performs actual gradient updates on $w$, using the analytically derived SIGReg gradient. Both runs start from the same nonzero weight and use the same seeded data. One uses prediction alone, the other adds regularization. The displayed results are computed during the run, not a stored success curve.

This teaches the mechanism without claiming to reproduce LeWM's image encoder, trainable transformer predictor, dataset, or benchmark performance. Real learning also changes what the representation encodes, not only its scale.

<details><summary>Try it first: exact zero initialization</summary>Both the prediction gradient and this symmetric regularizer gradient vanish at $w=0$. Starting there can trap this toy at a stationary point. Starting from an ordinary nonzero value tests the tradeoff without pretending that positive regularizer loss guarantees an escape from every initialization.</details>

<!-- PAGE: VII · Building LeWorldModel | A readable implementation -->
## A readable implementation

This NumPy-style specification exposes the axes and weights. It defines the statistic; differentiable frameworks must preserve the same operations in their computation graph.

```python
def sigreg(z, unit_directions):
    # z: [time, batch, feature]
    T, B, D = z.shape
    t = np.linspace(0., 3., 17)
    dt = 3. / 16
    target = np.exp(-0.5 * t**2)
    weights = np.full(17, 2 * dt)
    weights[[0, -1]] = dt
    weights *= target
    h = z @ unit_directions       # [T, B, M]
    phase = h[..., None] * t      # [T, B, M, K]
    real = np.cos(phase).mean(axis=1)
    imag = np.sin(phase).mean(axis=1)
    error = (real - target)**2 + imag**2
    return B * (error * weights).sum(axis=-1).mean()
```

The training skeleton is equally short:

```python
z = encoder(frames)                # [B, T, D]
z_hat = predictor(z, action_blocks)
pred_loss = ((z_hat[:, :-1] - z[:, 1:])**2).mean()
reg_loss = sigreg(z.transpose(1, 0, 2), directions)
loss = pred_loss + lam * reg_loss
# Differentiate loss through BOTH uses of encoder.
```

Generate fresh Gaussian direction columns and divide each by its Euclidean norm. Do not standardize `h`. Ensure the predictor's causal alignment makes output slot $t$ forecast frame $t+1$.

This corrects the explanatory pseudocode syntax in v1's Algorithm 1: an actual MSE call needs a prediction and target, or an explicit squared difference. A missing parenthesis in a paper listing should not be copied into an implementation.

<!-- PAGE: VII · Building LeWorldModel | The recipe is larger than the loss -->
## The recipe is larger than the loss

LeWM v1 describes batch size 128, four-frame subtrajectories, $224\times224$ images, frame skip five, and typically 1,024 SIGReg directions with regularization weight 0.1. The predictor's context length depends on the environment. These are reported settings, not universal defaults established by theorem. [LeWM v1, §3 and Appendix D](https://arxiv.org/pdf/2603.19312v1)

Keep a version ledger when reproducing research:

| Item | What must be pinned |
|---|---|
| Paper | arXiv identifier **and version** |
| Code | Repository commit |
| Objective | Reduction axes and constant factors |
| Data | Collection, splits, action alignment |
| Search | Candidates, iterations, horizon, execution cadence |

Our code reference is `8edfeb336732b5f3ce7b8b210d0ba370a09e2cac` of the authors' repository. It is a concrete implementation reference, not an assertion that this exact commit generated every v1 figure.

The appendix's example frequency interval differs from that code's seventeen nodes on $[0,3]$. The code multiplies by batch size. The general MPC description permits partial-plan execution, whereas Appendix D describes executing the entire five-model-step plan before replanning. These differences should appear in a reproduction log.

“One effective hyperparameter” refers to the principal loss tradeoff. Architecture, optimizer, sampling, and planning still involve choices. A convenient empirical sweep does not prove the validation objective is monotone or unimodal enough for guaranteed bisection optimization.

<!-- PAGE: VIII · Thinking before acting | Letting a prediction continue -->
## Letting a prediction continue

At planning time, the model parameters are frozen. Start from an encoded observation and repeatedly apply candidate actions:

$$\hat z_0=E(o_0),\qquad \hat z_{k+1}=P(\hat z_k,a_k),\quad k=0,\ldots,H-1.$$

Here $H$ is the number of transitions, so the final predicted state is $\hat z_H$. This indexing avoids the common ambiguity of calling both the number of states and the number of transitions “the horizon.” A history-based model shifts its context window at every step.

The model's output is a representation, not a rendered scene. We may train a separate display decoder, but planning can operate entirely on the latent values.

A one-step held-out evaluation supplies a fresh real context before every forecast. An open-loop evaluation starts with a real context once and then uses its own outputs. It tests whether the learned dynamics remain useful under accumulated model-generated inputs.

These evaluations can disagree. A predictor might make small errors on the training data manifold yet move outside that manifold during rollout, where its behavior was never constrained. The planner then searches precisely those imperfect imagined futures, sometimes exploiting errors rather than discovering a feasible action sequence.

<details><summary>Try it first: persistence as a baseline</summary>A predictor returning $z_t$ for $z_{t+1}$ can have low error when frames are close and motion is slow. Compare against this persistence baseline. A low absolute prediction error is less informative if doing nothing achieves nearly the same number.</details>

<!-- PAGE: VIII · Thinking before acting | How errors accumulate -->
## How errors accumulate

Suppose a true latent transition is $F$ and a learned one is $P$. Assume one-step approximation error $\|P(z,a)-F(z,a)\|\leq\epsilon$ throughout the region visited, and that $F$ is Lipschitz in state:

$$\|F(z,a)-F(z',a)\|\leq L\|z-z'\|.$$

“Lipschitz” means output differences cannot grow by more than factor $L$ in one step. Let $e_k=\|\hat z_k-z_k\|$. Add and subtract $F(\hat z_k,a_k)$ and apply the triangle inequality:

$$e_{k+1}\leq\epsilon+Le_k.$$

Starting with $e_0=0$, repeated substitution gives

$$e_H\leq\epsilon\sum_{j=0}^{H-1}L^j
=\begin{cases}\epsilon H&L=1,\\\epsilon(1-L^H)/(1-L)&L\ne1.\end{cases}$$

The geometric-sum identity follows by subtracting $L(1+L+\cdots+L^{H-1})$ from the unmultiplied sum. If $L>1$, the bound can grow rapidly. If $L<1$, it remains bounded by $\epsilon/(1-L)$.

The assumptions are substantial. A latent state may not be Markov, and the error bound may hold only near observed data. This derivation explains why horizon matters; it is not a measured guarantee for LeWM.

<details><summary>Try it first: why re-observation helps</summary>A new observation can replace a drifting predicted state with an encoded real one. This resets part of the accumulated rollout error. It does not eliminate representation error, hidden-state ambiguity, or a systematically incorrect dynamics model.</details>

<!-- PAGE: VIII · Thinking before acting | A goal turns prediction into a preference -->
## A goal turns prediction into a preference

Encode a desired observation $o_g$ as $z_g=E(o_g)$. A terminal goal cost is

$$C(a_{0:H-1})=\|\hat z_H-z_g\|^2.$$

The model predicts what follows from the actions. The cost ranks those consequences. Minimizing it is a finite-horizon control problem:

$$a^*_{0:H-1}\in\operatorname*{arg\,min}_{a_{0:H-1}}C(a_{0:H-1}).$$

The symbol $\arg\min$ means “the input attaining the smallest value,” not that smallest value itself. There may be multiple minimizers or no attained minimum without additional constraints.

The squared distance is a design choice. It assumes the latent geometry makes proximity to the goal meaningful. Gaussian regularization controls distributional geometry but does not prove every Euclidean neighborhood corresponds to interchangeable physical outcomes.

A terminal position alone may reward arriving at high speed. A cost could instead include several final steps, action effort, or a velocity target. Those additions change the task definition; they should be disclosed rather than smuggled into a claim of reproducing the paper.

This separation enables a compelling experiment: freeze the encoder and predictor, then change only the goal. Success demonstrates reuse of learned dynamics for those new goals, without claiming universal transfer.

<details><summary>Try it first: can the goal specify hidden velocity?</summary>A single static goal image may not distinguish arriving from the left versus the right or stopping versus passing through. If velocity matters, a goal history or another explicit objective may be necessary. The goal sensor has the same information limits as the current-state sensor.</details>

<!-- PAGE: VIII · Thinking before acting | Cross-entropy method: search by refinement -->
## Cross-entropy method: search by refinement

A horizon-$H$ action sequence with $A$ coordinates per action can be flattened into a vector in $\mathbb R^{HA}$. The cross-entropy method, or CEM, maintains a sampling distribution over those vectors.

Start with a broad Gaussian. Sample candidate plans, roll each through the world model, and compute their costs. Keep the lowest-cost fraction, called the **elites**. Refit the sampling distribution to the elite vectors, then repeat.

For a diagonal Gaussian with elite set $\mathcal E$ of size $K$, the update is

$$\mu_j=\frac1K\sum_{i\in\mathcal E}a_j^{(i)},\qquad
\sigma_j^2=\frac1K\sum_{i\in\mathcal E}(a_j^{(i)}-\mu_j)^2.$$

Each index $j$ denotes one coordinate of the flattened action sequence. The next page derives these formulas from maximum likelihood. A full covariance can model relationships between action coordinates, at greater cost.

Action bounds require an explicit choice: clip samples, use a bounded distribution, or transform an unconstrained variable. Clipping Gaussian samples changes their distribution, so the fitted Gaussian is then an approximation to the clipped elite set.

CEM is a sampling optimizer, not a global-optimality theorem. It can concentrate around a poor local solution or shrink its variance too quickly. More candidates and iterations consume additional world-model evaluations.

<details><summary>Try it first: the mean need not be a good plan</summary>If elite plans go around opposite sides of an obstacle, their average may go straight through it. Returning the mean without evaluating it can be worse than returning the best evaluated candidate. Record which convention a planner uses.</details>

<!-- PAGE: VIII · Thinking before acting | Why the elite mean and variance appear -->
## Why the elite mean and variance appear

For scalar elite samples $a_1,\ldots,a_K$, a Gaussian with mean $\mu$ and variance $v>0$ has negative log-likelihood, up to a constant,

$$J(\mu,v)=\frac K2\log v+\frac1{2v}\sum_i(a_i-\mu)^2.$$

Differentiate with respect to $\mu$: $\partial J/\partial\mu=\sum_i(\mu-a_i)/v$. Setting it to zero gives $\mu=K^{-1}\sum_i a_i$.

For this mean, differentiate with respect to $v$:

$$\frac{\partial J}{\partial v}=\frac K{2v}-\frac{\sum_i(a_i-\mu)^2}{2v^2}=0.$$

Multiplying by $2v^2$ gives $v=K^{-1}\sum_i(a_i-\mu)^2$. The denominator is $K$, because this is maximum likelihood, not the unbiased population-variance estimator on page 13. If all elites coincide, the optimum approaches a degenerate zero variance; implementations usually impose a floor.

Why the name “cross-entropy”? Give each elite probability $1/K$ and call that empirical distribution $q$. Minimizing $-\mathbb E_q[\log p_\theta(a)]$ fits the sampling density to elites. For continuous actions this is an empirical log-density objective; the intuition does not require treating a discrete empirical measure as an ordinary continuous density with finite differential entropy.

<details><summary>Try it first: compute one update</summary>For elite values $-1,0,2$, the mean is $1/3$. Squared deviations sum to $14/3$, so the fitted variance is $14/9$. This is the next sampling variance before any smoothing or variance floor.</details>

<!-- PAGE: VIII · Thinking before acting | Model predictive control closes the loop -->
## Model predictive control closes the loop

An open-loop controller plans once and executes without observing again. Model predictive control, or MPC, repeatedly plans from updated information.

1. Encode the current observation history.
2. Optimize a candidate sequence using the frozen model.
3. Execute a specified prefix of the sequence.
4. Observe what actually happened and plan again.

The action prefix may be one step or several. Shorter prefixes allow more frequent correction but require more planning computations. Longer prefixes save computation while allowing greater drift between observations.

LeWM's main text describes this general pattern. Its v1 Appendix D specifies a five-model-step horizon with frame skip five and execution of the entire optimized sequence before replanning. An educational controller that executes only its first action is a different, explicitly stated choice. [LeWM v1, §3.2 and Appendix D](https://arxiv.org/pdf/2603.19312v1)

Replanning changes actions, not necessarily model weights. Online learning changes the model. Confusing these can make a fixed model's feedback corrections look like continual training.

MPC can respond to modest prediction errors when new observations reveal them. It cannot guarantee safety or success under arbitrary model mismatch, hidden state, or unmodeled constraints. Its benefit is a recurring opportunity to correct the plan.

<details><summary>Try it first: a disturbance</summary>If an unexpected push moves the puck off its predicted path, open-loop actions remain based on the old imagined state. MPC can encode the displaced observation and choose a new sequence. If the sensor cannot reveal the disturbance's hidden effect, the correction may still be incomplete.</details>

<!-- PAGE: VIII · Thinking before acting | Plan with a model you can inspect -->
## Plan with a model you can inspect

This experiment uses a known one-dimensional damped system:

$$v_{t+1}=0.9v_t+0.15a_t,\qquad x_{t+1}=x_t+v_{t+1}.$$

These discrete equations define the toy environment. They are not a learned encoder or LeWM reproduction. The planner runs real CEM over bounded candidate actions and minimizes terminal position error squared plus $0.5$ times terminal velocity squared, $0.005$ times summed action squares, and $0.03$ times summed intermediate position errors squared. These additional preferences are toy design choices. It executes one action and replans from the true toy state.

<div class="lab" data-lab="planner"></div>

The predicted paths come from sampled candidate action sequences. Their spread is search diversity, **not** calibrated model uncertainty. The model parameters remain fixed when you move the goal. A mismatch control changes the damping used by the planner while the environment keeps its original damping.

Compare short and longer horizons. Longer lookahead can help anticipate braking, but requires searching a larger action sequence and performing more predictions. A particular seed and budget may therefore produce a less successful longer plan.

The task is deliberately state-based so the action-search mechanism remains inspectable. The final paper adds the difficult learned visual representation and learned dynamics in front of this planning loop.

<details><summary>Try it first: what would make this a learned world-model demonstration?</summary>Collect observations and actions, learn an encoder and predictor without giving them the true state equations, freeze them, then plan using only their representations. Keep the real simulator solely for execution and evaluation. Replacing the learned rollout with true mechanics would invalidate that demonstration.</details>

<!-- PAGE: VIII · Thinking before acting | The hidden-state problem returns -->
## The hidden-state problem returns

A finite observation history can help infer state, but it need not be sufficient. A closed box may contain a changing variable that has not yet affected any visible frame. No deterministic encoder of the visible history can reveal it exactly.

A more general description is a **belief state**: a probability distribution over possible physical states given the observations and actions. In a discrete known model, first predict through the transition distribution, then update with the new observation:

$$\tilde b_{t+1}(s')=\sum_s p(s'\mid s,a_t)b_t(s),$$
$$b_{t+1}(s')=\frac{p(o_{t+1}\mid s')\tilde b_{t+1}(s')}
{\sum_u p(o_{t+1}\mid u)\tilde b_{t+1}(u)}.$$

The first line is total probability over previous states. The second is Bayes' rule with a normalization constant. These are exact under the specified transition and observation model; they become difficult in large continuous worlds.

LeWM's deterministic history-conditioned embedding is not explicitly this probability distribution. It may encode useful temporal information, but that does not justify reading it as a calibrated belief over hidden states.

The distinction matters for action selection. Sometimes an action is valuable because it reveals information, even if it does not immediately approach the goal. A short-horizon deterministic goal-matching planner need not value such information gathering.

<details><summary>Try it first: look before moving</summary>A camera turn may reveal whether a doorway is blocked. Its immediate position cost can be zero or unfavorable, while its information value is large. Representing and planning under uncertainty requires more than matching one expected future embedding.</details>

<!-- PAGE: VIII · Thinking before acting | Uncertainty is not one thing -->
## Uncertainty is not one thing

**Aleatoric uncertainty** comes from randomness or unresolved information in the prediction problem. **Epistemic uncertainty** comes from limited knowledge of the model, such as insufficient data in a region. The boundary depends on the information and model we choose.

The law of total variance makes a related decomposition precise. Let $C$ be context and $m(C)=\mathbb E[Y\mid C]$. Write $Y-\mathbb E[Y]=(Y-m)+(m-\mathbb E[Y])$, square, and average. The cross term vanishes after conditioning:

$$\operatorname{Var}(Y)=\mathbb E[\operatorname{Var}(Y\mid C)]
+\operatorname{Var}(\mathbb E[Y\mid C]).$$

The first term is remaining variation within contexts; the second is variation between their means. This identity is not automatically a neural network's uncertainty estimate. A model must explicitly represent or estimate the relevant quantities.

A deterministic predictor's error can be large because an event is stochastic, a hidden variable is missing, the representation is poor, or the model has not learned the dynamics. A single surprise score cannot uniquely diagnose the cause.

Ensembles, stochastic predictors, and probabilistic latent variables are possible extensions. Their outputs require calibration and evaluation. Merely generating many candidate action sequences in CEM does not make a deterministic world model probabilistic.

<details><summary>Try it first: identical forecasts from an ensemble</summary>Agreement among models can reflect shared correct knowledge, but also shared blind spots, training data, or architectural biases. Ensemble disagreement is a useful signal in some settings, not a universal measure of truth or risk.</details>

<!-- PAGE: VIII · Thinking before acting | Why hierarchy remains an open problem -->
## Why hierarchy remains an open problem

Suppose one model step covers $0.1$ seconds. Planning a one-hour activity would require 36,000 transitions. Even accurate local dynamics and efficient search become strained at that scale.

A hierarchy can introduce slower variables and longer-duration actions. A high-level plan might choose “reach the doorway”; a lower-level controller realizes that subgoal through many small movements. The higher model must predict consequences at a coarser time scale while preserving information relevant to future high-level decisions.

This is not equivalent to increasing frame skip blindly. If skipped intervals hide collisions or branch points, a coarse predictor may become ambiguous. The abstraction needs to be compatible with both dynamics and control.

LeCun's position paper places such hierarchies within a broader architecture. LeWM's short-horizon experiments are a concrete component of that research direction, not its completion. [LeCun 2022](https://openreview.net/forum?id=BZ5a1r-kVsf); [LeWM v1, limitations](https://arxiv.org/pdf/2603.19312v1)

A manually specified sequence of waypoints can be useful engineering. It is not evidence that the model learned a planning hierarchy. To make that claim, specify how subgoals or temporal abstractions are learned and evaluate whether they transfer beyond the construction examples.

<details><summary>Try it first: a meaningful next experiment</summary>Train low- and high-frequency predictors on the same environment, define how actions or subgoals connect their time scales, and compare long-horizon success at matched compute. Include a simple fixed-frame-skip baseline. Otherwise extra engineering may be mistaken for learned abstraction.</details>

<!-- PAGE: IX · Reading the evidence | Success rates need a denominator -->
## Success rates need a denominator

For $n$ evaluation trials, let $Y_i=1$ for success and $0$ otherwise. The observed success rate is $\hat p=n^{-1}\sum_iY_i$. If trials are independent with common success probability $p$, then $\mathbb E[\hat p]=p$ and

$$\operatorname{Var}(\hat p)=\frac{p(1-p)}n.$$

The proof uses the variance-of-a-mean calculation from page 12 and $\operatorname{Var}(Y)=\mathbb E[Y^2]-p^2=p-p^2$, because $Y^2=Y$ for a binary variable.

A rough standard error substitutes $\hat p$ for $p$. Near zero or one, or with small $n$, symmetric normal approximations can be poor. More fundamentally, correlated trials reduce the information in the nominal trial count.

A reported “mean ± number” is incomplete without defining that number: standard deviation across training seeds, standard error of a mean, or a confidence interval. These quantities answer different questions.

Goal sampling also defines difficulty. A goal drawn from later in the same recorded trajectory is known to be reachable under the data-generating dynamics. Arbitrary goals may include impossible or out-of-distribution configurations. Neither protocol is automatically wrong, but their results are not interchangeable.

<details><summary>Try it first: count uncertainty</summary>With $n=100$ independent trials and $\hat p=0.8$, the plug-in standard error is $\sqrt{0.8\cdot0.2/100}=0.04$. A four-percentage-point change is therefore not automatically decisive evidence. Pairing methods on the same starts can improve comparison, but requires analyzing paired outcomes.</details>

<!-- PAGE: IX · Reading the evidence | A probe asks what information is accessible -->
## A probe asks what information is accessible

Freeze an encoder, collect embeddings in matrix $Z$, and fit labels $y$ with a linear readout $Z\beta$. Minimizing $\|y-Z\beta\|^2$ gives gradient $-2Z^\top(y-Z\beta)$. Setting it to zero yields

$$\hat\beta=(Z^\top Z)^{-1}Z^\top y,$$

provided $Z$ has full column rank. Add a column of ones for an intercept, or center features and labels. If rank is deficient, use a pseudoinverse or explicitly regularize; an ordinary inverse does not exist.

For $y=Z\beta_*+\varepsilon$, with fixed $Z$ and noise covariance $\sigma^2I$, substitution gives

$$\hat\beta-\beta_*=(Z^\top Z)^{-1}Z^\top\varepsilon,$$
$$\operatorname{Cov}(\hat\beta)=\sigma^2(Z^\top Z)^{-1}.$$

The second line follows by multiplying the noise covariance between the linear transformation and its transpose. Taking its trace gives the coefficient-variance expression used on page 45.

A successful held-out linear probe establishes linear accessibility of the chosen labels under that evaluation distribution. A nonlinear probe establishes accessibility to its richer function class. Neither proves the model causally understands the variable or will use it correctly when planning.

Probe labels are supervision for the probe, even if representation training was self-supervised. Freeze the encoder and separate probe training, validation, and testing to keep the claim precise.

<details><summary>Try it first: a misleading decoder</summary>A powerful readout can exploit correlations in the evaluation dataset. Test changed combinations of physical variables or appearance to distinguish robust access from shortcuts. High held-out performance on an easy split is useful evidence, but has a limited scope.</details>

<!-- PAGE: IX · Reading the evidence | Error and correlation tell different stories -->
## Error and correlation tell different stories

Mean squared error measures numerical disagreement. Pearson correlation measures centered linear association:

$$r=\frac{\sum_i(x_i-\bar x)(y_i-\bar y)}
{\sqrt{\sum_i(x_i-\bar x)^2\sum_i(y_i-\bar y)^2}}.$$

It is cosine similarity between the centered data vectors, so the bound $|r|\leq1$ follows from page 9. If either vector is constant, the denominator is zero and the correlation is undefined.

Suppose a probe predicts $\hat y=10y+100$. If $y$ varies, correlation is exactly one, yet the prediction can have enormous squared error. Correlation is insensitive to a positive affine rescaling; MSE is sensitive to units and offsets.

Conversely, a target with very small variation can produce small MSE even for a constant predictor. Compare against predicting the training mean, and specify whether labels were standardized before evaluation.

For angular variables, raw subtraction near the wraparound boundary is misleading. Angles $179^\circ$ and $-179^\circ$ differ by only $2^\circ$ physically, though raw subtraction gives $358^\circ$. Predicting sine and cosine or using a circular error can reflect the geometry better. Such choices must be stated when comparing numbers.

<details><summary>Try it first: interpreting a probe table</summary>Read the target variable, units, train/test split, readout class, and aggregation before ranking rows. A larger model may provide more accessible features but cost more to use. One excellent coordinate does not establish that all quantities needed for control are represented.</details>

<!-- PAGE: IX · Reading the evidence | Surprise is evidence of mismatch -->
## Surprise is evidence of mismatch

A simple latent surprise score is

$$S_t=\|\hat z_{t+1}-E(o_{t+1})\|^2.$$

It measures discrepancy between an expected embedding and the observed one. A violation-of-expectation experiment compares scores on ordinary events and deliberately perturbed ones.

LeWM tests visual changes and physical discontinuities such as teleportation. Higher error on disrupted motion suggests sensitivity to learned temporal regularities. It is not a proof of general physical reasoning: an unusual appearance or an out-of-distribution artifact can also raise error. [LeWM v1, §5.2 and Appendix F.3](https://arxiv.org/pdf/2603.19312v1)

A useful experiment includes matched controls: change color without changing motion, change motion without changing irrelevant appearance, and keep perturbation timing and magnitude comparable. Evaluate both false alarms and missed violations, not just striking example plots.

If one summarizes discrimination with area under a receiver-operating curve, its rank interpretation is the probability that a random positive event receives a higher score than a random negative event, with half credit for ties. Estimate it by counting such pairs. This is an additional evaluation option, not a claim about which metric every figure in the paper reports.

<details><summary>Try it first: sensitivity versus specificity</summary>A model that assigns huge error to every frame detects all violations but also flags every normal event. Detection is only useful relative to ordinary-event behavior. A raw error increase must be interpreted against that baseline and its variability.</details>

<!-- PAGE: IX · Reading the evidence | Pictures of latent space are not the space -->
## Pictures of latent space are not the space

A high-dimensional embedding is difficult to plot. Dimensionality reduction creates a two-dimensional picture, but the drawing can distort distances, density, and topology.

Principal component analysis, or PCA, chooses a unit direction $u$ maximizing projected sample variance $u^\top Cu$. Introduce a multiplier for $u^\top u=1$ and differentiate:

$$\nabla_u(u^\top Cu-\lambda(u^\top u-1))=2Cu-2\lambda u=0.$$

Thus principal directions are covariance eigenvectors, with the largest eigenvalue giving maximal variance. Subsequent orthogonal directions capture remaining variance. This explains PCA's objective, not a guarantee that the most variable directions are the most meaningful.

Nonlinear methods such as t-SNE emphasize certain neighborhood relationships and can display appealing clusters. Their layout depends on settings and optimization. Distances between far-apart groups on the plot do not automatically reflect corresponding distances in the original representation.

LeWM uses latent visualizations alongside probes and control experiments. Read them as qualitative illustrations. A convincing cluster plot is not a substitute for testing whether a controller can distinguish relevant states and select successful actions. [LeWM v1, §5.1](https://arxiv.org/pdf/2603.19312v1)

<details><summary>Try it first: a deceptive two-dimensional view</summary>Project a three-dimensional helix onto its circular cross-section. Points separated far along the helix can appear adjacent in the plot. A visualization can hide a dimension that matters for prediction. Always ask which relationships the projection was designed to preserve.</details>

<!-- PAGE: IX · Reading the evidence | Straight paths, carefully interpreted -->
## Straight paths, carefully interpreted

For a latent trajectory, define increments $v_t=z_{t+1}-z_t$. Temporal straightness averages the cosine between adjacent increments:

$$S=\frac1{B(T-2)}\sum_{b=1}^B\sum_{t=1}^{T-2}
\frac{(v_t^{(b)})^\top v_{t+1}^{(b)}}
{\|v_t^{(b)}\|\|v_{t+1}^{(b)}\|}.$$

This formula is a chosen descriptive statistic. Its denominator has $T-2$ adjacent increment pairs because $T$ observations produce $T-1$ increments.

If every nonzero increment points in the same direction, $S=1$. A reversal gives cosine $-1$. Orthogonal consecutive changes give zero. Changing speeds without changing direction does not reduce cosine similarity.

Zero increments make the ratio undefined. Code must exclude such pairs or adopt an explicit numerical convention. Adding $\epsilon$ to a denominator is a practical choice that changes values near zero; it should not turn collapse into evidence of meaningful straightness.

LeWM reports increasing straightness during training without an explicit straightness loss. That is an empirical observation and a proposed interpretation, not a proof that the environment becomes physically linear in its learned coordinates. [LeWM v1, Appendix H](https://arxiv.org/pdf/2603.19312v1)

An invertible nonlinear change of coordinates can bend or straighten trajectories. A straight path in representation space is useful only insofar as that geometry helps prediction or control and preserves necessary distinctions.

<details><summary>Try it first: a stationary sequence</summary>If $z_t=c$ always, every increment is zero. The formula is undefined, not one. A system claiming perfect straightness for that sequence has chosen a convention that must not be mistaken for a geometric result.</details>

<!-- PAGE: IX · Reading the evidence | Reading a speed claim -->
## Reading a speed claim

The target paper reports a compact model of about fifteen million parameters and planning speedups up to 48 times relative to its foundation-model comparison. Those are measured claims under specified environments, hardware, and search settings. They are not universal ratios for every implementation or task. [LeWM v1, Figures 3 and 6, Appendix D](https://arxiv.org/pdf/2603.19312v1)

A rough planning-work decomposition is

$$\text{work}\approx\text{encoding work}
+I\,N\,H\,\text{predictor work},$$

where $I$ is search iterations, $N$ candidate sequences, and $H$ horizon. This is a counting model, not a wall-clock identity. Batching, caching, token count, memory traffic, and accelerator utilization change actual time.

A tiny improvement in predictor cost can matter greatly because planning repeats it many times. Conversely, a more expensive representation may improve search quality enough to need fewer iterations. Compare success at matched compute as well as time at matched settings.

When reading “48 times faster,” check whether the denominator includes image encoding, optimization, environment interaction, data transfer, and compilation warmup. A planning call below one second is not automatically a one-kilohertz controller; the unit of measurement matters.

<details><summary>Try it first: count transitions</summary>With 300 candidates, 30 iterations, and horizon five, a simple unshared calculation evaluates 45,000 candidate transitions per planning call. That count explains why compact latent computation can matter even when the neural network is modest by modern standards.</details>

<!-- PAGE: IX · Reading the evidence | Ablations ask a counterfactual question -->
## Ablations ask a counterfactual question

An ablation changes or removes one component to ask whether it caused an improvement. The most informative comparison holds other relevant conditions fixed: data, compute budget, evaluation starts, and tuning effort.

For a regularizer, compare several weights including zero, with matched nondegenerate initializations and multiple seeds. Track prediction loss, embedding spread, projected-distribution discrepancy, and downstream control. A worsening regularizer value alone does not identify the practical failure.

Adding a reconstruction loss asks whether pixel recovery helps under that architecture, dataset, loss scale, and compute allocation. A worse result in one setting does not prove that all generative learning is harmful. Likewise, robustness across several tested architectures is evidence of flexibility within that collection, not architecture independence in all possible systems.

A hyperparameter plot may suggest a broad useful range. It does not prove monotonicity. Bisection requires a reliably bracketed sign change for root finding, or additional structure for an optimization variant. A noisy nonmonotone success curve cannot generally be optimized by ordinary bisection with a universal logarithmic guarantee.

Dropout randomly sets activations to zero during training. With drop probability $p$, multiplying retained values by $1/(1-p)$ preserves their conditional expectation: $(1-p)x/(1-p)+p\cdot0=x$. It changes the training problem; preserving the mean does not preserve every nonlinear output. LeWM's ablations cover representation size, projections, regularizer weight, predictor size, decoder loss, encoder architecture, and dropout. They are useful entry points for reproducing specific questions. [LeWM v1, Appendix G](https://arxiv.org/pdf/2603.19312v1)

<details><summary>Try it first: a misleading removal</summary>Removing a loss term while keeping a learning rate tuned only for the full objective can conflate the term's conceptual value with optimizer mismatch. Report both a tightly controlled removal and a reasonably retuned baseline when resources allow.</details>

<!-- PAGE: IX · Reading the evidence | The reinforcement-learning baselines -->
## The reinforcement-learning baselines

A policy $\pi(a\mid s,g)$ chooses actions for state $s$ and goal $g$. A reward $r(s,g)$ evaluates immediate desirability. With discount $0\leq\gamma<1$, define a return

$$G_t=r_t+\gamma r_{t+1}+\gamma^2r_{t+2}+\cdots.$$

Factoring the remaining series gives $G_t=r_t+\gamma G_{t+1}$. Taking a conditional expectation under a fixed policy yields its Bellman relation: current value equals expected immediate reward plus discounted next value.

A state value $V(s,g)$ averages returns from a state; an action value $Q(s,a,g)$ additionally conditions on the first action. A critic learns these values. A squared Bellman regression uses a target such as $r+\gamma mV(s',g)$, with mask $m=0$ when no future reward should be counted.

This target contains a learned estimate, so training is **bootstrapped**. A low regression error does not by itself establish accurate long-run values, especially outside the offline dataset's action coverage.

LeWM compares against goal-conditioned offline reinforcement-learning methods and behavioral cloning. Those baselines optimize behavior or value using their own objectives; the world-model training objective itself remains reward-free. For goal-conditioned baselines, rewards may be defined or relabeled from goal relations rather than supplied as original dataset rewards. [LeWM v1, Appendix C](https://arxiv.org/pdf/2603.19312v1)

<details><summary>Try it first: why discount?</summary>With bounded rewards $|r_t|\leq R$ and $\gamma<1$, absolute return is at most $R\sum_k\gamma^k=R/(1-\gamma)$. Discounting makes the infinite sum finite and expresses a time preference. It is a design choice, not a property of physics.</details>

<!-- PAGE: IX · Reading the evidence | Expectiles and weighted imitation -->
## Expectiles and weighted imitation

Implicit Q-learning uses an asymmetric squared loss. For residual $u=y-v$ and $0<\tau<1$, define

$$\ell_\tau(u)=|\tau-\mathbf1(u<0)|u^2.$$

Positive residuals receive weight $\tau$; negative residuals receive $1-\tau$. At $\tau=1/2$, the minimizer is the mean. For larger $\tau$, underestimation costs more and the fitted value shifts upward. Differentiating the expected loss gives the balance condition

$$\tau\,\mathbb E[(Y-v)_+]=(1-\tau)\mathbb E[(v-Y)_+],$$

where $x_+=\max(x,0)$. This derives the expectile's defining condition. An expectile is not a quantile: it balances weighted distances, not merely probability mass on each side.

A value advantage compares an action's outcome with a state baseline. One form is $A=r+\gamma V(s',g)-V(s,g)$. Advantage-weighted regression trains a policy toward recorded actions, weighting examples by $e^{\beta A}$. This positive weighting favors actions estimated better than the baseline; $\beta$ determines how strongly.

Behavioral cloning instead fits recorded actions directly, often with $\mathbb E\|\pi(s,g)-a\|^2$. All these are chosen objectives with modeling assumptions. They are included here so the final paper's baseline appendix does not become an unexplained wall of notation.

<details><summary>Try it first: a two-point expectile</summary>If $Y$ is equally likely zero or one and $0<v<1$, the balance condition is $\tau(1-v)=(1-\tau)v$, giving $v=\tau$. With $\tau=0.8$, the fitted value is $0.8$, whereas the mean remains $0.5$.</details>

<!-- PAGE: X · The paper in your hands | An equation-by-equation reading map -->
## An equation-by-equation reading map

Open the exact [LeWorldModel v1 PDF](https://arxiv.org/pdf/2603.19312v1). Read §3 before the results. Translate each symbol into a role and check its shape before following the surrounding claims.

| Paper item | Meaning | Book pages |
|---|---|---|
| Encoder / predictor definition | Describe an observation; forecast a description | 31–32, 61–66 |
| Eq. (1), prediction loss | Agreement of predicted and observed next embeddings | 23–24, 28, 67 |
| Eq. (2), SIGReg | Average projected distribution discrepancy | 46–60 |
| Eq. (3), combined objective | Prediction plus anti-collapse pressure | 25, 35, 67–69 |
| Eqs. (4–5), goal cost and optimization | Rank imagined futures; search actions | 71–77 |
| Appendix A, projection and EP statistic | Characteristic functions and numerical integration | 48–59 |
| Appendix B, CEM | Fit a sampling distribution to elite plans | 74–75 |
| Appendix C, baseline objectives | Alternative representation and control recipes | 39–44, 89–90 |
| Appendix H, Eq. (9) | Cosine of consecutive latent increments | 9, 86 |

For §4, identify each evaluation's data, goal sampling, action budget, and compute budget. For §5, distinguish accessible physical information, decoded visualizations, latent geometry, and violation detection. They are complementary observations, not interchangeable proofs.

Finally read the limitations before returning to the abstract. The method's concrete contribution is easier to appreciate once its scope is precise. The ambition of world modeling should not erase the distinction between an encouraging experiment and a general theory of intelligence.

<!-- PAGE: X · The paper in your hands | A careful reader's questions -->
## A careful reader's questions

A research-level reading asks what would have to be true for each inference to follow.

**“Gaussian embeddings prevent collapse.”** In the population ideal, matching a full-rank Gaussian excludes a constant or lower-dimensional Gaussian cloud. In finite training, the statistic is approximate, the optimization may be imperfect, and collapsed stationary configurations can exist. Ask which mathematical and experimental claim is being made.

**“The representation understands physics.”** Which quantities are accessible to probes? Which violations are distinguished from visual novelty? Does the planner exploit those quantities successfully? Recoverability, anomaly detection, and controlled behavior provide different evidence.

**“Only one hyperparameter.”** Which loss coefficients are being counted? What remains fixed in the architecture, optimizer, data, normality sketch, and planner? Reducing tuning burden is valuable without pretending other choices disappear.

**“Faster planning.”** Is success comparable at matched time or compute? Are pretrained resources and auxiliary sensor inputs disclosed? Is the measurement a single model step, a solver call, or end-to-end execution?

**“Cramér–Wold guarantees the distribution.”** Is the argument about every population projection or a finite empirical sketch? The theorem establishes identification under exact conditions, not automatic semantic recovery or finite-sample optimization success.

<details><summary>Try it first: write a defensible one-sentence conclusion</summary>“Under the paper's tested offline visual-control settings, jointly learned predictive embeddings with Gaussian distribution regularization provide a compact and effective basis for planning, while broader generalization, long-horizon reasoning, and theoretical guarantees for the finite training system remain open.” This preserves the contribution and its scope.</details>

<!-- PAGE: X · The paper in your hands | A reproduction that can teach you something -->
## A reproduction that can teach you something

Begin with the numerical objective, before expensive training. Compare characteristic-function quadrature against the closed-form integral on small fixed samples. Check gradients by finite differences with fixed directions. Verify every reduction axis and the factor of batch size.

Then collect a small environment dataset with varied states and actions. Separate complete episodes. Choose a sensor whose history can plausibly reveal the needed state. A failed model cannot teach a missing variable into an uninformative observation.

Build a modest encoder and predictor. Record initialization, shapes, normalization, action alignment, optimizer, and loss reductions. Track held-out prediction, rollout error, covariance spectrum, and projected mismatch. Compare against persistence and an unregularized matched run; do not select a seed merely because it produces a dramatic collapse illustration.

Freeze the model and add planning. The planner must query only learned dynamics and permitted observations. Use simulator state solely for evaluation. A separate display readout must never silently become the planner's true-state oracle.

Finally vary goals with unchanged weights, and test appearance changes separately from changed mechanics. Repeat across seeds and compare at matched planning budgets. Report failures alongside successes.

<details><summary>Try it first: the minimum useful experiment log</summary>Save the data-generation seed and split, model and optimizer settings, code commit, exact objective convention, training curves, checkpoint, planner settings, and per-episode outcomes. A screenshot of a successful trajectory is a story; these records make it an inspectable experiment.</details>

<!-- PAGE: X · The paper in your hands | Capstone: repair a broken world model -->
## Capstone: repair a broken world model

A colleague gives you this design:

> One image goes through an encoder. Its output is normalized to length one. A predictor receives the output and the next action. The target encoder is trained jointly. The prediction loss is squared error. For regularization, each feature is standardized across the batch, and only coordinate-axis projections are compared with a Gaussian. All frames are randomly split into train and test. Planning rolls out twenty steps, then executes all twenty without observing. A decoder shows attractive movies, and a t-SNE plot has clear clusters.

Your task is to analyze it without assuming every decision is automatically wrong.

1. Which observation ambiguities could remain?
2. Is the regularizer compatible with unit-length embeddings?
3. What information does per-feature standardization conceal?
4. Why can coordinate projections miss dependence?
5. What does the split actually estimate?
6. What changes between one-step training and rollout?
7. What evidence would the decoder and plot provide?
8. Which three measurements would you run first?

Write your own answer before turning the page. For each proposed repair, state the failure it addresses and a test that could show the repair was unnecessary. Research judgment improves when we replace blanket rules with explicit conditions.

**A useful standard:** someone else should be able to implement your proposed experiment and obtain a result that could change your mind. “Make it more robust” is not yet a reproducible instruction.

<!-- PAGE: X · The paper in your hands | Capstone: a worked diagnosis -->
## Capstone: a worked diagnosis

A single image may hide velocity or other state. Test whether identical visible configurations have different next observations under the same action. Add aligned history if it reduces that ambiguity; do not assume a fixed history length solves all partial observability.

Unit normalization confines embeddings to a sphere. A full-dimensional Gaussian has variable radius, so exact matching is incompatible. Move the distribution objective to an unconstrained projected representation or change the target deliberately, recognizing that this changes the method.

Per-feature standardization hides mean and scale errors, including shrinking variance before standardization. It also does not remove general dependence. Coordinate tests miss the $X=(G,SG)$ counterexample, so use oblique projections and inspect multiple seeds.

A frame-level split can leak near-duplicates. Split episodes or collection conditions and report what distribution the test represents. Compare one-step error with open-loop error across horizon; twenty transitions may take predictions far outside the training region.

The decoder shows what its readout can reconstruct. The t-SNE plot offers a particular visualization. Neither proves successful intervention. Evaluate actual goal-reaching behavior with a documented cost and action budget.

My first three measurements would be held-out rollout error by horizon, projected-distribution diagnostics before standardization, and closed-loop control success against persistence/random-action baselines. Add probe and visualization studies after these core interfaces are trustworthy.

A twenty-step open-loop plan can work in accurate deterministic dynamics. The proposed repair is therefore to compare execution cadences under controlled model mismatch, not to declare every open-loop controller invalid.

<!-- PAGE: X · The paper in your hands | A deeper proof: why Gaussian smoothness is special -->
## A deeper proof: why Gaussian smoothness is special

Let $p(x)>0$ be a smooth density on $\mathbb R^d$, with mean zero, covariance $\Sigma\succ0$, and sufficient tail decay for integration by parts. Define the **score** $s(x)=\nabla\log p(x)$ and $J(p)=\mathbb E\|s(X)\|^2$.

Integrating $\partial_j(x_ip(x))$ over space gives zero boundary contribution, so $\mathbb E[X_i s_j(X)]=-\delta_{ij}$. Now expand a nonnegative square:

$$\begin{aligned}
0&\leq\mathbb E\|s(X)+\Sigma^{-1}X\|^2\\
&=J(p)-2\operatorname{tr}(\Sigma^{-1})
+\operatorname{tr}(\Sigma^{-2}\Sigma)\\
&=J(p)-\operatorname{tr}(\Sigma^{-1}).
\end{aligned}$$

Equality requires $s(x)=-\Sigma^{-1}x$ almost everywhere. Integrating this gradient gives $\log p(x)=c-\tfrac12x^\top\Sigma^{-1}x$, the Gaussian density after normalization. At fixed $\operatorname{tr}\Sigma$, page 45 shows the inverse trace is minimized by equal eigenvalues. This proves a precise smooth-density criterion favoring an isotropic Gaussian.

Why does this criterion enter probe theory? A local symmetric kernel smoother has, by a second-order Taylor expansion of numerator and denominator, leading bias proportional to

$$h^2\left(\tfrac12\Delta g+\nabla g^\top\nabla\log p\right).$$

Here $g$ is the target function, $h$ the kernel width, and $\Delta g$ the sum of its second coordinate derivatives. Odd terms cancel by kernel symmetry; expanding $\Delta(gp)=p\Delta g+2\nabla g^\top\nabla p+g\Delta p$ and canceling denominator terms gives the expression. Smoothness, tail, kernel, and task-family assumptions matter. This is a supporting bridge to LeJEPA's probe analysis, not a proof that every downstream task or finite neural training run has a Gaussian optimum. [LeJEPA, Appendices A–B](https://arxiv.org/pdf/2511.08544v1)

<!-- PAGE: Reference | A glossary without the fog -->
## A glossary without the fog

| Term | Plain meaning |
|---|---|
| Abstraction | Retaining some distinctions while discarding others. |
| Action conditioning | Making predictions depend on the action supplied. |
| Anti-collapse | Discouraging identical or insufficiently varied representations. |
| Autoregressive rollout | Feeding a model's predictions into later predictions. |
| Characteristic function | The average rotating arrow $\mathbb E[e^{itX}]$ at every frequency. |
| Embedding / latent | A numerical description produced by a representation map. |
| End-to-end | Jointly adjusting connected trainable components through an objective. |
| Equivariance | A known input change produces a corresponding representation change. |
| Generalization | Performance on specified data not used for fitting. |
| Invariance | A chosen input change leaves the representation unchanged. |
| Isotropic | No preferred direction; specify whether referring to covariance or a whole distribution. |
| JEPA | Joint-Embedding Predictive Architecture; a family, not one fixed recipe. |
| Normality | Agreement with a Gaussian distribution under a stated test or criterion. |
| Offline | Training from an already collected, fixed dataset. |
| Probe | A separately fitted readout used to evaluate accessible information. |
| Regularization | A preference or constraint added to the fitting problem. |
| Reward-free | No reward labels used for the stated world-model training objective. |
| SIGReg | Sketched Isotropic Gaussian Regularization. |

If a word still feels slippery, return to its operational definition: what arrays go in, what number comes out, and what observation could show that it failed?

<!-- PAGE: Reference | A symbol ledger -->
## A symbol ledger

| Symbol | Role and typical shape |
|---|---|
| $s_t$ | Physical state, generally not given to the visual learner. |
| $\obs_t$ | Observed image at time $t$. |
| $\act_t$ | Action or aligned action block. |
| $E_\theta$ | Encoder with trainable parameters $\theta$. |
| $\lat_t$ | Encoded observation, $d$ coordinates. |
| $P_\phi$ | Predictor with trainable parameters $\phi$. |
| $\pred_{t+1}$ | Predicted next embedding; the hat means estimated. |
| $Z$ | A batch or time-by-batch tensor of embeddings; check axes. |
| $B,T,d,M,K$ | Batch size, sequence length, feature width, directions, frequency nodes. |
| $u_m$ | Unit projection direction in $\mathbb R^d$. |
| $h_b=u_m^\top z_b$ | Scalar projection of example $b$. |
| $\varphi,\hat\varphi_B$ | Population and empirical characteristic functions. |
| $t$ in $\varphi(t)$ | Frequency; distinct from a trajectory time index. |
| $\Sigma,C$ | Population covariance and sample covariance. |
| $\lambda$ | Weight balancing the two training terms. |
| $H$ | Number of planned transitions under this book's indexing. |
| $\mathbb E,\operatorname{Var},\operatorname{Cov}$ | Expectation, variance, covariance. |
| $\|x\|,x^\top y,\odot$ | Euclidean norm, dot product, coordinate-wise product. |
| $\theta,\bar\theta$ | Online and moving-average parameters when a teacher is used. |

Symbols are reused across papers. In particular, $N$ may mean sample count or history length, and $T$ may mean a statistic or a sequence length. Read local definitions rather than assuming one universal notation.

<!-- PAGE: Reference | The primary-source reading shelf -->
## The primary-source reading shelf

These are the core papers, in a pedagogical rather than strictly chronological order. The linked versions are fixed so that the course does not silently change underneath you.

**LeCun (2022).** [A Path Towards Autonomous Machine Intelligence](https://openreview.net/forum?id=BZ5a1r-kVsf). Read for the larger architecture and distinction between world knowledge and objectives. It is a position paper, not an experimental validation of the entire program. The official PDF download was blocked during preparation; its public abstract and accessible text informed the brief orientation here.

**Bardes, Ponce & LeCun (2021/2022).** [VICReg](https://arxiv.org/pdf/2105.04906v1). Read §3 for the separate roles of agreement, variance, and covariance.

**Assran et al. (2023).** [Self-Supervised Learning from Images with a Joint-Embedding Predictive Architecture](https://arxiv.org/pdf/2301.08243v1). Read for context/target prediction and the moving teacher.

**Bardes et al. (2024).** [Revisiting Feature Prediction for Learning Visual Representations from Video](https://arxiv.org/pdf/2404.08471v1). Read for the video representation-learning setting.

**Assran et al. (2025).** [V-JEPA 2](https://arxiv.org/pdf/2506.09985v1). Read for connecting large-scale video pretraining with action-conditioned planning.

**Zhou et al. (2024).** [DINO-WM](https://arxiv.org/pdf/2411.04983v1). Read for dynamics on pretrained visual features.

**Sobal et al. (2025).** [Learning from Reward-Free Offline Data: A Case for Planning with Latent Dynamics Models](https://arxiv.org/pdf/2502.14819v1). Read for data quality, generalization protocols, and the planning/RL comparison.

Downloaded copies of these arXiv versions accompany the project in `papers/`. The single HTML remains readable without them; follow the links when you want the primary evidence.

<!-- PAGE: Reference | The destination, and what comes after -->
## The destination, and what comes after

**Balestriero & LeCun (2025).** [LeJEPA: Provable and Scalable Self-Supervised Learning Without the Heuristics, v1](https://arxiv.org/pdf/2511.08544v1). Focus on §3's assumptions, §4's distribution matching, and the proofs in Appendices A–B. Its open license is CC BY-SA 4.0; this book's mathematical exposition is independently written, with source attribution.

**Maes, Le Lidec, Scieur, LeCun & Balestriero (2026).** [LeWorldModel: Stable End-to-End Joint-Embedding Predictive Architecture from Pixels, v1](https://arxiv.org/pdf/2603.19312v1). The requested destination. Method in §3; evidence in §§4–5; statistics and implementation in the appendices. This version is CC BY 4.0. Equations are explained in new notation and prose; no paper figures are reproduced.

**Epps & Pulley (1983).** [A test for normality based on the empirical characteristic function](https://doi.org/10.1093/biomet/70.3.723). Historical source for the statistic family. The fixed-target training implementation is documented by the LeJEPA/LeWM sources; the original article was not downloaded in this edition.

**Implementation reference.** [Authors' SIGReg code at pinned commit](https://github.com/lucas-maes/le-wm/blob/8edfeb336732b5f3ce7b8b210d0ba370a09e2cac/module.py). Compare it with pages 57–59 and 69. A dated source ledger and checksums accompany the project.

You can now ask sharper questions: which state distinctions survive, which distributions are actually matched, which errors compound, and which interventions have been tested? The next step is to build an experiment that can answer one of them.

The puck has not become intelligent because we drew its possible futures. We have learned what must connect the drawing to evidence: observations, an honest objective, a useful representation, a predictive model, a goal, and a measured action.
