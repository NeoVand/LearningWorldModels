# What Gaussian geometry can promise

<p class="lead">Why might Gaussian embeddings help a later learner? We examine linear prediction and local averaging, then trace exactly where the Gaussian distribution enters their error bounds.</p>

## A probe asks what another learner can recover

A **probe** is a model trained on top of a fixed representation using labels for a downstream task. A linear probe predicts $y$ from $\lat$ using a linear map. A nonlinear probe can recover relationships a linear map cannot express. Their performance depends on the representation, the probe family, the amount of labeled data, and the distribution of evaluation queries.

The [LeJEPA v1 paper](https://arxiv.org/pdf/2511.08544v1) motivates Gaussian geometry by analyzing such downstream learners under constraints on the representation distribution. This is a different question from proving that a particular neural encoder learns physical state or that a planner succeeds. We will derive the main statistical mechanism without upgrading a bound into a universal optimum claim.

## Begin with a one-coordinate probe

Imagine that a frozen encoder gives one number $z$ and the target is an arm coordinate $y$. A probe fits $\hat y=\beta z$. Two different training samples can produce two different fitted coefficients, even with exactly the same encoder. The theoretical question is about those repeated fitted probes, not about randomness in one forward pass.

Take fixed inputs $z_1=-1,z_2=1$ and targets $y_i=\beta z_i+\varepsilon_i$, where the independent noises have mean zero and variance $\sigma^2$. The least-squares estimate is

$$\hat\beta=\frac{z_1y_1+z_2y_2}{z_1^2+z_2^2}=\beta+\frac{-\varepsilon_1+\varepsilon_2}{2}.$$

Its mean is $\beta$ and its variance is $(\sigma^2+\sigma^2)/4=\sigma^2/2$. If the observed input magnitudes are only 0.1, the same derivation gives variance $\sigma^2/0.02$, one hundred times larger. This comparison holds the true coefficient and noise level fixed; rescaling an entire task including its coefficient changes the comparison. Little variation in a measured direction can make its coefficient difficult to estimate.

Keep this calculation beside the matrix result below. A matrix lets different directions have different amounts of evidence.

<!-- VISUAL: R1 -->

## Bias and variance come from repeated training sets

For an estimator $\hat\beta$ of a fixed parameter $\beta$, bias is $\mathbb E[\hat\beta]-\beta$. Estimator variance measures how $\hat\beta$ changes across repeated data or noise draws. The identity

$$\mathbb E\|\hat\beta-\beta\|^2=\|\mathbb E\hat\beta-\beta\|^2+\mathbb E\|\hat\beta-\mathbb E\hat\beta\|^2$$

follows by inserting and subtracting the mean estimator and expanding the squared norm. The cross term vanishes because the centered estimator has mean zero. Bias and variance are properties of a learning procedure in a statistical setting, not synonyms for training error and test error.

For a fixed design matrix $X$, suppose $y=X\beta+\varepsilon$, with $\mathbb E[\varepsilon\mid X]=0$ and noise covariance $\sigma^2I$. Ridge regression from the learning chapter gives

$$\hat\beta=(G+\lambda I)^{-1}X^\top y,\qquad G=X^\top X.$$

Taking the conditional expectation and using $G=(G+\lambda I)-\lambda I$ yields

$$\operatorname{Bias}(\hat\beta\mid X)=-\lambda(G+\lambda I)^{-1}\beta.$$

An eigenvector direction of $G$ with eigenvalue $\rho$ therefore has shrinkage bias factor $\lambda/(\rho+\lambda)$. Small data variation in that direction makes the regularizer comparatively stronger.

Under a fixed trace $\sum_j\rho_j=c$, the smallest eigenvalue is at most $c/d$: otherwise all $d$ eigenvalues would sum to more than $c$. Equal eigenvalues maximize this smallest value. Hence isotropy minimizes the worst-direction ridge bias magnitude for a fixed norm of $\beta$ and positive $\lambda$. This is a minimax statement over unknown task directions. For a known task, allocating more variation to its relevant direction can instead help.

<!-- VISUAL: R2 -->

## Ordinary least squares gives a second isotropy argument

Set $\lambda=0$ and assume $G$ is invertible. Then $\hat\beta-\beta=G^{-1}X^\top\varepsilon$. Multiplying out its conditional covariance gives

$$\operatorname{Cov}(\hat\beta\mid X)=G^{-1}X^\top(\sigma^2I)XG^{-1}=\sigma^2G^{-1}.$$

Its total parameter variance is $\sigma^2\sum_j1/\rho_j$. By Cauchy–Schwarz applied to the vectors $(\sqrt{\rho_j})_j$ and $(1/\sqrt{\rho_j})_j$,

$$d^2\leq\left(\sum_j\rho_j\right)\left(\sum_j\frac1{\rho_j}\right).$$

At fixed trace $c$, the sum of reciprocals is at least $d^2/c$, with equality only when all eigenvalues are equal. Thus isotropy minimizes this total parameter variance under the stated fixed-design noise model. Singular directions make the unregularized inverse unavailable.

This argument concerns covariance, not the complete distribution. A ring and a Gaussian with the same covariance satisfy the same population second-moment condition. To motivate a distributional choice beyond moments, LeJEPA considers local nonlinear probes.

## A local probe averages nearby labels

A kernel here is a nonnegative weighting function that gives nearby examples greater weight. Let $K$ integrate to one, be symmetric with zero first moment, and have second moment matrix $\mu_2I$. Define a bandwidth-scaled kernel $K_h(u)=h^{-d}K(u/h)$. Substitution $v=u/h$ shows its integral remains one. The bandwidth $h$ sets the neighborhood scale.

Before introducing a named estimator, calculate one weighted average. Suppose stored representations are $-1,0,1$, with labels $0,2,10$. At query 0, use the triangular kernel $K(u)=\max(1-|u|,0)$ and bandwidth $h=2$. Its integral is one because its graph is a triangle of base 2 and height 1. The three unscaled weights are $1/2,1,1/2$. The factor $h^{-1}$ cancels in the weighted average, so the prediction is $(0/2+2+10/2)/2=3.5$. A neighborhood containing the central sample alone would predict 2. Smoothing changes the answer even before measurement noise enters.

The Nadaraya–Watson estimator at query $q$ is

$$\hat m(q)=\frac{\sum_i K_h(q-Z_i)Y_i}{\sum_i K_h(q-Z_i)}.$$

It is a weighted average of nearby labels when the denominator is positive. Let the embedding density be $p$ and the conditional mean label be $m(z)=\mathbb E[Y\mid Z=z]$. With many observations, the ratio is approximated by the ratio of expected numerator and denominator. The population-smoothed target is

$$m_h(q)=\frac{\int K(u)m(q+hu)p(q+hu)\,du}{\int K(u)p(q+hu)\,du}.$$

This is not the exact expectation of the finite-sample ratio. Random denominators create additional terms. We first derive the deterministic smoothing bias; the approximation to the estimator requires sufficient local sample size and regularity.

<!-- VISUAL: R3 -->

## Taylor expansion explains the density score

We first check the one-dimensional mechanism with a uniform kernel on $[-1,1]$. Its mean is zero by symmetry and its second moment is $\int_{-1}^1u^2/2\,du=1/3$. Expanding a smooth $a(q+hu)$ gives $a(q)+hu a'(q)+h^2u^2a''(q)/2$ plus a smaller remainder. Averaging kills the odd term and leaves $a(q)+h^2a''(q)/6$. This is the same Taylor calculation from the calculus chapter, now averaged over neighboring points.

For example, if the local label function is $m(x)=x^2$ and the density is locally constant, the smoothed prediction is $q^2+h^2/3$: average $(q+hu)^2$ directly. Its bias is $h^2/3$. The general formula below must reproduce this number when $m''=2$, the density derivative is zero, and $\mu_2=1/3$.

For a smooth function $a$, a second-order Taylor expansion is

$$\begin{aligned}a(q+hu)&=a(q)+h\nabla a(q)^\top u\\&\quad+\tfrac12h^2u^\top H_a(q)u+o(h^2),\end{aligned}$$

under conditions allowing the remainder to be integrated against the kernel. $H_a$ is the Hessian, the matrix of second partial derivatives. Its trace is the Laplacian $\nabla^2 a=\sum_j\partial_j^2a$. The notation $o(h^2)$ means that after division by $h^2$ the remainder tends to zero as $h\to0$. It is not a fixed numerical error bound.

Integrating the expansion removes the linear term because $\int uK(u)du=0$. The quadratic term becomes $\tfrac12h^2\mu_2\nabla^2 a$. Apply this first to $a=mp$, then to $a=p$. For numbers $A+h^2a$ and $B+h^2b$ with $B>0$, expansion of the reciprocal gives a ratio $A/B+h^2(aB-Ab)/B^2+o(h^2)$. Therefore

$$\begin{aligned}m_h(q)-m(q)&=\frac{h^2\mu_2}{2}\Big[\nabla^2 m(q)\\&\quad+2\nabla m(q)^\top\nabla\log p(q)\Big]\\&\quad+o(h^2).\end{aligned}$$

To check the cancellation, expand $\nabla^2(mp)=p\nabla^2 m+2\nabla m^\top\nabla p+m\nabla^2 p$. The last term cancels the denominator correction. Finally $\nabla p/p=\nabla\log p$ by the chain rule. The **score** $s(z)=\nabla\log p(z)$ measures how rapidly log density changes with location. It is a derivative with respect to the sample coordinate, not a classifier score and not a derivative with respect to a neural-network parameter.

Dense neighborhoods pull a local weighted average asymmetrically. That is why the density gradient appears in its bias. A representation can affect probe behavior through the arrangement and concentration of its examples.

<!-- VISUAL: R4 -->

## The radial-neighborhood version

A fixed-radius neighbor probe averages labels inside a ball of radius $r$. Under locally smooth density, the same expansion applies with a uniform-ball kernel. Symmetry makes its covariance a scalar multiple of $I$. In a $d$-dimensional ball, the volume within radius $a$ scales as $a^d$, so the radial density is proportional to $a^{d-1}$. The expected squared radius is

$$\frac{\int_0^r a^{d+1}da}{\int_0^r a^{d-1}da}=\frac{d}{d+2}r^2.$$

Divide by $d$ identical coordinate variances to obtain $r^2/(d+2)$. Substituting into the smoothing calculation gives

$$\begin{aligned}m_r(q)-m(q)&=\frac{r^2}{d+2}\Big[\nabla m(q)^\top s(q)\\&\quad+\tfrac12\nabla^2 m(q)\Big]+o(r^2).\end{aligned}$$

An empirical neighborhood can be empty. A complete implementation must define what to do then. The small-radius asymptotic analysis assumes enough local data for the empirical average to approximate this population object.

## Fisher information measures average score magnitude

The density score needs a numerical interpretation before another integral. For a scalar Gaussian with mean zero and variance $\sigma^2$, the log density is a constant minus $x^2/(2\sigma^2)$. Its derivative with respect to $x$ is $s(x)=-x/\sigma^2$. At $x=1$, a narrow Gaussian with variance $1/4$ has score $-4$, while a unit-variance Gaussian has score $-1$: the narrow density falls more sharply there.

Averaging the squared score gives $\mathbb E[s(X)^2]=\mathbb E[X^2]/\sigma^4=1/\sigma^2$. The resulting quantity measures average density sensitivity. Recoverable physical state is a different question, assessed by the probes introduced earlier.

Define the location Fisher-information functional

$$J(p)=\mathbb E_p\|s(Z)\|^2=\int\frac{\|\nabla p(z)\|^2}{p(z)}\,dz.$$

The second equality substitutes $s=\nabla p/p$. Assume a smooth positive density, finite covariance, finite $J(p)$, and tails or boundary conditions sufficient for the integration-by-parts identities below. These assumptions are substantive. A finite empirical distribution or a distribution on a lower-dimensional surface does not satisfy them as an ordinary full-dimensional density.

Let $Z$ be centered with covariance $\Sigma$. For coordinates $j,k$, integrate $z_j\partial_kp(z)$ with respect to $z_k$. The boundary term vanishes under the stated conditions, leaving

$$\mathbb E[Z_js_k(Z)]=-\delta_{jk}.$$

The symbol $\delta_{jk}$ is 1 when $j=k$ and 0 otherwise. This identity says the score and the centered coordinate have a fixed negative cross-moment.

For invertible $\Sigma$, consider the nonnegative expected squared norm of $s(Z)+\Sigma^{-1}Z$. Expanding all three terms gives

$$0\leq\mathbb E\|s(Z)+\Sigma^{-1}Z\|^2=J(p)-\operatorname{tr}(\Sigma^{-1}).$$

The cross term is $-2\operatorname{tr}(\Sigma^{-1})$ by the preceding identity. The last term is $\operatorname{tr}(\Sigma^{-2}\Sigma)=\operatorname{tr}(\Sigma^{-1})$. Hence $J(p)\geq\operatorname{tr}(\Sigma^{-1})$.

Equality forces $s(z)=-\Sigma^{-1}z$ almost everywhere. Integrating this gradient equation yields $\log p(z)=c-\tfrac12z^\top\Sigma^{-1}z$ on the connected domain under these regularity assumptions. Normalizing produces a Gaussian density. If only total variance $\operatorname{tr}\Sigma=c_0$ is fixed, the previous reciprocal-eigenvalue inequality gives $J(p)\geq d^2/c_0$, with equality for the isotropic Gaussian of covariance $(c_0/d)I$.

**What has been minimized:** the isotropic Gaussian minimizes location Fisher information among regular densities with this fixed total variance. The next step asks how that quantity enters a downstream-risk bound.

<!-- VISUAL: R5 -->

## From a score bound to a probe-bias bound

Suppose the target functions satisfy $\|\nabla m\|\leq L$ and $|\nabla^2 m|\leq B_0$. The leading smoothing-bias term contains $\nabla^2 m+2\nabla m^\top s$. Use $(a+b)^2\leq2a^2+2b^2$, obtained from $0\leq(a-b)^2$, and Cauchy–Schwarz to obtain

$$\mathbb E\!\left[(\nabla^2 m+2\nabla m^\top s)^2\right]\leq2B_0^2+8L^2J(p).$$

Multiplying by $(h^2\mu_2/2)^2$ yields the leading integrated squared-bias upper bound used in the kernel argument. With adequate uniform remainder control, the remaining term is $o(h^4)$.

Gaussianity minimizes the density-dependent Fisher term in this bound under the specified covariance constraint. **Minimizing an upper bound does not, by itself, prove minimization of the actual error for every target function.** The Laplacian term, cross terms, query distribution, finite sample size, and how target functions change under a representation transformation all matter. The radial-neighbor argument similarly requires assumptions about target-gradient directions and curvature terms; a same-order remainder cannot be ignored when claiming an exact optimizer.

For the empirical kernel estimator, the leading pointwise variance is approximately $R(K)v(q)/(nh^dp(q))$, where $R(K)=\int K^2$ and $v(q)=\operatorname{Var}(Y\mid Z=q)$. The scale follows because about $nh^dp(q)$ examples contribute locally, while squared weights contribute $R(K)$. More explicitly, the residual-weight numerator variance is approximately $nh^dp(q)v(q)R(K)$ before normalization by $(nh^dp(q))^2$ in the unscaled-kernel convention. Dividing gives the stated expression.

Integrating against query density $p(q)$ formally cancels its factor, giving $R(K)(nh^d)^{-1}\int v(q)dq$. On an unbounded domain this integral may diverge. Uniform asymptotic approximations may also fail in sparse tails. Any global variance claim needs integrability and tail conditions, not just a pointwise cancellation. This is why we separate the mathematically established Fisher bound from broader interpretations in the source paper.

<!-- VISUAL: R6 -->

## Why a Gaussian marginal can still encode the wrong thing

Imagine observations containing both arm position and an independent background variable. A representation can map the background into a nearly Gaussian coordinate while discarding the arm. Its marginal geometry can look excellent, yet it is useless for the goal. Prediction may or may not reject this shortcut depending on the background’s temporal behavior.

Conversely, an environment with only a small discrete set of states cannot be mapped deterministically to an exact continuous full-dimensional Gaussian without additional variation. The attainable representation distributions depend on the input distribution and encoder. The target’s desirable geometry does not prove attainability or semantic alignment.

Theoretical distribution matching also differs from its finite implementation. Matching every direction and every frequency at the population level is an identification statement. Sampling a finite collection of directions and frequencies gives an optimization surrogate. Its stochastic gradients, finite-batch floor, and collapsed stationary configurations were derived in the SIGReg chapter.

## Worked challenge: audit a theorem-sized claim

Someone says, “SIGReg makes embeddings Gaussian, so every downstream task becomes optimal.” Identify the missing steps.

<details class="derivation"><summary>Reconstruct the chain and its limits</summary>

First, finite optimization does not establish exact population Gaussianity. Second, Gaussian marginal geometry does not identify which input information was retained. Third, the probe analysis assumes particular learner families, noise, smoothness, covariance constraints, and query distributions. Fourth, minimizing a term in a risk bound is not the same as minimizing every risk. Fifth, even a successful probe does not establish an accurate action-conditioned dynamics model or a successful planner.

A defensible statement is narrower: SIGReg encourages a noncollapsed isotropic Gaussian geometry; this geometry has favorable properties in specified probe analyses; and the usefulness of the resulting learned representation is evaluated empirically on held-out tasks. Each clause has a different kind of support.

</details>

This is research-level reading: neither dismiss the theory nor let its shorthand outrun its proof. We have already trained the objective; now we can state what its Gaussian motivation does and does not prove. The next chapter replaces the teaching model’s small networks with the transformer components used in the research architecture.
