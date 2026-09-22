# How a small change travels

<p class="lead">Before we can train a network, we need to trace how changing one number changes another. We begin with a slope and finish with the matrix form of the chain rule.</p>

We already know how to multiply matrices and measure squared distances. This chapter gives those operations sensitivities. Keep a concrete question in mind: if a prediction is too small, which adjustable number should move, and by how much?

## Recover a derivative from a difference

For $f(x)=x^2$, change the input from $x$ to $x+h$. The output change is $(x+h)^2-x^2=2xh+h^2$. Divide by the input change:

$$\frac{f(x+h)-f(x)}h=2x+h.$$

As $h$ approaches zero, the ratio approaches $2x$. That limit is the derivative $f'(x)$. Near $x=3$, a small input change of $0.01$ produces approximately $6(0.01)=0.06$ output change. The exact change is $0.0601$; the omitted $h^2$ accounts for the difference.

A derivative is a local conversion factor, with units of output per unit input. It need not describe a large change accurately. This is why a training step can be too large even when its direction is correct.

For two functions, expand the product difference:

$$(uv)(x+h)-(uv)(x)=u(x+h)[v(x+h)-v(x)]+v(x)[u(x+h)-u(x)].$$

Divide by $h$ and take the limit to obtain $(uv)'=u'v+uv'$. To differentiate $1/v$, differentiate $v(1/v)=1$: its derivative is zero, giving $(1/v)'=-v'/v^2$ when $v\ne0$. Combining these rules proves the quotient rule. We will reuse both for normalized probabilities.

<!-- VISUAL: D1 -->

## Several knobs require partial derivatives

Consider $L(w,b)=(2w+b-5)^2/2$. A **partial derivative** changes one input while holding the others fixed. Write $e=2w+b-5$. If only $w$ changes by $h$, the error becomes $e+2h$, so

$$L(w+h,b)-L(w,b)=\tfrac12[(e+2h)^2-e^2]=2eh+2h^2.$$

Dividing by $h$ and taking the limit gives $\partial L/\partial w=2e$. If only $b$ changes, the same expansion gives $\partial L/\partial b=e$.

Collect these sensitivities into the **gradient**, a column vector:

$$\nabla L=\begin{pmatrix}2e\\e\end{pmatrix}.$$

At $w=1,b=0$, the prediction is 2, the target is 5, and $e=-3$. Thus the gradient is $(-6,-3)^\top$. Both negative components say that a small positive change of the corresponding parameter lowers the loss at this point.

<!-- VISUAL: D2 -->

## A directional change is a dot product

Change both parameters by $\delta=(\delta_w,\delta_b)^\top$. In this example the exact expansion is

$$L(\theta+\delta)-L(\theta)=\nabla L^\top\delta+\tfrac12(2\delta_w+\delta_b)^2,$$

where $\theta=(w,b)^\top$. The dot product is the first-order change; the final square is the curvature correction. For a differentiable scalar function, the corresponding local statement is

$$L(\theta+\delta)=L(\theta)+\nabla L^\top\delta+o(\|\delta\|).$$

The notation $o(\|\delta\|)$ names a remainder whose ratio to $\|\delta\|$ tends to zero. It is a statement about shrinking steps, not about a specific step size. Our exact quadratic remainder has that property because it is bounded by a constant times $\|\delta\|^2$.

Among unit directions $u$, Cauchy–Schwarz gives $\nabla L^\top u\geq-\|\nabla L\|$. For a nonzero gradient, equality holds at $u=-\nabla L/\|\nabla L\|$. This proves why the negative gradient is the steepest local decrease for Euclidean step length. Taking $\delta=-\eta\nabla L$ gives first-order change $-\eta\|\nabla L\|^2$.

Try $\eta=0.1$ in our example. The update is $(w,b)=(1.6,0.3)$, the prediction is 3.5, and the loss is $1.5^2/2=1.125$, down from 4.5. The first-order prediction for the loss change was $-0.1(36+9)=-4.5$; curvature adds $1.125$. A linear approximation explains the direction without promising an exact outcome.

## A chain multiplies sensitivities

Suppose $x$ changes an intermediate value $u=f(x)$, which changes $y=g(u)$. For a small input step, $\Delta u=f'(x)\Delta x$ plus a smaller-order remainder. Then $\Delta y=g'(u)\Delta u$ plus its remainder. Substitution yields the chain rule

$$\frac{dy}{dx}=g'(f(x))f'(x).$$

For $y=(3x+1)^2$, the outside derivative is $2(3x+1)$ and the inside derivative is 3. At $x=1$, their product is $8\cdot3=24$. Differentiating the expanded polynomial $9x^2+6x+1$ gives the same result. Both calculations measure the same dependence.

