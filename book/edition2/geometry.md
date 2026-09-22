# A world in coordinates

<p class="lead">A representation is a choice of distinctions. Linear algebra gives us a language for asking which distinctions survive.</p>

## From an image to a list of numbers

A grayscale image of height $H$ and width $W$ is an array of $HW$ intensity values. A color image has an additional channel index, often with three entries for red, green, and blue. **Flattening** merely places these numbers in a fixed order. It loses no information if the shape and ordering are known. A $2\times2$ image with rows $(1,0)$ and $(0,1)$ can become the vector $(1,0,0,1)^\top$. The transpose symbol $\top$ tells us to write that list as a column.

Write the observation column as $\obs$, with entries $o_1,o_2,o_3,o_4$. An encoder is a function $f$ that maps this long vector to a shorter description, which we call $\lat$. As a deliberately simple example, define

$$f(\obs)=\begin{pmatrix}o_1+o_2\\o_3+o_4\end{pmatrix}.$$

This encoder retains total intensity in each row. It cannot tell $(1,0,0,1)$ from $(0,1,1,0)$ because both become $(1,1)$. A reader can now answer precisely what the encoder loses: the left–right arrangement within each row. Saying it produces a two-dimensional “embedding” adds no guarantee of usefulness.

In deep learning, embedding usually means a learned coordinate representation. It does not imply an injective mathematical embedding that preserves every distinct input. An encoder may intentionally identify many inputs. The issue is whether inputs requiring different predictions or actions remain distinguishable.

<!-- VISUAL: G1 -->

## Matrices are coordinated linear measurements

The row-sum encoder is multiplication by

$$W=\begin{pmatrix}1&1&0&0\\0&0&1&1\end{pmatrix},\qquad \lat=W\obs.$$

For the first row, calculate $1o_1+1o_2+0o_3+0o_4=o_1+o_2$. The second row selects the other two pixels. The compact rule is $(W\obs)_i=\sum_j W_{ij}o_j$: $W_{ij}$ is the entry in row $i$, column $j$, and $\sum_j$ means add one term for every input coordinate $j$. Each row chooses a weighted measurement of the input. Matrix multiplication composes these measurements: if $y=A\lat$ and $\lat=W\obs$, then $y=(AW)\obs$. To verify this, expand $y_i=\sum_k A_{ik}\sum_j W_{kj}o_j$, exchange the finite sums, and collect the coefficient $\sum_k A_{ik}W_{kj}$ multiplying $o_j$. That coefficient is exactly $(AW)_{ij}$.

For example, let $A=(1,-1)$ subtract the second row sum from the first. Multiplication gives $AW=(1,1,-1,-1)$: applying the two maps successively gives the same answer as this single four-pixel measurement.

A neural network repeatedly applies such maps, offsets them by a bias vector, and inserts nonlinear functions between them. Without those nonlinearities, all the matrices would combine into a single matrix, no matter how many layers we stacked.

A **tensor** in this book is a multidimensional array with named axes, not a mysterious extra mathematical object. A batch of $B$ sequences, each containing $T$ color images, has shape $B\times T\times C\times H\times W$. An embedding tensor might have shape $B\times T\times d$. Exchanging axes changes the interpretation of an average. It does not change the underlying values. Averaging over examples answers a different question from averaging over time.

<!-- VISUAL: G2 -->

## Reading shapes before calculating

The notation $\mathbb R^d$ means lists of $d$ real numbers. A matrix in $\mathbb R^{m\times n}$ has $m$ rows and $n$ columns. Multiplying it by an $n$-entry column gives an $m$-entry column. Each output has one weighted sum with $n$ terms. For our encoder, $m=2$ and $n=4$.

Transpose exchanges rows and columns. Thus a column $x$ becomes a row $x^\top$. There are two different products to keep apart. If $x=(1,2)^\top$ and $y=(3,4)^\top$, then $x^\top y=1\cdot3+2\cdot4=11$, a scalar. But

$$xy^\top=\begin{pmatrix}3&4\\6&8\end{pmatrix},$$

