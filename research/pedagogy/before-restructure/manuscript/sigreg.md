# A distribution, not a destination

<p class="lead">We want different observations to become useful descriptions. How do we prevent the learner from making every description the same?</p>

Imagine teaching a student to translate between two languages while letting the student invent both languages. You ask whether the translations agree. The student invents a language with one word and uses it for everything. Translation is now flawless; communication is impossible.

A joint-embedding predictor faces a related loophole. The encoder chooses the descriptions that the predictor learns to predict. The prediction objective alone can reward perfect agreement between descriptions that no longer distinguish the world. We need a second preference that makes this solution unattractive.

This chapter constructs **SIGReg**, Sketched Isotropic Gaussian Regularization. “Sketched” refers to replacing a high-dimensional distributional comparison with randomized, lower-dimensional measurements; here we examine one-dimensional projections. “Isotropic Gaussian” names a distribution with equal spread in every direction. “Regularization” means that we add a preference to the main learning objective. Each word will become a precise operation.

We will move from a concrete failure to a distributional target, from that target to a measurable discrepancy, and from the discrepancy to executable code and gradients. The real model in the following chapter uses the same finite-sum recipe developed here.

## 1 · The agreement loophole

Let an encoder $f_\theta$ map every observation to a vector $\lat\in\mathbb R^d$. The notation $\mathbb R^d$ means an ordered list of $d$ real numbers. Suppose a predictor $g_\psi$ predicts the next vector. For one example, define

$$\loss_{\mathrm{pred}}=\sum_{j=1}^{d}(\pred_j-\lat_{\mathrm{next},j})^2.$$

The summation instructs us to add the $d$ coordinate-wise squared errors. Every square is nonnegative. Therefore the loss cannot be less than zero. If the encoder always returns a fixed vector $c$ and the predictor always returns $c$, each difference is zero. This attains the smallest possible prediction loss.

That construction proves that a collapsed solution exists. It does not prove that every optimizer must find it, or that every architecture can represent every possible constant. In the neural networks used here, constant outputs are easy to represent using biases and zero weights.

Complete collapse maps everything to one point. **Dimensional collapse** preserves variation in fewer directions than the embedding nominally provides. An eight-coordinate vector can vary along only one line. The number of slots in the vector then exaggerates the number of independently varying directions.

We introduce a regularizer $\reg$ and define a total objective:

$$\loss=\loss_{\mathrm{pred}}+\lambda\reg,\qquad\lambda\geq0.$$

This is a modeling choice. The two terms express two preferences, and $\lambda$ controls their relative influence. Multiplying a term by 100 while holding $\lambda$ fixed changes the objective. That is why reductions such as “sum” versus “mean” are part of the mathematical specification.

<div class="question">

**Before proceeding:** would merely requiring nonzero embeddings prevent collapse? No. The constant vector $(100,100)$ has large length but carries no distinctions. We need a property of the *collection* of representations.

</div>

## 2 · What it means to regularize a collection

Suppose we have two data points $(x,y)=(1,1)$ and $(2,2)$ and fit a line through the origin, $\hat y=wx$. A squared-error objective is

$$L(w)=(w-1)^2+(2w-2)^2=5(w-1)^2.$$

Adding a weight penalty gives $L_\lambda(w)=5(w-1)^2+\lambda w^2$. Differentiate each square using the chain rule:

$$L_\lambda'(w)=10(w-1)+2\lambda w.$$

Setting this derivative to zero gives $(10+2\lambda)w=10$, hence $w=5/(5+\lambda)$. The second derivative is $10+2\lambda>0$, so this is the unique minimum. A larger coefficient selects a smaller slope, sacrificing some fit to satisfy the added preference.

This is regularization in a familiar scalar setting. SIGReg makes a different preference. It acts on the distribution of outputs of the encoder, rather than simply making network weights small.

A **batch** is a finite collection of examples processed together. Write its embeddings as rows of a matrix $\Z\in\mathbb R^{B\times d}$, where $B$ is the number of examples. The $b$-th row is $\lat_b$. An empirical distribution places probability $1/B$ on each row. A population distribution describes the embeddings that would arise from the full observation-generating process.

These are different objects. A batch of 64 points is not literally a continuous Gaussian density. The finite regularizer measures a discrepancy estimated from samples. The cleanest theoretical statements usually concern a population limit.

## 3 · A plausible idea that pulls the wrong way

We want a spread-out cloud. Why not draw a Gaussian target for each embedding and pull the embedding toward it? Fix one embedding $\lat$, draw an independent random vector $G$ with mean zero and identity covariance, and consider $\|\lat-G\|^2$.

Expand the square coordinate by coordinate:

$$\|\lat-G\|^2=\sum_{j=1}^d(\lat_j^2-2\lat_jG_j+G_j^2).$$

The embedding is fixed while we average over the newly drawn target. The expectation of a sum is the sum of the expectations. Each $G_j$ has mean zero and second moment one. Therefore

$$\mathbb E_G\|\lat-G\|^2=\sum_{j=1}^d(\lat_j^2+1)=\|\lat\|^2+d.$$

The derivative with respect to coordinate $\lat_j$ is $2\lat_j$. Gradient descent subtracts a positive multiple of this derivative, moving toward zero. The independently sampled targets average out. This loss teaches each point to move toward the distribution's mean, not the collection to acquire its shape.

The distinction is between a destination for each point and a property of a distribution. We need measurements of the collection as a whole.

## 4 · Gaussian geometry, carefully