If a parameter reaches the output by two routes, the contributions add. For $y=w^2+w$, one route contributes $2w$, the other 1. This simple fact will be decisive when the same encoder appears on both sides of a prediction loss.

<!-- VISUAL: D3 -->

## Exponentials and logarithms undo one another

The Gaussian density, likelihood, and attention weights all use exponentials. For positive $x$, define the natural logarithm by $\log x=\int_1^x dt/t$. The fundamental theorem of calculus gives $(\log x)'=1/x$. Its derivative is positive, so the logarithm is strictly increasing. It maps positive inputs onto all real numbers: for example, each interval $[2^j,2^{j+1}]$ contributes at least $1/2$ to the integral, so there is no finite upper limit; substitution $t=1/u$ gives $\log(1/x)=-\log x$ and hence no finite lower limit.

Define $e^u$ as the inverse: $\log(e^u)=u$, with $e^0=1$. Differentiate this identity with the chain rule: $(e^u)'/e^u=1$, so $(e^u)'=e^u$.

Why do logarithms turn products into sums? For fixed $a>0$, differentiate $\log(ab)-\log b$ with respect to $b$. The result is $a/(ab)-1/b=0$, so the difference is constant. At $b=1$ it equals $\log a$. Therefore $\log(ab)=\log a+\log b$, and inversion gives $e^{u+v}=e^ue^v$. In particular, taking the logarithm of a product of positive densities turns it into a sum. Since the logarithm increases, maximizing that sum chooses the same parameters as maximizing the product. Negating it turns maximization into minimization. This will explain the planner's likelihood calculation.

## A Jacobian is a table of local effects

Let $f:\mathbb R^n\to\mathbb R^m$. Its **Jacobian** $J_f$ has one row for each output and one column for each input:

$$(J_f)_{ij}=\frac{\partial f_i}{\partial x_j},\qquad \Delta f\approx J_f\Delta x.$$

Take $f(x_1,x_2)=(x_1x_2,x_1+x_2)^\top$. Its Jacobian is

$$J_f(x)=\begin{pmatrix}x_2&x_1\\1&1\end{pmatrix}.$$

At $(2,3)$, a change $(0.01,-0.02)$ predicts output change $(-0.01,-0.01)$. The first actual output changes from 6 to $2.01\cdot2.98=5.9898$, a change of $-0.0102$; the second changes exactly by $-0.01$. The small mismatch is the product of the two input changes.

For a composition $g(f(x))$, local changes give $\Delta g\approx J_g\Delta f\approx J_gJ_f\Delta x$. Thus

$$J_{g\circ f}(x)=J_g(f(x))J_f(x).$$

The dimensions must agree: an $r\times m$ matrix multiplies an $m\times n$ matrix, producing an $r\times n$ sensitivity table. This is the chain rule for many inputs and outputs.

<!-- VISUAL: D4 -->

## Why backpropagation uses a transpose

Let a scalar loss $L$ depend on $y=f(x)$. Its local change is $\Delta L\approx(\nabla_yL)^\top\Delta y$. Substitute $\Delta y\approx J_f\Delta x$ and regroup:

$$\Delta L\approx(\nabla_yL)^\top J_f\Delta x=(J_f^\top\nabla_yL)^\top\Delta x.$$

Comparing coefficients of $\Delta x$ gives $\nabla_x L=J_f^\top\nabla_yL$. A forward calculation maps input changes to output changes; a backward calculation maps output sensitivities to input sensitivities. The transpose follows from that regrouping, not from a software convention.

For the previous $f$ at $(2,3)$ and loss $L=y_1^2/2+y_2$, we have $y=(6,5)$ and $\nabla_yL=(6,1)^\top$. Therefore $\nabla_xL=(19,13)^\top$. Expanding $L=(x_1x_2)^2/2+x_1+x_2$ and differentiating each coordinate verifies both numbers.

## Curvature and the second-order approximation

The **Hessian** $H_L$ is the matrix of second partial derivatives. It describes how the gradient itself changes. For our loss $(2w+b-5)^2/2$,

$$H_L=\begin{pmatrix}4&2\\2&1\end{pmatrix}.$$

Its quadratic contribution is $\delta^\top H_L\delta/2=(2\delta_w+\delta_b)^2/2$, exactly the correction we already computed.

To derive the general form, turn a vector displacement $v$ into a one-dimensional path $r(t)=L(x+tv)$. The chain rule gives $r'(t)=\nabla L(x+tv)^\top v$ and $r''(t)=v^\top H_L(x+tv)v$. Twice using the fundamental theorem of calculus gives

$$r(1)=r(0)+r'(0)+\int_0^1(1-t)r''(t)\,dt.$$

If the Hessian is continuous near $x$, replace it inside the integral by $H_L(x)$ plus a difference that tends uniformly to zero as $v$ shrinks. Since $\int_0^1(1-t)dt=1/2$, this yields

