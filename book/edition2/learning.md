# How errors change a model

<p class="lead">Learning is a repeated calculation: make a prediction, measure an error, trace how each parameter contributed, and make a small change.</p>

## Parameters are the knobs inside a function

Recall the two-parameter predictor from the calculus chapter, now with a general input: $\hat y=wx+b$. The input $x$ changes from example to example. The parameters $w,b$ are shared across examples and adjusted during training. Given target $y$, choose the loss $\ell=\tfrac12(\hat y-y)^2$. The factor $1/2$ is a convenient scaling convention; it cancels the 2 from differentiating a square.

The derivative asks how a small parameter change affects the loss. Applying the chain rule,

$$\frac{\partial\ell}{\partial w}=(\hat y-y)x,\qquad \frac{\partial\ell}{\partial b}=\hat y-y.$$

For $x=2,y=5,w=1,b=0$, the prediction is 2 and the error is $-3$. The derivatives are $-6$ and $-3$. A gradient-descent update with step size $\eta=0.1$ gives $w'=1.6,b'=0.3$, prediction 3.5, and loss 1.125 instead of 4.5. The negative sign in $\theta' = \theta-\eta\nabla\ell$ means moving against the direction of increasing loss.

Why should this direction help? Differentiability gives the local approximation $\ell(\theta+\delta)=\ell(\theta)+\nabla\ell^\top\delta+o(\|\delta\|)$. Substituting $\delta=-\eta\nabla\ell$ makes the first-order change $-\eta\|\nabla\ell\|^2$. For sufficiently small positive $\eta$ and a nonzero gradient, the loss decreases. Large steps need not follow the local approximation.

For the scalar quadratic $\ell(w)=\tfrac12 c(w-w_*)^2$ with $c>0$, the update error is $w'-w_*=(1-\eta c)(w-w_*)$. Repeated errors shrink exactly when $|1-\eta c|<1$, or $0<\eta<2/c$. This simple example explains overshooting without pretending that a neural-network objective is globally quadratic.

## A neuron, a layer, and a network

A layer first forms $r=Wx+b$, then applies an activation coordinatewise: $h_j=\sigma(r_j)$. ReLU is $\sigma(r)=\max(0,r)$. Its derivative is 1 for positive input and 0 for negative input; at zero an implementation chooses a convention. A smooth alternative is $\tanh r=(e^r-e^{-r})/(e^r+e^{-r})$, whose quotient-rule derivative simplifies to $1-\tanh^2r$.

The browser model uses **GELU**, a smooth gate. Let $p(u)=e^{-u^2/2}/\sqrt{2\pi}$ be the standard-Gaussian density and let $\Phi(x)=\int_{-\infty}^x p(u)\,du$ be the probability that a standard-Gaussian variable is at most $x$. Then define

$$\operatorname{GELU}(x)=x\Phi(x).$$

For a large positive input, $\Phi(x)$ is near one, so the input mostly passes through. For a large negative input it is near zero, so the input is strongly attenuated. At zero, symmetry gives $\Phi(0)=1/2$. By the fundamental theorem of calculus, $\Phi'(x)=p(x)$; the product rule therefore gives $\operatorname{GELU}'(x)=\Phi(x)+xp(x)$, including slope $1/2$ at zero. A probability function defines the gate; it does not imply that the network’s features are probabilities or Gaussian samples.

Without an activation, two layers give $W_2(W_1x+b_1)+b_2=(W_2W_1)x+(W_2b_1+b_2)$, still one affine map. Nonlinearity is what allows stacked layers to represent relations beyond a single affine transformation. “Expressive” does not mean a particular training run will find the desired function.

A residual block computes $h'=h+F(h)$. It allows a layer to learn a correction instead of an entire new representation. The derivative contains an identity path: $\partial h'/\partial h=I+J_F$, where $J_F$ is the Jacobian of $F$. This can make information and gradients easier to preserve, though it is not an unconditional guarantee against unstable training.

<!-- VISUAL: N1 -->

<!-- VISUAL: N2 -->

