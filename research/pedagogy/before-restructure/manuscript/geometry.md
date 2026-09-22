# A world in coordinates

<p class="lead">A representation is a choice of distinctions. Linear algebra gives us a language for asking which distinctions survive.</p>

## From an image to a list of numbers

A grayscale image of height $H$ and width $W$ is an array of $HW$ intensity values. A color image has an additional channel index, often with three entries for red, green, and blue. **Flattening** merely places these numbers in a fixed order. It loses no information if the shape and ordering are known. A $2\times2$ image with rows $(1,0)$ and $(0,1)$ can become the vector $(1,0,0,1)^\top$. The transpose symbol $\top$ tells us to write that list as a column.

An encoder can then map this long vector to a shorter one. As a deliberately simple example, define

$$f(\obs)=\begin{pmatrix}o_1+o_2\\o_3+o_4\end{pmatrix}.$$

This encoder retains total intensity in each row. It cannot tell $(1,0,0,1)$ from $(0,1,1,0)$ because both become $(1,1)$. A reader can now answer precisely what the encoder loses: the left–right arrangement within each row. Saying it produces a two-dimensional “embedding” adds no guarantee of usefulness.

In deep learning, embedding usually means a learned coordinate representation. It does not imply an injective mathematical embedding that preserves every distinct input. An encoder may intentionally identify many inputs. The issue is whether inputs requiring different predictions or actions remain distinguishable.

## Matrices are coordinated linear measurements

The row-sum encoder is multiplication by

$$W=\begin{pmatrix}1&1&0&0\\0&0&1&1\end{pmatrix},\qquad \lat=W\obs.$$

The rule is $(W\obs)_i=\sum_j W_{ij}o_j$. Each row chooses a weighted measurement of the input. Matrix multiplication composes these measurements: if $y=A\lat$ and $\lat=W\obs$, then $y=(AW)\obs$. To verify this, expand $y_i=\sum_k A_{ik}\sum_j W_{kj}o_j$, exchange the finite sums, and collect the coefficient $\sum_k A_{ik}W_{kj}$ multiplying $o_j$. That coefficient is exactly $(AW)_{ij}$.

A neural network repeatedly applies such maps, offsets them by a bias vector, and inserts nonlinear functions between them. Without those nonlinearities, all the matrices would combine into a single matrix, no matter how many layers we stacked.

A **tensor** in this book is a multidimensional array with named axes, not a mysterious extra mathematical object. A batch of $B$ sequences, each containing $T$ color images, has shape $B\times T\times C\times H\times W$. An embedding tensor might have shape $B\times T\times d$. Exchanging axes changes the interpretation of an average. It does not change the underlying values. Averaging over examples answers a different question from averaging over time.

## Length, angle, and projection

For vectors $x,y\in\mathbb R^d$, define the dot product $x^\top y=\sum_jx_jy_j$ and Euclidean length $\|x\|=\sqrt{x^\top x}$. For $x=(3,4)$ the length is $5$, by the Pythagorean theorem. The squared distance $\|x-y\|^2$ sums coordinatewise squared differences.

A unit vector $u$ has $\|u\|=1$. The scalar $h=u^\top x$ is the signed coordinate of $x$ along direction $u$. Why? Among points $cu$ on the line through $u$, minimize the distance to $x$:

$$\|x-cu\|^2=\|x\|^2-2c\,u^\top x+c^2.$$

Differentiation with respect to $c$ gives $-2u^\top x+2c$. Setting it to zero yields $c=u^\top x$; the second derivative is $2>0$, so this is the unique minimum. The projection vector is $(u^\top x)u$, while the projected scalar is $u^\top x$. SIGReg uses the scalar, one value per example and direction.

For $x=(3,4)$ and $u=(1,1)/\sqrt2$, the scalar projection is $7/\sqrt2$. A direction can reveal a relation between coordinates that neither coordinate alone reveals. That is why testing only the horizontal and vertical projections will not suffice for multivariate Gaussianity.

<figure class="diagram" data-diagram="projection"></figure>

The same expansion proves the Cauchy–Schwarz inequality. The minimum of $\|x-cu\|^2$ is nonnegative, hence $(u^\top x)^2\leq\|x\|^2$. Taking $u=y/\|y\|$ for nonzero $y$ gives $|x^\top y|\leq\|x\|\|y\|$. Equality means one vector lies along the other. Thus the normalized dot product is between $-1$ and $1$ and can consistently be interpreted as the cosine of their angle. This fact will underpin the paper's temporal-straightness diagnostic.