$$L(x+v)=L(x)+\nabla L(x)^\top v+\tfrac12v^\top H_L(x)v+o(\|v\|^2).$$

The **Laplacian** is just the trace of this Hessian, $\nabla^2 L=\sum_j\partial_j^2L$. Here $\nabla^2 L$ is a scalar sum, while $H_L$ denotes the full Hessian matrix; $\Delta L$ still means a change in loss. For our example the sum is $4+1=5$. Later, averaging small symmetric perturbations will cancel linear terms and expose this sum of curvatures in the Gaussian theory.

<!-- VISUAL: D5 -->

## Approximation notation should say what shrinks

Writing $R(h)=O(h^2)$ means there is a fixed finite $C$ such that $|R(h)|\leq C|h|^2$ for sufficiently small $|h|$. Writing $R(h)=o(h^2)$ means $R(h)/h^2\to0$. Thus $3h^2$ is $O(h^2)$ but not $o(h^2)$; $h^3$ is both near zero. Neither notation alone tells us how accurate an approximation is at $h=0.1$.

For a smooth scalar $f$, Taylor expansion at $x+h$ and $x-h$ gives

$$f(x\pm h)=f(x)\pm hf'(x)+\tfrac12h^2f''(x)+O(h^3).$$

Subtract and divide by $2h$. The even terms cancel, leaving the central difference $[f(x+h)-f(x-h)]/(2h)=f'(x)+O(h^2)$ when third derivatives are bounded nearby. This provides an independent numerical check of a derivative. Extremely tiny steps can lose accuracy because computers subtract rounded, nearly equal numbers.

## Return to the cloud: why principal directions exist

We promised to justify the general covariance decomposition. The new derivative tools let us do it. Let $C$ be any real symmetric matrix and consider $u^\top Cu$ on unit vectors. We want a direction with the greatest value.

First, such a direction exists. The unit sphere is closed and bounded in finite-dimensional Euclidean space. To see why a sequence on it has a convergent subsequence, enclose it in the cube $[-1,1]^d$. Bisect each side and retain a closed subcube containing infinitely many sequence terms. Repeat, choosing a later term at every stage. After $n$ stages the retained cube has diameter $2\sqrt d/2^n$, which tends to zero. The selected coordinates form Cauchy sequences and converge by completeness of the real numbers. Continuity of the norm keeps the limit on the unit sphere. Choose a sequence whose quadratic values approach their supremum. Continuity makes the limit's value equal that supremum. This uses the basic completeness property of real coordinates; it is the finite-dimensional extreme-value argument, not an assumption about the data.

Let $u$ maximize the value and let $v$ be perpendicular to it. To stay on the sphere, move along $u(t)=(u+tv)/\|u+tv\|$. Because $u^\top v=0$, its denominator is $\sqrt{1+t^2\|v\|^2}$, whose derivative at zero is zero. Differentiating $u(t)^\top C u(t)$ at zero gives $2v^\top Cu$. At a maximum this is zero for every such $v$.

Therefore $Cu$ has no component perpendicular to $u$: $Cu=\lambda u$. For any $v$ perpendicular to $u$, symmetry also gives $u^\top Cv=(Cu)^\top v=\lambda u^\top v=0$. Hence $C$ maps that perpendicular subspace into itself.

Repeat the same argument inside that subspace, whose dimension is one smaller. In one dimension the matrix contains one entry, say $c$. Multiplying the unit vector $1$ gives $c$, so this vector is an eigenvector with eigenvalue $c$. By induction, we obtain a full set of perpendicular unit eigenvectors. Placing them in $Q$ gives $CQ=Q\Lambda$, and multiplying by $Q^\top$ yields $C=Q\Lambda Q^\top$. For a covariance matrix, $\lambda=u^\top Cu\geq0$. This completes the proof needed for general whitening and the later Gaussian theory.

<!-- VISUAL: D6 -->

## Check the whole chain

Let $u=2x+b$, $y=u^2$, and $L=(y-1)^2/2$. At $x=1,b=0$, find $\partial L/\partial x$ and $\partial L/\partial b$ before revealing the answer.

<details class="derivation"><summary>Trace the numbers backward</summary>

Forward: $u=2$, $y=4$, and the residual is 3. Backward: $\partial L/\partial y=3$, $\partial y/\partial u=4$, so $\partial L/\partial u=12$. The routes from $x$ and $b$ to $u$ have sensitivities 2 and 1. Therefore the requested derivatives are 24 and 12. If both $x$ and $b$ changed by $0.001$, the first-order loss change would be $0.001(24+12)=0.036$.

</details>

We now have the local rules, their matrix form, and a way to check them. The next chapter uses these rules to learn a predictor repeatedly from data, then asks why fitting the observed examples may not be enough.