<!-- VISUAL: N3 -->

## Backpropagation is organized chain rule

Take a two-layer scalar-output network:

$$\begin{aligned}&r=W_1x+b_1, \\ &h=\sigma(r), \\ &\hat y=w_2^\top h+b_2, \\ &\ell=\tfrac12(\hat y-y)^2.\end{aligned}$$

Start with the output error $e=\hat y-y$. A change in $w_{2j}$ changes the output by $h_j$ times that change, so $\partial\ell/\partial w_2=eh$. A change in $h$ contributes $ew_2$. Passing through the activation multiplies coordinatewise by its derivative:

$$\begin{aligned}&\delta=(ew_2)\odot\sigma'(r), \\ &\frac{\partial\ell}{\partial W_1}=\delta x^\top, \\ &\frac{\partial\ell}{\partial b_1}=\delta.\end{aligned}$$

The symbol $\odot$ means multiply corresponding coordinates. The outer product has the correct shape: if there are $m$ hidden units and $n$ input coordinates, $\delta x^\top$ is $m\times n$, exactly the shape of $W_1$. Each entry is the downstream sensitivity $\delta_i$ times the input $x_j$ that the parameter multiplies.

An automatic differentiation system records this computation graph and applies these local rules backward. It is not estimating derivatives by tiny finite perturbations. It computes chain-rule derivatives of the implemented operations, up to numerical arithmetic and conventions at nondifferentiable points. Finite differences provide an independent check on that implementation.

<!-- VISUAL: N4 -->

## One example versus a batch

An empirical objective averages losses over training examples: $L(\theta)=n^{-1}\sum_i\ell_i(\theta)$. Linearity of differentiation gives $\nabla L=n^{-1}\sum_i\nabla\ell_i$. A minibatch of uniformly sampled examples estimates this average gradient. Sampling without bias makes its expectation equal the full gradient; independence assumptions determine its variance.

**Stochastic gradient descent** uses this estimate, so the full training loss need not decrease at every update. Batch size changes both the amount of computation and the variability of the update. With a distributional batch penalty, the batch itself also defines the statistic: averaging gradients of separate small-batch penalties is generally not the same as taking the penalty on one combined batch. SIGReg makes that distinction especially concrete.

An **epoch** is one pass through a dataset by a specified sampling scheme. An **update** is one optimizer step. Neither is interchangeable with seconds of computation. Two systems may perform the same number of updates with different batch sizes and therefore see different numbers of examples.

## Momentum and Adam

Here $k$ counts optimizer updates; $t$ remains environment time in our world-model notation.

Momentum averages recent gradients so a persistent direction accumulates while some fluctuations cancel. One convention is $m_k=\beta m_{k-1}+(1-\beta)g_k$, initialized at zero. Expanding the recurrence gives $m_k=(1-\beta)\sum_{j=1}^k\beta^{k-j}g_j$. If every gradient equals a fixed $g$, this becomes $(1-\beta^k)g$ because $(1-\beta)(1+\beta+\cdots+\beta^{k-1})=1-\beta^k$: all intermediate powers cancel when we subtract the shifted sum. Dividing by $1-\beta^k$ removes the zero-initialization bias under that stationary-mean model.

Adam maintains one such average of gradients and another of coordinatewise squared gradients:

$$\begin{aligned}&m_k=\beta_1m_{k-1}+(1-\beta_1)g_k, \\ &v_k=\beta_2v_{k-1}+(1-\beta_2)g_k^2.\end{aligned}$$

$$\begin{aligned}&\hat m_k=\frac{m_k}{1-\beta_1^k}, \\ &\hat v_k=\frac{v_k}{1-\beta_2^k}, \\ &\theta_{k+1}=\theta_k-\eta\frac{\hat m_k}{\sqrt{\hat v_k}+\epsilon}.\end{aligned}$$

All operations in the last fraction are coordinatewise. A coordinate with consistently large gradients gets a larger denominator. The positive $\epsilon$ avoids division by zero and affects very small-gradient behavior. These recurrences define an optimization algorithm; they do not prove convergence for every network. The browser model uses Adam. A saved checkpoint needs the moment arrays and update count as well as weights if we want to resume the same optimization trajectory.