a matrix whose $(i,j)$ entry is $x_i y_j$. This is the **outer product**. We will use it to record how coordinates vary together. Multiplication order changes both meaning and shape.

The identity matrix $I$ has ones on its diagonal and zeros elsewhere, so $Ix=x$. A square matrix is invertible when a map $W^{-1}$ undoes it: $W^{-1}W=WW^{-1}=I$. Our two-row, four-column encoder cannot have such an inverse, because different images give the same output. A **linear combination** adds scaled vectors. Vectors are independent if no nonzero choice of coefficients makes that combination zero; this will make the definition of rank concrete.

<!-- VISUAL: G3 -->

## Length, angle, and projection

For vectors $x,y\in\mathbb R^d$, define the dot product $x^\top y=\sum_jx_jy_j$ and Euclidean length $\|x\|=\sqrt{x^\top x}$. For $x=(3,4)$ the length is $5$, by the Pythagorean theorem. The squared distance $\|x-y\|^2$ sums coordinatewise squared differences.

A unit vector $u$ has $\|u\|=1$. The scalar $h=u^\top x$ is the signed coordinate of $x$ along direction $u$. Why? Among points $cu$ on the line through $u$, minimize the distance to $x$:

$$\|x-cu\|^2=\|x\|^2-2c\,u^\top x+c^2.$$

Complete the square instead of guessing the closest point:

$$\|x-cu\|^2=(c-u^\top x)^2+\|x\|^2-(u^\top x)^2.$$

Only the first term changes with $c$. A square cannot be negative and is zero precisely at $c=u^\top x$. This proves the minimizing value without needing calculus. The projection vector is $(u^\top x)u$, while the projected scalar is $u^\top x$. SIGReg uses the scalar, one value per example and direction.

For $x=(3,4)$ and $u=(1,1)/\sqrt2$, the scalar projection is $7/\sqrt2$. A direction can reveal a relation between coordinates that neither coordinate alone reveals. We will reuse this diagonal measurement when comparing clouds of learned representations.

<figure class="diagram" data-diagram="projection"></figure>

The same expansion proves the Cauchy–Schwarz inequality. The minimum of $\|x-cu\|^2$ is nonnegative, hence $(u^\top x)^2\leq\|x\|^2$. Taking $u=y/\|y\|$ for nonzero $y$ gives $|x^\top y|\leq\|x\|\|y\|$. Equality means one vector lies along the other. Thus the normalized dot product is between $-1$ and $1$ and can consistently be interpreted as the cosine of their angle. We will reuse this bound when comparing directions of motion.

<!-- VISUAL: G4 -->

## Rank measures available directions

A linear map's **rank** is the number of independent output directions it can produce. Its **null space** is the set of input changes it maps to zero. For the row-sum encoder, the change $(1,-1,0,0)$ lies in the null space. Moving brightness from one pixel to the other leaves the representation unchanged.

If all learned embeddings lie on one line, they may vary substantially in magnitude while using only one direction. That is dimensional collapse. If all are identical, even that one degree of variation disappears. Checking the average norm alone would miss both a constant nonzero cloud and many lower-dimensional failures.


<!-- VISUAL: G5 -->

## Work one complete encoding by hand

Take an image with flattened pixels $\obs=(2,1,0,3)^\top$. Before continuing, compute its two row sums, their distance from the representation of $(1,2,2,1)^\top$, and their projection on $u=(1,0)^\top$.

<details class="derivation"><summary>Check the calculations and their meaning</summary>

Both images map to $(3,3)^\top$. Their representation distance is zero although their pixels differ. The projection is $3$: multiply corresponding coordinates and add, $1\cdot3+0\cdot3=3$. The two-dimensional representation has already discarded the within-row arrangement. Projecting it onto the first axis then discards the second row sum as well.

A zero distance means “the same description under this map.” It does not mean “the same physical image.” This distinction is the reason we will later evaluate what an encoder preserves rather than trusting its output dimension.

</details>

We can now write descriptions and compare them. The next question is why the same description may accompany different futures. That requires probability; only afterward will we describe the geometry of a whole random cloud.
