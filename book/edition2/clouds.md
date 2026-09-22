# The geometry of a cloud

<p class="lead">One vector describes one observation. A collection of vectors reveals what the encoder distinguishes across observations.</p>

We now combine the vector operations from geometry with expectation and variance from probability. The question is concrete: if a collection of descriptions varies, does it vary in every useful direction, or only along a line?

## Mean and covariance as geometry

For a batch $x_1,\ldots,x_B$, define the mean $\bar x=B^{-1}\sum_i x_i$. It is the point minimizing total squared distance to the samples. To see this, write $x_i-c=(x_i-\bar x)+(\bar x-c)$. On expanding the squares, the cross term vanishes because $\sum_i(x_i-\bar x)=0$. The remaining expression is

$$\sum_i\|x_i-c\|^2=\sum_i\|x_i-\bar x\|^2+B\|\bar x-c\|^2.$$

Only the last term depends on $c$, and its minimum is zero at $c=\bar x$.

Let $X_c$ be the matrix with centered row $x_i-\bar x$ for each example. Using a denominator $B$ for descriptive geometry, define

$$C=\frac1B\sum_i(x_i-\bar x)(x_i-\bar x)^\top=\frac1B X_c^\top X_c.$$

For a random vector, the population counterpart is $\Sigma=\mathbb E[(X-\mu)(X-\mu)^\top]$, with $\mu=\mathbb EX$. It averages over the distribution rather than a particular batch. The same coordinate and transformation rules apply to both.

Entry $C_{jj}$ is the average squared deviation of coordinate $j$. Entry $C_{jk}$ is the average product of deviations of coordinates $j$ and $k$. If they tend to rise and fall together, their covariance is positive. If one rises while the other falls, it is negative. Zero covariance means this particular linear co-variation vanishes; it need not mean independence.

For any direction $u$, multiplication gives

$$u^\top Cu=\frac1B\sum_i\big[u^\top(x_i-\bar x)\big]^2.$$

The right side is precisely the variance along that direction. It is nonnegative, so covariance matrices are **positive semidefinite**: their quadratic form is never negative. This phrase is a compact statement about projected variances, not a new kind of probability.

A statistical estimate of population covariance often uses $B-1$ instead. Here is the reason in one dimension. Let independent samples have mean $\mu$ and variance $\sigma^2$. The identity $\sum_i(X_i-\bar X)^2=\sum_i(X_i-\mu)^2-B(\bar X-\mu)^2$ follows by the same square expansion. Taking expectations gives $B\sigma^2-B(\sigma^2/B)=(B-1)\sigma^2$. Dividing by $B-1$ removes this particular estimation bias. We used the variance-of-the-mean identity proved in the preceding chapter. Neither denominator is universally “correct”; the objective must specify which it uses.

<!-- VISUAL: C1 -->

## A centered batch has a rank limit

Subtract the mean from a batch of $B$ vectors to form the centered matrix $X_c$, with one example per row. Its rows sum to zero. At most $B-1$ rows can therefore be independent: the last is the negative sum of the others. Consequently,

$$\operatorname{rank}(X_c)\leq\min(d,B-1).$$

This is a structural limit, not a training defect. With $B=32$ and $d=192$, no single centered batch can have rank 192. This bound concerns the particular batch. The population covariance can have full rank even though each small centered batch is rank-deficient.

<!-- VISUAL: C2 -->

## Eigenvectors reveal the cloud’s principal directions

An eigenvector $u$ of a matrix $C$ is a nonzero vector for which $Cu=\lambda u$. The matrix stretches that direction by a scalar $\lambda$ without changing its direction. For a covariance matrix, a unit eigenvector has projected variance $u^\top Cu=\lambda$.

Start with a matrix we can multiply by hand:

$$\begin{aligned}&C=\begin{pmatrix}2&1\\1&2\end{pmatrix}, \\ &u=\frac1{\sqrt2}\begin{pmatrix}1\\1\end{pmatrix}, \\ &v=\frac1{\sqrt2}\begin{pmatrix}1\\-1\end{pmatrix}.\end{aligned}$$

Compute $Cu=(3,3)^\top/\sqrt2=3u$ and $Cv=(1,-1)^\top/\sqrt2=v$. Thus the rising diagonal has variance 3 and the falling diagonal variance 1. Check also $u^\top v=0$ and both lengths equal 1: the two measuring directions are perpendicular and normalized.

For any unit direction $w=au+bv$, perpendicularity gives $a^2+b^2=1$. Its variance is $w^\top Cw=3a^2+b^2=1+2a^2$, between 1 and 3. This proves that the two displayed eigenvectors really are the least- and greatest-spread directions in this example.

Put these two vectors into the columns of a matrix $Q$ and their variances into a diagonal matrix $\Lambda$. Then

$$\begin{aligned}&Q=\frac1{\sqrt2}\begin{pmatrix}1&1\\1&-1\end{pmatrix}, \\ &\Lambda=\begin{pmatrix}3&0\\0&1\end{pmatrix}, \\ &C=Q\Lambda Q^\top.\end{aligned}$$