**Work through two optimizer steps.** Use scalar gradients $g_1=2$, $g_2=-1$, $\beta_1=0.9$, and $\beta_2=0.99$. After the first step, $m_1=0.2$ and $v_1=0.04$. Bias correction gives $\hat m_1=2$ and $\hat v_1=4$, so the update is approximately $-\eta$ when $\epsilon$ is small.

At the second step, $m_2=0.9(0.2)+0.1(-1)=0.08$ and $v_2=0.99(0.04)+0.01(1)=0.0496$. The corrected values are approximately $0.4211$ and $2.4925$. The update still points in the negative direction, despite the current negative gradient, because the moving average remembers the previous positive gradient. Momentum is a preference for accumulated direction; it can help or delay a necessary reversal.

<!-- VISUAL: N5 -->

## Regularization begins with an underdetermined question

Suppose several functions fit the observations. Which should we prefer? A regularizer adds a second preference to the training objective. It may favor small weights, smooth outputs, robustness to perturbations, or a particular distribution of representations. It is not synonymous with “make weights small.”

For a concrete ambiguity, suppose the only observed pair is $x=1,y=1$. The functions $f(x)=1$ and $g(x)=1+100(x-1)^2$ both fit it exactly, but at $x=1.1$ they predict 1 and 2. The observation alone cannot choose between them. A preference for less curvature would favor the first; whether that is correct depends on the unobserved world. A regularizer adds an assumption rather than extracting new evidence from the same point.

Take the scalar model $y_i\approx wx_i$ and objective

$$\begin{aligned}&L(w)=\sum_i(wx_i-y_i)^2+\lambda w^2, \\ &\lambda\geq0.\end{aligned}$$

Differentiate and collect terms: $L'(w)=2w\sum_i x_i^2-2\sum_i x_iy_i+2\lambda w$. Setting this to zero yields

$$w_* = \frac{\sum_i x_i y_i}{\sum_i x_i^2+\lambda},$$

when the denominator is positive. The curvature is twice that denominator, so the solution is a unique minimum. With a single point $x=y=1$, the fitted weight is $1/(1+\lambda)$. Larger $\lambda$ sacrifices training fit to favor smaller magnitude. Whether that helps unseen data depends on whether the preference suits the problem.

For vector weights, put one input example in each row of a design matrix $X$. Then $Xw$ is the column of predictions. The objective is $\|Xw-y\|^2+\lambda\|w\|^2$. Expand it as $w^\top X^\top Xw-2w^\top X^\top y+y^\top y+\lambda w^\top w$. A symmetric quadratic $w^\top Aw=\sum_{ij}w_iA_{ij}w_j$ has coordinate derivative $\sum_jA_{kj}w_j+\sum_iw_iA_{ik}=2(Aw)_k$. Thus the objective gradient is $2X^\top Xw-2X^\top y+2\lambda w$. Setting it to zero gives the normal equations

$$(X^\top X+\lambda I)w=X^\top y.$$

For $\lambda>0$, every nonzero $v$ satisfies $v^\top(X^\top X+\lambda I)v=\|Xv\|^2+\lambda\|v\|^2>0$. Hence the matrix has no nonzero null vector and is invertible. Thus $w_*=(X^\top X+\lambda I)^{-1}X^\top y$. An implementation should usually solve the linear system rather than explicitly form an inverse.

If the data term is averaged instead of summed, the same numerical $\lambda$ represents a different tradeoff. Dividing the whole sum objective by $n$ changes the regularizer coefficient to $\lambda/n$. Reduction conventions belong in the model specification.

<div class="lab" id="ridge-lab"><div class="lab-head"><span class="eyebrow">Regularization desk</span><h3>A second preference changes the answer</h3><p>Fit the single observation (1, 1) with a line through the origin. The exact ridge solution is shown; this is an algebraic demonstration.</p></div><div class="controls"><label>Penalty strength <input id="ridge-lambda" type="range" min="0" max="5" step="0.05" value="1"/></label></div><canvas id="ridge-canvas" aria-label="Ridge-regression line changing with the weight penalty"></canvas><p id="ridge-readout" class="readout"></p></div>

