# From equations to a learner

<p class="lead">The objective becomes a working model only when every array has a meaning, every action lines up with its transition, and every average uses the intended axis.</p>

## Define the experiment before writing the loss

Our browser experiment learns from a two-link mechanism observed through a $64\times64$ grayscale camera. At each step the simulator updates joint motion under a two-coordinate action and renders an image. The encoder receives the 4,096 pixel values, not the simulator’s joint angles. The predictor receives embeddings and actions, not a privileged physical state.

The simulator is necessary to generate consequences. It must not be confused with the learned world model. During planning, candidate futures are evaluated by the learned predictor. The real simulator is stepped only to execute the selected action and measure what actually happens. A hidden call to the simulator inside candidate scoring would answer a much easier question.

A training example contains three consecutive selected observations and two aligned actions. Call them $(\observed{o}_{t-1},\observed{o}_t,\observed{o}_{t+1},\action{a}_{t-1},\action{a}_t)$. The first action explains the transition into the current observation; the second explains the transition whose target is the final observation. This explicit naming prevents the common mistake of pairing the future frame with the wrong action.

## Follow one window through its shapes

| Quantity | Shape | Meaning |
|---|---|---|
| Camera windows | $B\times3\times4096$ | Three flattened grayscale frames per example |
| Action windows | $B\times2\times2$ | Two transitions, each with two action coordinates |
| Encoded windows | $B\times3\times8$ | Eight learned coordinates per frame |
| Predictor input | $B\times20$ | Two embeddings plus two actions |
| Predicted future | $B\times8$ | Prediction for the third frame’s embedding |
| SIGReg input | $3\times B\times8$ | Time first; each time position has a batch distribution |

The predictor’s input width is $8+8+2+2=20$. The action values are normalized controls in $[-1,1]$; the simulator maps these to its chosen physical torque scale. Units and normalization belong in a reproducible configuration.

The encoder is a multilayer perceptron (MLP) with widths 4,096 → 128 → 8. The predictor is an MLP with widths 20 → 128 → 128 → 8 and a residual output. GELU supplies the nonlinearities. For a dense layer from width $m$ to width $n$, there are $mn$ weights and $n$ biases because each output uses one weight per input and one offset.

Let $p(u)=e^{-u^2/2}/\sqrt{2\pi}$ be the standard-Gaussian density and $\Phi(x)=\int_{-\infty}^x p(u)\,du$ the corresponding cumulative. Then $\operatorname{GELU}(x)=x\Phi(x)$. At zero, symmetry gives $\Phi(0)=1/2$. The fundamental theorem of calculus gives $\Phi'(x)=p(x)$, so the product rule yields $\operatorname{GELU}'(x)=\Phi(x)+xp(x)$, including slope $1/2$ at zero.

The encoder therefore has $(4096\cdot128+128)+(128\cdot8+8)=525{,}448$ parameters. The predictor has $(20\cdot128+128)+(128\cdot128+128)+(128\cdot8+8)=20{,}232$. Their sum is 545,680. The small model is intentionally simpler than the paper’s transformer so we can inspect the entire learning loop.

<!-- VISUAL: I1 -->

## The residual predictor gives us a baseline

Write the prediction as

$$\pred_{t+1}=\lat_t+r_\psi(\lat_{t-1},\lat_t,\act_{t-1},\act_t).$$

If the residual network outputs zero, this is persistence: predict no change from the current embedding. The residual parameterization makes small learned changes natural. Persistence can look misleadingly good when frames are too close together or the representation changes too little, so we need a baseline measurement.

A useful held-out diagnostic compares prediction error with persistence error in the same latent space. If both are almost zero because the representation collapsed, their ratio is unstable and not a meaningful success signal. Always report spread and inspect physical behavior as well.

## Make the two reductions explicit

For one predicted future per example, the browser prediction loss is coordinate-averaged mean squared error (MSE):