Verify the last equality by multiplication. Reading it right to left, $Q^\top$ expresses a vector along the principal directions, $\Lambda$ scales those coordinates, and $Q$ returns to the original coordinates. Here $Q^\top Q=I$, so transpose also undoes the rotation or reflection. A matrix with this property is **orthogonal**.

Why should two distinct eigenvector directions of a symmetric matrix be perpendicular? If $Cu=\lambda u$ and $Cv=\rho v$, then $u^\top Cv=\rho u^\top v$, but symmetry also gives $u^\top Cv=(Cu)^\top v=\lambda u^\top v$. Thus $(\rho-\lambda)u^\top v=0$. If the eigenvalues differ, the dot product must be zero.

For this two-dimensional example, we have explicitly found all the directions we need. The general statement that a symmetric matrix admits a complete perpendicular set is the spectral theorem. We will [prove the finite-dimensional spectral theorem](#calculus-10) after learning directional derivatives. Until then, the calculations here use the displayed $Q$ that we can check directly.

The **trace** is the sum of diagonal entries: here $2+2=4$, also $3+1$. For any decomposition with orthogonal $Q$, expansion gives $\operatorname{tr}(Q\Lambda Q^\top)=\sum_j\lambda_j\sum_iQ_{ij}^2=\sum_j\lambda_j$. Each column’s squared entries sum to one. Total variance is unchanged by a perpendicular change of coordinates.

<!-- VISUAL: C3 -->

## A Gaussian cloud in several dimensions

A multivariate standard Gaussian is a vector of independent standard Gaussian coordinates. Its joint density is the product of coordinate densities:

$$p(x)=(2\pi)^{-d/2}\exp(-\|x\|^2/2).$$

The exponent follows because multiplying exponentials adds their exponents. This density depends only on distance from zero. Rotating the coordinates with an orthogonal matrix preserves both length and volume, so it preserves the distribution. “Isotropic” means the distribution looks the same along every direction under these rotations; for this Gaussian the covariance is $I$.

## Whitening is a moment operation

If all eigenvalues are positive, transform a centered vector by $y=\Lambda^{-1/2}Q^\top(x-\mu)$. Its covariance is

$$\operatorname{Cov}(y)=\Lambda^{-1/2}Q^\top C Q\Lambda^{-1/2}=I.$$

Each equality follows from applying the linear map to both sides of the covariance outer product and using $Q^\top Q=I$. Dividing a principal coordinate by the square root of its variance gives it unit variance. This operation is called whitening. If an eigenvalue is zero, its inverse square root does not exist; one must remove that direction or choose an explicit regularized approximation.

Whitening does not make every distribution Gaussian. Uniform points on a circle of radius $\sqrt2$ in two dimensions have mean zero and covariance $I$: symmetry gives equal coordinate variances, and their sum is the constant squared radius 2. Yet every sample lies exactly on a circle. A two-dimensional Gaussian fills an area and has variable radius. Matching first and second moments cannot distinguish these distributions. This example motivates SIGReg’s richer distributional measurements.

<div class="lab" id="geometry-lab"><div class="lab-head"><span class="eyebrow">Geometry desk</span><h3>Rotate the measuring direction</h3><p>The illustrative cloud approximates a distribution with covariance eigenvalues 3 and 1. Predict that distribution’s projected variance before turning the direction.</p></div><div class="controls"><label>Direction <input id="geometry-angle" type="range" min="0" max="180" value="45" step="1"/></label></div><canvas id="geometry-canvas" aria-label="An equal-scale sample cloud and its projection direction"></canvas><p id="geometry-readout" class="readout"></p><p class="caption">A deterministic illustrative cloud; no neural network is being trained. Equal horizontal and vertical units preserve the geometry.</p></div>

<!-- VISUAL: C4 -->

## Worked exercises: what survived?

Take the three embeddings $(1,0)$, $(0,1)$, and $(-1,-1)$. Their mean is zero. Compute their descriptive covariance and identify one direction with the largest variance.

<details class="derivation"><summary>Compute, then interpret</summary>

The three outer products sum to $\begin{pmatrix}2&1\\1&2\end{pmatrix}$. Divide by 3. The unit rising diagonal has variance 1 and the falling diagonal has variance $1/3$. Both are positive, so this centered batch spans two directions. Its rank reaches the limit $B-1=2$.

Now replace each vector by twice itself. Covariance becomes four times larger because both factors in every outer product double. Rank is unchanged. Scale and dimensional collapse are different diagnostics.

Finally map every vector to its first coordinate. The scalar values are $1,0,-1$. These examples remain distinct, but the map would identify $(1,0)$ with $(1,100)$ on a broader dataset. An embedding’s adequacy must be assessed on the relevant distribution and tasks, not only on a tiny training list.

</details>


Our covariance measurements will later detect some forms of collapse. We have not yet learned how to change an encoder. The next two chapters build the calculus and learning rules that do that.