For a scalar random variable $X$, the mean is its expected value $\mu=\mathbb E[X]$. Variance measures squared deviations from that mean: $\operatorname{Var}(X)=\mathbb E[(X-\mu)^2]$. Expand the square and use $\mathbb E[X]=\mu$ to obtain $\operatorname{Var}(X)=\mathbb E[X^2]-\mu^2$.

For a vector $Z$, covariance records how pairs of coordinates vary together:

$$\Sigma_{jk}=\mathbb E[(Z_j-\mu_j)(Z_k-\mu_k)].$$

The diagonal entries are variances. A positive off-diagonal entry means that deviations in the two coordinates tend to have the same sign; a negative one means they tend to have opposite signs. A zero entry alone does not establish independence.

For example, choose a point uniformly on a circle of radius $\sqrt2$. Symmetry gives zero means. The coordinates are $\sqrt2\cos A$ and $\sqrt2\sin A$ for a uniformly distributed angle $A$. Since $\cos^2A=(1+\cos2A)/2$, its average is $1/2$. Thus both coordinate variances equal one. Since $2\sin A\cos A=\sin2A$, covariance is zero. Nevertheless the squared coordinates always add to two. Knowing one constrains the other. This distribution has identity covariance but is not Gaussian.

<figure class="diagram" data-diagram="families"></figure>

A scalar standard Gaussian has density

$$p(x)=\frac{1}{\sqrt{2\pi}}e^{-x^2/2}.$$

A density specifies probability per unit length; probability in an interval is its integral over that interval. A density value is not the probability of one exact point. The coefficient above makes the integral over the real line equal one.

<details><summary>Required derivation · where the Gaussian normalization comes from</summary>

Let $I=\int_{-\infty}^{\infty}e^{-x^2/2}\,dx$. Squaring it forms a two-dimensional integral:

$$I^2=\int_{\mathbb R^2}e^{-(x^2+y^2)/2}\,dx\,dy.$$

The integrand depends only on distance $r$ from the origin. A thin annulus of radius $r$ and thickness $dr$ has area approximately $2\pi r\,dr$, with the relative error vanishing as the thickness goes to zero. Equivalently, polar coordinates have area element $r\,dr\,d\alpha$. Therefore

$$I^2=2\pi\int_0^\infty re^{-r^2/2}\,dr=2\pi\int_0^\infty e^{-v}\,dv=2\pi,$$

where $v=r^2/2$ gives $dv=r\,dr$. The last integral is one because an antiderivative of $e^{-v}$ is $-e^{-v}$. Since $I$ is positive, $I=\sqrt{2\pi}$. Nonnegative integrands justify combining these integrals; one can first integrate over bounded regions and then increase the regions.

Odd symmetry gives the mean zero. For the variance, use $p'(x)=-xp(x)$ and integration by parts:

$$\int x^2p(x)\,dx=-\int xp'(x)\,dx=-[xp(x)]_{-\infty}^{\infty}+\int p(x)\,dx=1.$$

The boundary term is zero because the Gaussian exponential decays faster than $|x|$ grows. All integrals in this display cover the real line.

</details>

Take $d$ independent standard Gaussian coordinates. Independence makes the joint density the product of the scalar densities:

$$p_0(z)=(2\pi)^{-d/2}\exp\!\left(-\tfrac12\sum_{j=1}^d z_j^2\right).$$

The exponent depends only on distance from the origin. Rotating the coordinate system preserves that distance, so the density does not favor a direction. This is **isotropy**. Its covariance is the identity matrix $I_d$: ones on the diagonal and zeros elsewhere.

## 5 · Why target this distribution?

The standard Gaussian offers a noncollapsed reference with no preferred direction and a known analytic form. Those properties make it a useful target, but they do not prove that every useful representation must be Gaussian.