## Rank measures available directions

A linear map's **rank** is the number of independent output directions it can produce. Its **null space** is the set of input changes it maps to zero. For the row-sum encoder, the change $(1,-1,0,0)$ lies in the null space. Moving brightness from one pixel to the other leaves the representation unchanged.

If all learned embeddings lie on one line, they may vary substantially in magnitude while using only one direction. That is dimensional collapse. If all are identical, even that one degree of variation disappears. Checking the average norm alone would miss both a constant nonzero cloud and many lower-dimensional failures.

Subtract the mean from a batch of $B$ vectors to form the centered matrix $X_c$, with one example per row. Its rows sum to zero. At most $B-1$ rows can therefore be independent: the last is the negative sum of the others. Consequently,

$$\operatorname{rank}(X_c)\leq\min(d,B-1).$$

This is a structural limit, not a training defect. With $B=32$ and $d=192$, no single centered batch can have rank 192. Later we will distinguish finite-batch geometry from the population distribution that generates batches.

## Mean and covariance as geometry

For a batch $x_1,\ldots,x_B$, define the mean $\bar x=B^{-1}\sum_i x_i$. It is the point minimizing total squared distance to the samples. To see this, write $x_i-c=(x_i-\bar x)+(\bar x-c)$. On expanding the squares, the cross term vanishes because $\sum_i(x_i-\bar x)=0$. The remaining expression is

$$\sum_i\|x_i-c\|^2=\sum_i\|x_i-\bar x\|^2+B\|\bar x-c\|^2.$$

Only the last term depends on $c$, and its minimum is zero at $c=\bar x$.

Using a denominator $B$ for descriptive geometry, define

$$C=\frac1B\sum_i(x_i-\bar x)(x_i-\bar x)^\top=\frac1B X_c^\top X_c.$$

Entry $C_{jj}$ is the average squared deviation of coordinate $j$. Entry $C_{jk}$ is the average product of deviations of coordinates $j$ and $k$. If they tend to rise and fall together, their covariance is positive. If one rises while the other falls, it is negative. Zero covariance means this particular linear co-variation vanishes; it need not mean independence.

For any direction $u$, multiplication gives

$$u^\top Cu=\frac1B\sum_i\big[u^\top(x_i-\bar x)\big]^2.$$

The right side is precisely the variance along that direction. It is nonnegative, so covariance matrices are **positive semidefinite**: their quadratic form is never negative. This phrase is a compact statement about projected variances, not a new kind of probability.

A statistical estimate of population covariance often uses $B-1$ instead. Here is the reason in one dimension. Let independent samples have mean $\mu$ and variance $\sigma^2$. The identity $\sum_i(X_i-\bar X)^2=\sum_i(X_i-\mu)^2-B(\bar X-\mu)^2$ follows by the same square expansion. Taking expectations gives $B\sigma^2-B(\sigma^2/B)=(B-1)\sigma^2$. Dividing by $B-1$ removes this particular estimation bias. We derive the variance of the mean in the probability chapter. Neither denominator is universally “correct”; the objective must specify which it uses.

## Eigenvectors reveal the cloud's principal directions

An eigenvector $u$ of a matrix $C$ is a nonzero vector for which $Cu=\lambda u$. The matrix stretches that direction by a scalar $\lambda$ without changing its direction. For a covariance matrix, a unit eigenvector has projected variance $u^\top Cu=\lambda$.

Why are orthogonal principal directions available? A symmetric matrix has a real quadratic form. On the unit sphere it attains a maximum because that sphere is closed and bounded and the form is continuous. At a maximizing vector $u$, changing it infinitesimally in a perpendicular direction $v$ cannot increase the value; the derivative is $2v^\top Cu=0$. Thus $Cu$ has no component perpendicular to $u$, so $Cu=\lambda u$. Symmetry also makes the perpendicular subspace invariant: $u^\top Cv=(Cu)^\top v=0$. Repeat the argument inside that lower-dimensional subspace. Induction supplies an orthonormal basis of eigenvectors.

Collect those vectors into the columns of $Q$, so $Q^\top Q=I$, where $I$ is the identity matrix. The result is the spectral decomposition $C=Q\Lambda Q^\top$, with eigenvalues on the diagonal of $\Lambda$. For covariance all eigenvalues are nonnegative because each is a projected variance. This is the particular spectral theorem we need; no general nonsymmetric decomposition is being assumed.

For example,