<!-- VISUAL: N6 -->

## Other ways to express a preference

A weight penalty favors particular parameter values; identifying useful distinctions in an image requires a learning task and data. When we start learning the targets as well as the predictions, that limitation will become important.

There are other regularization mechanisms. **Data augmentation** changes inputs while declaring which relationships should survive. **Dropout** randomly zeros intermediate activations during training. In inverted dropout, an activation is multiplied by $M/(1-p)$ where $M$ is 1 with probability $1-p$ and 0 otherwise. Its expected value is unchanged because $\mathbb E[M]=1-p$. That identity motivates the scaling; it does not mean an entire nonlinear network has unchanged expected output. Dropout is normally disabled during evaluation.

**Early stopping** chooses a checkpoint using held-out performance rather than training indefinitely. The validation set used for that decision is no longer an untouched final test set. These methods affect different aspects of learning and are not interchangeable.

## Normalization is also not regularization by definition

Normalization transforms activations using a mean and scale. Batch Normalization computes statistics across a batch for each feature; Layer Normalization computes statistics across features within each example. A normalized value takes the form $(x-\mu)/\sqrt{v+\epsilon}$, usually followed by a learned affine scale and shift.

The denominator rescales fluctuations, and $\epsilon>0$ prevents division by zero. Which axis is used changes the geometry. A per-example normalization can constrain every vector’s length while a Gaussian target requires fluctuating lengths. This will explain why LeWM places a projector after the encoder’s final Layer Normalization. A normalization layer may influence regularization or optimization, but its name does not imply it supplies all needed anti-collapse constraints.

<!-- VISUAL: N7 -->

## Check a gradient before trusting a curve

For one parameter coordinate, compare the analytic derivative with the central difference

$$\frac{L(\theta+\varepsilon e_j)-L(\theta-\varepsilon e_j)}{2\varepsilon}.$$

Taylor expansions on the two sides cancel the constant and even-order terms, leaving $\partial_jL+O(\varepsilon^2)$ if the needed third derivative is bounded nearby. Making $\varepsilon$ extremely small can worsen floating-point cancellation. Fix randomness, use a smooth small example and adequate precision, and examine a range of perturbation sizes.

A decreasing loss is weaker evidence than this check. A wrong gradient can still decrease some objectives. Conversely, a correct stochastic update may increase a measured batch loss. Check mathematics, array shapes, stochastic conventions, and held-out behavior separately.

## Worked exercise: trace one update by hand

Let $x=1$, $W_1=2$, $b_1=0$, $w_2=3$, $b_2=0$, with ReLU and target $y=4$. Find all four parameter gradients of $\tfrac12(\hat y-y)^2$.

<details class="derivation"><summary>Follow the computation graph</summary>

The preactivation is 2, the activation is 2, the output is 6, and the error is 2. The output-weight gradient is $eh=4$; the output-bias gradient is 2. Because ReLU’s input is positive, its derivative is 1, so the hidden sensitivity is $ew_2=6$. The first-weight gradient is $6x=6$, and the first-bias gradient is 6.

With step size 0.01 the new parameters are 1.94, −0.06, 2.96, −0.02. The new hidden activation is 1.88 and the output is 5.5448. The error has decreased. Updating the hidden weight while forgetting that the hidden bias also contributes would produce a different calculation. An automatic differentiation system should reproduce these four gradients exactly within arithmetic precision.

</details>

Try to explain the roles separately: the model computes predictions, the loss expresses what is preferred, and the optimizer chooses parameter updates.

The basic machinery is now in place. We can understand a neural-network objective, derive its parameter sensitivities, and state which choices are statistical preferences or numerical algorithms. The [JEPA chapter](#jepa) asks which objective prevents a predictive representation from erasing the world.