LeJEPA develops a more specific theoretical motivation involving downstream prediction risk under stated assumptions. The [following theory chapter](#theory) develops its probes, function classes, score identities, and regularity conditions. We should not replace it with the unrestricted claim “Gaussian representations are optimal for every task.” Here we establish a narrower geometric motivation and derive the actual regularizer.

Another useful fact is that, among densities with mean zero and identity covariance, the standard Gaussian maximizes differential entropy. Entropy is a measure of distributional spread with a precise definition; it is not synonymous with meaning, information about a task, or model quality.

<details><summary>Required derivation if using the entropy argument · define the quantities and prove the claim</summary>

For a density $p$, define differential entropy by $H(p)=-\int p(z)\log p(z)\,dz$, when the integral exists. Unlike discrete entropy, this number depends on the units of the coordinates and can be negative. Define the relative entropy, or KL divergence, from $p$ to $q$ by $\operatorname{KL}(p\|q)=\int p\log(p/q)$, subject to the needed integrability and support conditions.

To prove nonnegativity, start with $\log u\leq u-1$ for $u>0$. Indeed, $u-1-\log u$ has derivative $1-1/u$, decreases up to $u=1$, then increases, and equals zero there. Apply the inequality to $u=q/p$ where $p>0$, multiply by $p$, and integrate. This gives $\int p\log(q/p)\leq\int_{p>0}q-1\leq0$. Hence KL is nonnegative.

For the Gaussian reference, $\log p_0(z)=-(d/2)\log(2\pi)-\|z\|^2/2$. If $p$ has mean zero and identity covariance, its expected squared norm is $d$, since this expectation is the sum of its coordinate second moments. Consequently

$$\operatorname{KL}(p\|p_0)=-H(p)+\frac d2\log(2\pi)+\frac d2.$$

Substituting $p=p_0$ shows that the last two terms equal $H(p_0)$. Nonnegativity therefore yields $H(p)\leq H(p_0)$, with equality, under these conditions, only when the densities agree almost everywhere.

This statement concerns densities satisfying the moment constraints. A finite empirical distribution consists of point masses and has no ordinary density with respect to volume. Plugging a histogram or kernel density estimate into KL requires additional choices. Smooth density estimates are possible, but high-dimensional estimation and the resulting optimization problem are not free.

</details>

We have only a batch of embeddings. We would like a distributional measurement that can be computed directly from those samples, differentiated with respect to them, and compared with an exactly known Gaussian target. Characteristic functions supply such measurements.

## 6 · From a point on a circle to a distributional fingerprint

A complex number $a+ib$ can be represented as a point $(a,b)$ in a plane, where $i^2=-1$. Its real coordinate is $a$ and imaginary coordinate is $b$. Addition is ordinary vector addition. Multiplication by $i$ sends $a+ib$ to $-b+ia$, rotating the point by a quarter turn.

The complex conjugate of $a+ib$ is $a-ib$. Multiplying them gives $a^2+b^2$, because the two cross terms cancel and $i^2=-1$. Thus the squared magnitude is

$$|a+ib|^2=(a+ib)(a-ib)=a^2+b^2.$$

Euler's identity relates a complex exponential to the unit circle:

$$e^{it}=\cos t+i\sin t.$$

<details><summary>Required derivation · Euler's identity from power series</summary>

For any fixed finite $t$, define the exponential by its convergent power series. Convergence follows because the ratio of consecutive absolute terms, $|t|/(n+1)$, eventually becomes less than any fixed number below one; the tail is then bounded by a geometric series. Absolute convergence permits separating even and odd terms:

$$e^{it}=\sum_{n=0}^{\infty}\frac{(it)^n}{n!}=\sum_{k=0}^{\infty}\frac{(-1)^kt^{2k}}{(2k)!}+i\sum_{k=0}^{\infty}\frac{(-1)^kt^{2k+1}}{(2k+1)!}.$$

The first series is the Taylor series of cosine and the second of sine. Taylor's remainder tends to zero for each finite $t$: the derivatives of sine and cosine have magnitude at most one, so their remainder is bounded by $|t|^{n+1}/(n+1)!$. This establishes the equality. Since $\cos^2t+\sin^2t=1$, the resulting point has unit magnitude.

</details>

For a real sample $x$, choose a real **frequency** $\freq$ and form $e^{i\freq x}$. It is a unit arrow whose angle is $\freq x$. Changing frequency changes how strongly different samples fan around the circle. Frequency here is a measurement setting; it is not the physical time index of the world model.

Now average the arrows for a random variable $X$. Its **characteristic function** is defined by

$$\cf_X(\freq)=\mathbb E[e^{i\freq X}]=\mathbb E[\cos(\freq X)]+i\mathbb E[\sin(\freq X)].$$

This expectation always exists: both sine and cosine are bounded, even when $X$ has no finite mean or variance. At frequency zero, every arrow points to $1$, so $\cf_X(0)=1$. A single frequency is only one measurement. The whole function over frequencies carries much more information.

For a fair variable that equals $-1$ or $1$, the imaginary terms cancel and the characteristic function is $\cos\freq$. For a constant zero, all arrows stay at $1$ and the function is identically one. We have already found a way to distinguish a spread-out distribution from a collapsed one.

<div id="phasor-lab" class="lab"><h3>Four samples become a complex mean</h3><p class="instruction">The samples are −1, −½, ½, 1. Predict what happens at frequency zero, then move the frequency. Violet arrows represent samples; teal is their mean; blue is the Gaussian target.</p><div class="controls"><label>Frequency ω <input type="range" min="0" max="6" step="0.01" value="1" aria-label="Characteristic function frequency"/></label></div><div class="panels"><div><canvas class="square" data-plot="phasors" width="360" height="360" aria-label="Sample phasors on a circular complex plane"></canvas><div class="plot-label">Average vectors, not angles</div></div><div><canvas class="square" data-plot="cf" width="360" height="360" aria-label="Real and imaginary empirical characteristic functions and Gaussian target"></canvas><div class="legend"><span class="pred">real mean</span><span class="lat">imaginary mean</span><span class="obs">Gaussian target</span></div></div></div><output></output><p class="lab-note">The samples are deliberately symmetric, so the imaginary mean is zero. Their real mean oscillates; the Gaussian target decays smoothly. These four points are not claimed to be a Gaussian sample.</p></div>

## 7 · Derive the Gaussian fingerprint

Let $X$ have the standard Gaussian density $p$. We claim that $\cf_X(\freq)=e^{-\freq^2/2}$. Rather than quoting a Fourier-transform table, derive an equation the function must satisfy.

Differentiate under the integral. This is legitimate here because the absolute derivative of $e^{i\freq x}p(x)$ is $|x|p(x)$, which is integrable and does not depend on frequency. Using $p'(x)=-xp(x)$ gives

$$\cf_X'(\freq)=\int ix e^{i\freq x}p(x)\,dx=-i\int e^{i\freq x}p'(x)\,dx.$$

Integration by parts says $\int uv'=uv-\int u'v$. Use $u=e^{i\freq x}$ and $v=p(x)$. The boundary term vanishes because $p(x)$ tends to zero and the complex exponential has magnitude one. Therefore

$$\cf_X'(\freq)=i\int i\freq e^{i\freq x}p(x)\,dx=-\freq\cf_X(\freq).$$

Multiply by $e^{\freq^2/2}$. By the product rule, the derivative of $e^{\freq^2/2}\cf_X(\freq)$ is zero. It is therefore constant. Its value at zero is one, giving

$$\target(\freq):=\cf_{\mathcal N(0,1)}(\freq)=e^{-\freq^2/2}.$$

The answer is real because a symmetric density makes the sine integral cancel. It is one at zero and approaches zero as the magnitude of frequency grows. We now have an exact target for each measurement setting.

<details><summary>Worked extension · what changes for a shifted or rescaled Gaussian?</summary>

If $Y=\mu+\sigma X$, then $e^{i\freq Y}=e^{i\freq\mu}e^{i(\sigma\freq)X}$. Taking the expectation gives

$$\cf_Y(\freq)=e^{i\mu\freq}e^{-\sigma^2\freq^2/2}.$$

A shift rotates the complex mean; a change in spread changes its rate of decay. This is why comparing both real and imaginary components matters. A shifted Gaussian is Gaussian, but it is not the specified standard Gaussian target.

</details>

## 8 · Estimate the fingerprint from a batch

For scalar samples $\proj_1,\ldots,\proj_B$, replace the population expectation by an average:

$$\ecf(\freq)=\frac1B\sum_{b=1}^B e^{i\freq\proj_b}=C(\freq)+iS(\freq),$$

where $C$ is the average cosine and $S$ the average sine. We can compute both from the samples alone. No histogram or density estimate is necessary.

The Gaussian target is real, so the squared complex discrepancy is

$$|\ecf(\freq)-\target(\freq)|^2=[C(\freq)-\target(\freq)]^2+S(\freq)^2.$$

This follows directly from the squared-magnitude identity, with real part $C-\target$ and imaginary part $S$. Both parts are needed. Averaging the magnitude of individual errors would be a different quantity; here we average the arrows first and then measure the discrepancy.

At one frequency, different sample distributions can agree. To gather many measurements, integrate over frequencies with a positive window. In this chapter choose $w(\freq)=e^{-\freq^2/2}$ and define

$$\disc_B=\int_{-\infty}^{\infty}|\ecf(\freq)-\target(\freq)|^2w(\freq)\,d\freq.$$

The window makes high frequencies contribute less and makes the integral finite. The integrand is bounded by $4w$, since each characteristic function has magnitude at most one. The Gaussian window is integrable, so the discrepancy is well-defined.

Notice that the target and the window have the same formula in this recipe but different jobs. The target says what distribution we want; the window says how strongly we weight frequencies. Changing the window changes the discrepancy, even if the target remains unchanged.

## 9 · Samples fluctuate even when the target is correct

Suppose the batch consists of independent draws from a fixed distribution. At a fixed frequency, write $Y_b=e^{i\freq X_b}$ and $\mu=\mathbb E[Y_b]=\cf_X(\freq)$. The empirical mean is unbiased because expectation distributes over a finite sum.

To compute its expected squared error, multiply by the complex conjugate and expand:

$$\mathbb E\left|\frac1B\sum_b(Y_b-\mu)\right|^2=\frac1{B^2}\sum_{b,c}\mathbb E[(Y_b-\mu)\overline{(Y_c-\mu)}].$$

When $b\ne c$, independence lets the expectation factor into two zero means. When $b=c$, the expectation is $\mathbb E|Y_b|^2-|\mu|^2=1-|\mu|^2$, since every sample arrow has unit magnitude. There are $B$ such diagonal terms, so

$$\mathbb E|\ecf(\freq)-\cf_X(\freq)|^2=\frac{1-|\cf_X(\freq)|^2}{B}.$$

If the population is already standard Gaussian, the expected discrepancy at that frequency is $(1-e^{-\freq^2})/B$. It does not vanish for a finite batch except at zero frequency.

Now distinguish the unscaled discrepancy $\disc_B$ from the scaled statistic $\stat_B=B\disc_B$. Integrate the last equation against our window:

$$\mathbb E[\disc_B]=\frac1B\left(\sqrt{2\pi}-\sqrt{\frac{2\pi}{3}}\right),\qquad\mathbb E[\stat_B]=\sqrt{2\pi}-\sqrt{\frac{2\pi}{3}}.$$

The Gaussian integrals follow by substituting $v=\sqrt a\,\freq$ in $\int e^{-a\freq^2/2}d\freq=\sqrt{2\pi/a}$. The unscaled expectation decreases like $1/B$; the scaled expectation remains of order one. A quadrature approximation on a truncated interval has a corresponding approximate floor.

This is a statement about independent samples from a fixed distribution. Optimizing the locations of a finite cloud can produce a more evenly arranged collection with smaller discrepancy. Do not interpret its score as though those optimized points were a fresh independent Gaussian sample.

A classical normality test compares a statistic with its distribution under a null hypothesis and uses a decision rule. During training, SIGReg is used as a differentiable objective. Its value is not automatically a calibrated p-value. Nor does failure to reject a finite-sample test prove equality of distributions.

## 10 · Why projections can reveal a multivariate distribution

An embedding has $d$ coordinates. Choose a unit direction $\uvec$ and project it to a scalar:

$$\proj_b=\uvec^\top\lat_b=\sum_{j=1}^d\uvec_j\lat_{b,j},\qquad\sum_j\uvec_j^2=1.$$

The dot product measures signed distance along that direction. The unit-length condition ensures that changing the direction does not also change the measurement scale. For $\uvec=(1,0)$, projection keeps the first coordinate. For $\uvec=(1,1)/\sqrt2$, it measures position along a diagonal.

If $Z$ has independent standard Gaussian coordinates, independence yields

$$\mathbb E[e^{i\freq\uvec^\top Z}]=\prod_{j=1}^d\mathbb E[e^{i\freq\uvec_jZ_j}]=\prod_{j=1}^d e^{-\freq^2\uvec_j^2/2}=e^{-\freq^2/2}.$$

Thus every unit projection is standard Gaussian. The converse is also true: if every unit projection of a random vector is standard Gaussian, then the vector is standard multivariate Gaussian. The reason is that every multivariate frequency vector can be written as a scalar times a unit direction, and characteristic functions uniquely determine distributions.

That last uniqueness statement is doing real work. The proof below supplies the bridge instead of treating a theorem's name as an explanation.

<details><summary>Required proof · characteristic-function uniqueness and the projection argument</summary>

Let $X$ be a random vector. Define its multivariate characteristic function as $\cf_X(v)=\mathbb E[e^{iv^\top X}]$. If two distributions have the same characteristic function, add an independent Gaussian noise vector $\epsilon G$ to each, with $\epsilon>0$. The resulting distributions have smooth densities because each original point has been replaced by a Gaussian bump.

For a Gaussian bump, the identity

$$\frac{e^{-\|x-y\|^2/(2\epsilon^2)}}{(2\pi\epsilon^2)^{d/2}}=\frac1{(2\pi)^d}\int_{\mathbb R^d}e^{-iv^\top(x-y)}e^{-\epsilon^2\|v\|^2/2}\,dv$$

follows coordinate by coordinate from the scalar Gaussian characteristic function. In one coordinate, substitute $s=\epsilon v$ in the right-hand integral and evaluate the characteristic function at $-(x-y)/\epsilon$. Taking the product over coordinates gives the displayed identity.

Average this bump over $y=X$. The Gaussian factor on the right is integrable, while the oscillatory factors have magnitude one, so the expectation and integral may be interchanged. This gives the smoothed density

$$p_{X+\epsilon G}(x)=\frac1{(2\pi)^d}\int e^{-iv^\top x}\cf_X(v)e^{-\epsilon^2\|v\|^2/2}\,dv.$$

Equal characteristic functions therefore give equal smoothed densities for every positive $\epsilon$.

To remove the smoothing, let $f$ be any bounded continuous function. On a joint probability space with fixed $X$ and $G$, the vector $X+\epsilon G$ tends to $X$ as $\epsilon$ tends to zero. Continuity gives pointwise convergence of $f(X+\epsilon G)$ to $f(X)$. Boundedness controls the expectations, so the expectations converge too. One elementary justification is to split where the difference exceeds a small threshold from its complement; boundedness controls the first part and convergence makes its probability vanish.

Thus equal smoothed distributions give equal expectations of every bounded continuous $f$ for the original distributions. Such functions distinguish distributions: approximate the indicator of a rectangle $(-\infty,a_1]\times\cdots\times(-\infty,a_d]$ by products of continuous ramps that are one up to $a_j$ and decrease to zero over an interval of width $1/n$. Their bounded pointwise limit is the rectangle indicator. Equality passes to these limits, giving equal joint cumulative probabilities, which specify the distribution.

Finally, for any nonzero vector $v$, set $\freq=\|v\|$ and $\uvec=v/\|v\|$. If every unit projection of $X$ is standard Gaussian, then $\cf_X(v)=e^{-\|v\|^2/2}$. At $v=0$ it is one as well. This is exactly the standard multivariate Gaussian characteristic function, so uniqueness proves the claim. More generally, equality of all one-dimensional projection distributions implies equality of the vector distributions; this is the Cramér–Wold principle used here.

</details>

The proof uses **every** direction and **every** frequency. An implementation samples finitely many directions and frequencies. Its evidence is necessarily weaker. Fresh directions during training broaden the measurements over time, but a small score on today's grid is not a theorem that the learned population is Gaussian.

Coordinate-wise normality is insufficient. Let $X$ be standard Gaussian and let an independent sign $S$ equal $-1$ or $1$ with equal probability. The vector $(X,SX)$ has Gaussian coordinate marginals and identity covariance, yet lies on two lines. Its diagonal projection is a mixture with a point mass at zero, so it cannot be standard Gaussian. Looking only along the coordinate axes misses this structure.

## 11 · From the integral to a finite computation

Collect $M$ unit directions in the columns of $\U\in\mathbb R^{d\times M}$. Matrix multiplication gives projected samples $H=\Z\U$ of shape $[B,M]$. In general dimension, draw a vector with independent standard Gaussian coordinates and divide by its length. The Gaussian's rotational symmetry makes its direction uniform on the unit sphere. The zero vector has probability zero; numerical implementations still guard against a zero norm.

The population discrepancy is even in frequency. Indeed, $\ecf(-\freq)$ is the conjugate of $\ecf(\freq)$, and the target and window are even and real. Conjugation leaves squared magnitude unchanged. Therefore the full-line integral is twice its integral over nonnegative frequencies.

First truncate at a maximum frequency $A$. Then choose $K$ equally spaced nodes, including both endpoints: $\freq_k=k\Delta$ for $k=0,\ldots,K-1$, with $\Delta=A/(K-1)$. Approximate the curve between neighboring samples by a line. Integrating that line gives a trapezoid: width times the average of the endpoint heights. Summing trapezoids counts interior heights twice and endpoint heights once. Including the earlier symmetry factor gives weights

$$\alpha_k=\begin{cases}\Delta,&k=0\text{ or }k=K-1,\\2\Delta,&\text{otherwise.}\end{cases}$$

Our finite, batch-size-scaled regularizer is

$$\reg(\Z)=\frac{B}{M}\sum_{m=1}^{M}\sum_{k=0}^{K-1}\alpha_k\,\target(\freq_k)\left[(C_{mk}-\target(\freq_k))^2+S_{mk}^2\right].$$

Here $C_{mk}=B^{-1}\sum_b\cos(\freq_k H_{bm})$ and $S_{mk}=B^{-1}\sum_b\sin(\freq_k H_{bm})$. The Gaussian target doubles as the window in this particular recipe. Every factor now has a source: $B$ is the statistic scaling, $1/M$ averages directions, $\alpha_k$ integrates the sampled curve with symmetry, and $\target$ weights frequencies.

<figure class="diagram" data-diagram="sigreg"></figure>

The pinned LeWorldModel implementation uses $K=17$ and $A=3$. These numbers are practical numerical choices. They are not requirements of characteristic-function theory. The theoretical integral, explanatory paper pseudocode, and executable implementation must be distinguished when comparing formulas.

<details><summary>Required numerical reasoning · two different approximation errors</summary>

Truncation discards the tails beyond $A$. Since the squared discrepancy is at most four, the discarded integral is at most $8\int_A^\infty e^{-\omega^2/2}d\omega$. For $\omega\geq A>0$, use $1\leq\omega/A$ to obtain

$$\int_A^\infty e^{-\omega^2/2}d\omega\leq\frac1A\int_A^\infty\omega e^{-\omega^2/2}d\omega=\frac{e^{-A^2/2}}A.$$

Thus a conservative unscaled truncation bound is $8e^{-A^2/2}/A$. The scaled statistic multiplies this by $B$. This upper bound can be loose, but it explains why a finite interval is an approximation rather than an identity.

Quadrature error comes from replacing the retained curve by line segments. Here is a useful bound. If $|f''|\leq L$ on an interval of width $\Delta$, the difference between $f$ and its linear interpolant has magnitude at most $L(x-a)(b-x)/2$. To see this, the interpolation error is zero at the endpoints; subtracting or adding $L(x-a)(b-x)/2$ creates a function with one sign of curvature, which must stay below or above the chord joining its zero endpoints. Integrating the bound gives $L\Delta^3/12$ per interval. Across $K-1$ intervals, and including symmetry, the error is at most $LA\Delta^2/6$.

For a finite batch the discrepancy curve is smooth, so such a bound exists on a compact interval. But its curvature can increase when projected sample magnitudes grow. A grid adequate for one cloud may be too coarse for another. Increasing $K$ at fixed $A$ tests quadrature convergence; increasing $A$ while retaining sufficient grid resolution tests truncation. Changing both without tracking their effects obscures which approximation improved.

</details>

## 12 · An independent way to check the integral

We can evaluate the unscaled, untruncated one-dimensional discrepancy using pairwise distances between samples. This is useful as a correctness check even though its quadratic cost makes it a different computational strategy.

Expand the squared discrepancy into $|\ecf|^2-2\operatorname{Re}(\ecf)\target+\target^2$. The first term contains $B^2$ pairs because multiplying an average by its conjugate produces every combination of two sample indices. Apply the Gaussian integral identity to each term:

$$\disc_B=\frac{\sqrt{2\pi}}{B^2}\sum_{b,c}e^{-(\proj_b-\proj_c)^2/2}-\frac{2\sqrt\pi}{B}\sum_b e^{-\proj_b^2/4}+\sqrt{\frac{2\pi}{3}}.$$

<details><summary>Required derivation · account for all three terms</summary>

The first term is $B^{-2}\sum_{b,c}\int e^{i\freq(\proj_b-\proj_c)}e^{-\freq^2/2}d\freq$. Regard the integral as $\sqrt{2\pi}$ times a standard Gaussian characteristic function evaluated at $\proj_b-\proj_c$. This yields the first exponential above.

For the cross term, the target and window multiply to $e^{-\freq^2}$. Substituting $v=\sqrt2\freq$ gives $\int\cos(\freq\proj_b)e^{-\freq^2}d\freq=\sqrt\pi e^{-\proj_b^2/4}$. Retain the expansion's coefficient $-2/B$.

For the final term, target squared times window is $e^{-3\freq^2/2}$, whose integral is $\sqrt{2\pi/3}$. No empirical samples occur in this term. Combining these three pieces proves the formula.

</details>

For the constant-zero cloud, every pairwise difference and every sample is zero. Its unscaled population discrepancy is therefore $\sqrt{2\pi}-2\sqrt\pi+\sqrt{2\pi/3}>0$. The positive number distinguishes collapse from the Gaussian target. It does not yet tell us what gradient an optimizer sees at the collapsed point.

## 13 · Differentiate every step

Let $w_k=\alpha_k\target(\freq_k)$ to shorten the notation. For one direction, define $\stat_B=B\sum_kw_k[(C_k-\target_k)^2+S_k^2]$. The derivative of the average cosine with respect to sample $\proj_b$ is $-(\freq_k/B)\sin(\freq_k\proj_b)$, and the derivative of the average sine is $(\freq_k/B)\cos(\freq_k\proj_b)$.

Apply the chain rule to each square. Its derivative is twice its inside times the derivative of that inside. The outer factor $B$ cancels the $1/B$ in the derivative of the mean:

$$\frac{\partial\stat_B}{\partial\proj_b}=2\sum_kw_k\freq_k\left[-(C_k-\target_k)\sin(\freq_k\proj_b)+S_k\cos(\freq_k\proj_b)\right].$$

The Gaussian target does not depend on the sample, so its derivative is zero. For several directions, average their contributions. Since $H_{bm}=\sum_j\lat_{b,j}\U_{jm}$, its derivative with respect to $\lat_{b,j}$ is $\U_{jm}$. Hence

$$\frac{\partial\reg}{\partial\lat_{b,j}}=\frac1M\sum_m\frac{\partial\stat_B^{(m)}}{\partial H_{bm}}\U_{jm}.$$

The encoder's parameters affect its outputs. One more application of the chain rule yields $\partial\reg/\partial\theta_\ell=\sum_{b,j}(\partial\reg/\partial\lat_{b,j})(\partial\lat_{b,j}/\partial\theta_\ell)$. Automatic differentiation computes this composed derivative. It does not choose a better objective for us or remove the need to understand what is being differentiated.

At the exact zero cloud, all sine terms and all imaginary averages are zero. The derivative above is therefore zero—even though the discrepancy is positive. A positive penalty at collapse is not the same as a nonzero escape gradient at exact collapse. Random initialization and nonzero variation matter; finite precision, other loss terms, and optimization dynamics matter too.

<details><summary>Worked local analysis · is the zero cloud attractive?</summary>

Consider one direction with $\proj_b=sx_b$, where the fixed $x_b$ have mean zero and second moment $m_2>0$. Near $s=0$, the cosine expansion gives $C_k=1-\freq_k^2s^2m_2/2+O(s^4)$. The sine average has no linear term because the sample mean is zero; it is $O(s^3)$. Squaring and keeping the leading change gives

$$\stat_B(s)=\stat_B(0)-Bs^2m_2\sum_kw_k\freq_k^2(1-\target_k)+O(s^4).$$

Every summand in the leading coefficient is nonnegative, and some are positive for a nontrivial frequency grid. Thus sufficiently small nonzero spread lowers this regularizer along that direction, even though the first derivative at $s=0$ vanishes. This is a local statement about the regularizer alone; the prediction term can compete with it.

</details>

## 14 · Run the statistic and challenge it

<div id="sigreg-lab" class="lab"><h3>Same moments, different distributions</h3><p class="instruction">Start with a Gaussian, then choose a ring or two crossing lines. Compare their covariance with their characteristic-function discrepancy. Finally choose a point mass and inspect the zero-scale case.</p><div class="controls"><label>Cloud <select aria-label="Embedding cloud"><option value="gaussian">Gaussian</option><option value="ring">Ring · radius √2</option><option value="lines">Two crossing lines</option><option value="thin">Almost rank one</option><option value="shift">Shifted Gaussian</option><option value="zero">Point mass at zero</option></select></label><label>Scale <input type="range" min="0" max="2" step="0.01" value="1" aria-label="Embedding scale"/></label></div><div class="controls"><label>Batch <select data-batch aria-label="Batch size"><option>32</option><option selected>128</option><option>512</option></select></label><label>Directions <select data-directions aria-label="Number of directions"><option>1</option><option>8</option><option selected>32</option><option>128</option></select></label><label>Grid nodes <select data-knots aria-label="Frequency grid nodes"><option>3</option><option>5</option><option selected>17</option><option>65</option></select></label></div><div class="panels"><div><canvas class="square" data-plot="cloud" width="360" height="360" aria-label="Embedding samples plotted with equal axis scales"></canvas><div class="plot-label">Embedding plane · fixed scale</div></div><div><canvas class="square" data-plot="spectrum" width="360" height="360" aria-label="Characteristic-function discrepancy on the first coordinate"></canvas><div class="plot-label">One projection shown; the score averages M</div></div></div><output></output><button data-gradient>Check the analytic gradient</button><p data-check class="lab-note"></p><p class="lab-note">Samples and directions are seeded. Population moments can match even though finite-sample moments fluctuate. The plot clips points outside the displayed range; the statistic still uses every point. The closed form integrates all frequencies; the finite grid only integrates from −3 to 3.</p></div>

Do not rank two clouds solely by one finite draw. A Gaussian sample can score worse than an especially evenly arranged nonrandom point set. Repeat with different seeds in code, inspect held-out directions, and distinguish the question “does this finite collection match these measurements?” from “what distribution produces new embeddings?”

## 15 · Read the implementation as mathematics

The following Python reference is included directly from the tested source file. It implements one time position. The browser uses the same quadrature and reduction convention with tensor operations and automatic differentiation.

<!-- CODE: book/edition2/sigreg_reference.py -->

Read the shapes as a sequence of questions. The matrix product asks, “where does each of the $B$ points land along each of the $M$ directions?” The inserted last axis permits evaluating all $K$ frequencies. Averaging over axis zero averages examples. Summing over the last axis approximates the integral. Averaging the remaining axis averages directions.

The gradient routine contains no mysterious optimization step. Its sine and cosine terms are the analytic derivative we just derived. Multiplication by the transposed direction matrix sends the projected gradients back into embedding coordinates.

Projection costs order $BdM$ scalar multiply-add work, while evaluating frequencies costs order $BMK$. Materializing every phase uses order $BMK$ memory. Directions or frequencies can be processed in chunks to reduce peak memory. Calling the method simply “linear” without specifying which of $B,d,M,K$ is fixed hides these tradeoffs.

<details><summary>A numerical trace · two points, one direction, three nodes</summary>

Take $\Z=[(-1,0),(1,0)]$ and direction $(1,0)$. The projected samples are $-1$ and $1$. For an intentionally coarse demonstration, choose nodes $0,1,2$, so $A=2$, $K=3$, and $\Delta=1$. The symmetry-aware trapezoid coefficients are $1,2,1$.

At zero frequency, both sample arrows are one; the target is one, so the error is zero. At frequency one, the sine mean is zero and the cosine mean is $\cos1\approx0.540302$. The target is $e^{-1/2}\approx0.606531$. The squared difference is approximately $0.004386$.

At frequency two, the cosine mean is $\cos2\approx-0.416147$ and the target is $e^{-2}\approx0.135335$. The squared difference is approximately $0.304133$. The weighted, unscaled sum is approximately $2(0.606531)(0.004386)+(0.135335)(0.304133)\approx0.04648$. Multiplying by $B=2$ gives about $0.09296$.

This trace is not an accurate approximation to the full integral; three nodes were chosen so that every operation fits on a page. The distinction between a correct finite-sum implementation and an accurate integral approximation matters.

</details>

## 16 · Batch axes, sample size, and honest claims

The world model produces three time positions per training window. If the embedding tensor has shape $[3,B,d]$, regularize each time position across the batch and then average the three results. Flattening time into the batch changes which empirical distributions are compared, their dependencies, and their scaling. It is a different objective.

Likewise, compute the empirical characteristic function over the intended batch **before** squaring the difference. Averaging independently computed microbatch penalties does not generally equal the full-batch penalty. The square is nonlinear: the average of squares is not the square of the average. If accumulating measurements across devices, aggregate the sine and cosine sums and sample counts consistently before forming the desired statistic.

There is another finite-batch constraint. Center $B$ embedding vectors by subtracting their batch mean. Their sum is zero, so at most $B-1$ of those centered vectors are linearly independent. The sample covariance, formed from their outer products, therefore has rank at most $\min(d,B-1)$. A batch of 64 points in 192 dimensions cannot have full-rank sample covariance equal to $I_{192}$.

This does not make projected distributional regularization meaningless. It means that exact population geometry and finite-batch geometry must not be conflated. The source distribution can be full-dimensional while every small sample covariance is rank-deficient.

Finally, Gaussianity is not semantics. Permuting which observation receives which embedding preserves the marginal cloud but can destroy temporal predictability. Conversely, predictable embeddings can omit distinctions needed by a particular goal. The prediction objective, exploration data, architecture, regularizer, and downstream evaluation work together; none can be interpreted in isolation.

## 17 · Check your understanding

<details><summary>Exercise 1 · Why is frequency zero uninformative?</summary>

Every sample contributes $e^{i0x}=1$, regardless of its value. Thus every empirical and population characteristic function equals one there. The target also equals one, so the discrepancy and its sample gradient are zero. Keeping the zero node is convenient for quadrature, but it cannot distinguish distributions.

</details>

<details><summary>Exercise 2 · The coordinate histograms are Gaussian. Why sample diagonal directions?</summary>

The vector $(X,SX)$ supplies a counterexample. Both coordinates have the same Gaussian marginal, but with probability one-half their diagonal projection is exactly zero. Marginal histograms inspect only the axes. A joint distribution includes how coordinates relate, so other directions reveal structure the axes can miss.

</details>

<details><summary>Exercise 3 · Remove the factor B. What else must change?</summary>

For a fixed batch size, the unscaled regularizer is the scaled one divided by $B$. To preserve the same total objective, multiply its coefficient by $B$. If batch size changes, simply keeping the same coefficient does not preserve this algebraic relation. Even after rescaling, changed sampling variance and optimization dynamics can still change training behavior.

</details>

<details><summary>Exercise 4 · Does zero population discrepancy imply Gaussianity?</summary>

For one projection, a positive Gaussian window and zero integral of a nonnegative discrepancy imply that the characteristic functions agree almost everywhere in frequency. Characteristic functions are continuous: bounded sample exponentials change continuously, allowing limits through expectations. A nonzero difference at one frequency would persist on a neighborhood with positive integral. Thus they agree everywhere. Uniqueness identifies the projected distribution.

If the direction-averaged population discrepancy is also zero under a direction distribution with full support, the same argument uses continuity in direction to extend agreement from almost every direction to all directions. Then the projection theorem identifies the multivariate Gaussian. Finitely many sampled directions and frequency nodes do not supply these premises.

</details>

<details><summary>Exercise 5 · What does the gradient check establish?</summary>

For a small perturbation $\epsilon$, a central finite difference estimates a partial derivative by evaluating the function at $z+\epsilon e_j$ and $z-\epsilon e_j$, subtracting, and dividing by $2\epsilon$. Taylor expansion makes its truncation error quadratic in $\epsilon$ when enough derivatives exist; excessively tiny perturbations amplify floating-point subtraction error. Agreement over several points and perturbation sizes supports correctness of the implemented derivative of the finite sum. It does not validate the chosen objective, the population theorem, or the training data.

</details>

## 18 · Return to the world model

We began with a loophole: an encoder can make agreement trivial by removing distinctions. We constructed a second preference that compares distributional measurements of its outputs with a known, noncollapsed reference. That preference has a computational form, gradients, finite-sample fluctuations, approximation errors, and limitations.

The next chapter combines it with a predictor and trains both networks. The decisive question becomes empirical: do the resulting representations support prediction and control on observations not used for the update? A neat cloud is one diagnostic. A useful learned model must survive further tests.

**Sources and correspondence.** SIGReg is introduced in [LeJEPA v1](https://arxiv.org/pdf/2511.08544v1). This chapter's implementation convention follows the [pinned LeWorldModel code](https://github.com/lucas-maes/le-wm/blob/8edfeb336732b5f3ce7b8b210d0ba370a09e2cac/module.py), with its 17 nodes on $[0,3]$, Gaussian window, and batch multiplier. The requested endpoint is [LeWorldModel v1](https://arxiv.org/pdf/2603.19312v1). Reza Bayat's [SIGReg tutorial](https://rezabyt.github.io/blogposts/sigreg-tutorial.html) informed the requested pedagogical depth; the prose, derivations, experiments, and diagrams here are independently developed and checked. The downstream-risk theorem makes additional assumptions about probes and function classes; the geometric and entropy arguments here do not substitute for that theorem.