$$\objective{L}_{\mathrm{pred}}=\frac1{Bd}\sum_{b,j}(\predicted{\hat z}_{b,j}-\encoded{z}_{b,\mathrm{next},j})^2.$$

For three encoded positions, define $R=\tfrac13\sum_{t=1}^3\operatorname{SIGReg}(\encoded{Z}_t)$, where each $\encoded{Z}_t$ has shape $B\times d$. The total loss is $\objective{L}=\objective{L}_{\mathrm{pred}}+\lambda R$. The browser uses $\lambda=0.01$, 32 random unit directions, and 17 frequency nodes from 0 to 3 with the [symmetric trapezoid convention](#sigreg-8) derived earlier. The research configuration uses different scale and settings; coefficient values do not transfer independently of reductions.

Why not pool time into one huge batch? A sequence could encode time position rather than observation content. Consider every example at position 1 equal to $-1$, every example at position 2 equal to 0, and every example at position 3 equal to 1. Pooled variance is nonzero, while each time position is completely collapsed across examples. Step-wise regularization rules out that particular pooling shortcut more directly.

Conversely, demanding temporal variance in every short sequence could penalize correct representations of genuinely stationary scenes. Which axis we regularize encodes a substantive preference.

<!-- VISUAL: I2 -->

## Cite the canonical SIGReg trace

The [SIGReg chapter](#sigreg) already computed the finite sum on $\Z=[(-1,0),(1,0)]$, one coordinate direction, and nodes $0,1,2$. The unscaled weighted sum was approximately $0.04648$; multiplying by $B=2$ gave about $0.09296$. Use those numbers. A second toy batch would only invite a contradiction.

The full phase array has shape $B\times M\times K$. Computing it requires work proportional to $BdM+BMK$: first project the embeddings, then evaluate the frequency measurements. Its straightforward storage is proportional to $BMK$, in addition to model activations and other arrays. Averaging examples must happen before squaring the discrepancy.

One more coordinate of the same two-point cloud makes the collapse visible. Along $(0,1)$ both projected samples are $0$, the empirical characteristic function is identically $1$, and the discrepancy at frequency $1$ is $(1-e^{-1/2})^2$. That is the collapsed direction the first projection missed.

<!-- VISUAL: I3 -->

## Read the learner in four stages

The tested files below are the complete listing. Read them in this order.

**Shapes.** A window is three frames and two actions. The encoder emits $B\times3\times8$. The predictor consumes $B\times20$ and emits $B\times8$. SIGReg sees three batches of shape $B\times8$.

**One forward.** Encode the three frames with the shared MLP. Concatenate the first two embeddings and two actions. Add the residual correction to the current embedding. That is $\pred_{t+1}$.

**The two reductions.** Average $Bd$ squared coordinate errors for $\objective{L}_{\mathrm{pred}}$. Average three SIGReg values for $R$. The scalar objective is their sum with coefficient $\lambda$.

**One backward coordinate.** The output residual gradient is $2e/(Bd)$. It contributes positively to the predictor output and negatively to the target embedding. The current embedding receives an extra direct contribution through the residual skip. Context sensitivities are multiplied by the predictor’s weight transpose. Every time position then receives its own SIGReg gradient, scaled by $\lambda/3$. Finally the encoder accumulates contributions from all three uses of its shared parameters.

The following reference uses a tiny tanh encoder and a single residual linear predictor so that every derivative fits on the page. It uses the same finite SIGReg definition as the earlier reference, but it is deliberately not the browser MLP architecture.

<!-- CODE: book/edition2/model_reference.py -->

<!-- CODE: book/edition2/learner_reference.py -->

The reference holds projection directions fixed during a derivative check. Otherwise a finite-difference perturbation would compare two different randomized objectives and the numerical derivative would be contaminated by sampling noise. During actual stochastic training, fresh directions can be sampled as part of each update’s randomness.

## Optimization state is part of the experiment

<!-- CODE: book/edition2/optimizer_reference.py -->

The update modifies each parameter array in place and retains first and second moments between calls. Resetting those moments while keeping weights defines a different resumed run. A seed by itself is also not enough to resume a partially completed stochastic computation: one needs the current random-generator state, data-sampling position, optimizer state, configuration, and weights.

The browser uses an automatic differentiation runtime for the larger network. The manually differentiated reference serves as a transparent check of the mathematical structure. It is not a replacement for testing the runtime’s own shape handling, device behavior, and optimizer implementation.

Global gradient clipping, used in the browser, rescales all gradients together if their combined Euclidean norm exceeds a cap $c$. The scale is $\min(1,c/\|g\|)$ for nonzero $g$, with scale one for zero $g$. Multiplying the whole vector preserves its direction while limiting its norm. Clipping changes the update; it should be documented rather than mistaken for an exact unconstrained optimizer step.

<!-- VISUAL: I5 -->

## Data splitting and matched comparisons

The browser generates 256 training episodes of 64 transitions and 12 separate validation episodes. A window sampler selects valid neighboring observations within one episode. It must never bridge the end of one episode and the start of another: such a fabricated transition teaches the model that arbitrary resets are ordinary dynamics.

A matched prediction-only comparison holds initialization, data, sampled batches, and update budget fixed while setting the regularizer coefficient to zero. This comparison isolates the regularizer’s effect in this architecture. Each run learns its own coordinate scale, so compare spread and physical control alongside its MSE.

The laboratory button **Evaluate held-out images** runs those diagnostics on the reserved episodes. **Train prediction-only baseline** is the matched comparison: the same seed, data, batches, and update count with $\lambda=0$. The action-shuffle and removed-history ratios appear in that evaluation readout. An error increase measures sensitivity on this test.

<!-- VISUAL: I4 -->

## Diagnostics should catch different kinds of failure

A useful training display combines several measurements, each tied to a laboratory control. The live **prediction / persistence** ratio is held-out prediction versus copying the current embedding. **Embedding spread** is the mean coordinate standard deviation on a held-out batch; collapse drives it toward zero. The SIGReg term on the training chart is $R$ from the objective above. **Evaluate held-out images** adds shuffled-action and removed-history ratios. **Run 40 actions** tests the whole loop. The participation ratio below detects concentration into a few dominant directions.

For covariance eigenvalues $\rho_j\geq0$, the participation ratio is

$$r_{\mathrm{eff}}=\frac{(\sum_j\rho_j)^2}{\sum_j\rho_j^2}.$$

If exactly $r$ eigenvalues are equal and positive, the ratio is $(r\rho)^2/(r\rho^2)=r$. Cauchy–Schwarz gives $r_{\mathrm{eff}}\leq r$, where $r$ is the number of positive eigenvalues, and expanding the squared sum shows it is at least 1 for nonzero covariance. At complete zero covariance the ratio is undefined, so an implementation must report collapse or use an explicitly labeled numerical convention.

## Worked challenge: a bug that improves the loss

An implementation computes SIGReg after averaging all embeddings into one batch mean. Training becomes faster and the statistic decreases. Has it found an efficient equivalent?

<details class="derivation"><summary>Inspect the order of operations</summary>

No. The empirical characteristic function averages $e^{i\omega u^\top \encoded{z}_b}$ over examples. The erroneous implementation computes $e^{i\omega u^\top\encoded{\bar{z}}}$. Exponentiation is nonlinear, so these are different quantities. For projected values $+1,-1$, the correct real part is $\cos\omega$, while exponentiating their zero mean gives 1 at every frequency. The latter contains no information about spread.

The same principle explains why averaging independently computed microbatch statistics differs from combining their characteristic-function averages and then squaring. An optimization is valid only if it preserves the mathematical reduction or explicitly changes the objective and its interpretation.

</details>

You are ready to use the laboratory. Make a prediction about each diagnostic, run the matched comparison, and save the measurements before interpreting the controller’s behavior.