$$C=\begin{pmatrix}2&1\\1&2\end{pmatrix}$$

has eigenvectors $(1,1)/\sqrt2$ and $(1,-1)/\sqrt2$, with variances 3 and 1. Multiply the matrix by each vector to verify those two claims. The cloud spreads more along its rising diagonal. The trace, the sum of diagonal entries, is 4; it also equals $3+1$, the total variance across principal directions. More generally, expand $\operatorname{tr}(Q\Lambda Q^\top)=\sum_j\lambda_j\sum_iQ_{ij}^2=\sum_j\lambda_j$.

## Whitening is a moment operation

If all eigenvalues are positive, transform a centered vector by $y=\Lambda^{-1/2}Q^\top(x-\mu)$. Its covariance is

$$\operatorname{Cov}(y)=\Lambda^{-1/2}Q^\top C Q\Lambda^{-1/2}=I.$$

Each equality follows from applying the linear map to both sides of the covariance outer product and using $Q^\top Q=I$. Dividing a principal coordinate by the square root of its variance gives it unit variance. This operation is called whitening. If an eigenvalue is zero, its inverse square root does not exist; one must remove that direction or choose an explicit regularized approximation.

Whitening does not make every distribution Gaussian. Uniform points on a circle of radius $\sqrt2$ in two dimensions have mean zero and covariance $I$: symmetry gives equal coordinate variances, and their sum is the constant squared radius 2. Yet every sample lies exactly on a circle. A two-dimensional Gaussian fills an area and has variable radius. Matching first and second moments cannot distinguish these distributions. This example motivates SIGReg's richer distributional measurements.

<div class="lab" id="geometry-lab"><div class="lab-head"><span class="eyebrow">Geometry desk</span><h3>Rotate the measuring direction</h3><p>The illustrative cloud approximates a distribution with covariance eigenvalues 3 and 1. Predict that distribution’s projected variance before turning the direction.</p></div><div class="controls"><label>Direction <input id="geometry-angle" type="range" min="0" max="180" value="45" step="1"/></label></div><canvas id="geometry-canvas" aria-label="An equal-scale sample cloud and its projection direction"></canvas><p id="geometry-readout" class="readout"></p><p class="caption">A deterministic illustrative cloud; no neural network is being trained. Equal horizontal and vertical units preserve the geometry.</p></div>

## The freedom to rename latent coordinates

Suppose an encoder and predictor work well. Apply an orthogonal matrix $Q$ to every embedding and conjugate the predictor accordingly: $f'(o)=Qf(o)$ and $g'(z,a)=Qg(Q^\top z,a)$. The new prediction error equals the old one because $\|Qv\|^2=v^\top Q^\top Qv=\|v\|^2$. An isotropic Gaussian also remains isotropic after this rotation, as we prove in the probability chapter.

Therefore the objective cannot uniquely name coordinate one “angle” and coordinate two “velocity.” Equally good rotated descriptions exist. A probe may recover an angle from a combination of coordinates. This non-uniqueness is not itself a flaw: maps can use different coordinate systems. It does warn us against interpreting a single coordinate or a pretty scatterplot too literally.

General invertible transformations preserve distinguishability but need not preserve Euclidean distances or the prediction objective. Scaling by a small constant shrinks squared errors by its square. That is why comparing raw prediction losses across independently learned representations can be misleading.

## Worked exercises: what survived?

Take the three embeddings $(1,0)$, $(0,1)$, and $(-1,-1)$. Their mean is zero. Compute their descriptive covariance and identify one direction with the largest variance.

<details class="derivation"><summary>Compute, then interpret</summary>

The three outer products sum to $\begin{pmatrix}2&1\\1&2\end{pmatrix}$. Divide by 3. The unit rising diagonal has variance 1 and the falling diagonal has variance $1/3$. Both are positive, so this centered batch spans two directions. Its rank reaches the limit $B-1=2$.

Now replace each vector by twice itself. Covariance becomes four times larger because both factors in every outer product double. Rank is unchanged. Scale and dimensional collapse are different diagnostics.

Finally map every vector to its first coordinate. The scalar values are $1,0,-1$. These examples remain distinct, but the map would identify $(1,0)$ with $(1,100)$ on a broader dataset. An embedding's adequacy must be assessed on the relevant distribution and tasks, not only on a tiny training list.

</details>

You now have the geometric vocabulary for the book: maps, projections, rank, covariance, principal directions, and transformations that preserve or destroy information. Next we ask what it means for these vectors to be random.
