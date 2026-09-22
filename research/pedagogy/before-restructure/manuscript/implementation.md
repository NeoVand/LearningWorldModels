# From equations to a learner

<p class="lead">The objective becomes a working model only when every array has a meaning, every action lines up with its transition, and every average uses the intended axis.</p>

## Define the experiment before writing the loss

Our browser experiment learns from a two-link mechanism observed through a $32\times32$ grayscale camera. At each step the simulator updates joint motion under a two-coordinate action and renders an image. The encoder receives the 1,024 pixel values, not the simulator's joint angles. The predictor receives embeddings and actions, not a privileged physical state.

The simulator is necessary to generate consequences. It must not be confused with the learned world model. During planning, candidate futures are evaluated by the learned predictor. The real simulator is stepped only to execute the selected action and measure what actually happens. A hidden call to the simulator inside candidate scoring would answer a much easier question.

A training example contains three consecutive selected observations and two aligned actions. Call them $(o_{t-1},o_t,o_{t+1},a_{t-1},a_t)$. The first action explains the transition into the current observation; the second explains the transition whose target is the final observation. This explicit naming prevents the common mistake of pairing the future frame with the wrong action.

## Follow one window through its shapes

| Quantity | Shape | Meaning |
|---|---|---|
| Camera windows | $B\times3\times1024$ | Three flattened grayscale frames per example |
| Action windows | $B\times2\times2$ | Two transitions, each with two action coordinates |
| Encoded windows | $B\times3\times8$ | Eight learned coordinates per frame |
| Predictor input | $B\times20$ | Two embeddings plus two actions |
| Predicted future | $B\times8$ | Prediction for the third frame's embedding |
| SIGReg input | $3\times B\times8$ | Time first; each time position has a batch distribution |

The predictor's input width is $8+8+2+2=20$. The action values are normalized controls in $[-1,1]$; the simulator maps these to its chosen physical torque scale. Units and normalization belong in a reproducible configuration.

The encoder is an MLP with widths 1,024 → 128 → 8. The predictor is an MLP with widths 20 → 128 → 128 → 8 and a residual output. GELU supplies the nonlinearities. For a dense layer from width $m$ to width $n$, there are $mn$ weights and $n$ biases because each output uses one weight per input and one offset.

The encoder therefore has $(1024\cdot128+128)+(128\cdot8+8)=132232$ parameters. The predictor has $(20\cdot128+128)+(128\cdot128+128)+(128\cdot8+8)=20232$. Their sum is 152,464. The small model is intentionally simpler than the paper's transformer so we can inspect the entire learning loop.

## The residual predictor gives us a baseline

Write the prediction as

$$\pred_{t+1}=\lat_t+r_\psi(\lat_{t-1},\lat_t,\act_{t-1},\act_t).$$

If the residual network outputs zero, this is persistence: predict no change from the current embedding. The residual parameterization makes small learned changes natural. It does not mean the true dynamics are small, and it can encourage a misleadingly good baseline when frames are too close together or the representation changes too little.

A useful held-out diagnostic compares prediction error with persistence error in the same latent space. If both are almost zero because the representation collapsed, their ratio is unstable and not a meaningful success signal. Always report spread and inspect physical behavior as well.

## Make the two reductions explicit

For one predicted future per example, the browser prediction loss is coordinate-averaged MSE:

$$L_{\mathrm{pred}}=\frac1{Bd}\sum_{b,j}(\hat z_{b,j}-z_{b,\mathrm{next},j})^2.$$

For three encoded positions, define $R=\tfrac13\sum_{r=1}^3\operatorname{SIGReg}(Z_r)$, where each $Z_r$ has shape $B\times d$. The total loss is $L=L_{\mathrm{pred}}+\lambda R$. The browser uses $\lambda=0.01$, 32 random unit directions, and 17 frequency nodes from 0 to 3 with the symmetric trapezoid convention derived earlier. The research configuration uses different scale and settings; coefficient values do not transfer independently of reductions.

Why not pool time into one huge batch? A sequence could encode time position rather than observation content. Consider every example at position 1 equal to $-1$, every example at position 2 equal to 0, and every example at position 3 equal to 1. Pooled variance is nonzero, while each time position is completely collapsed across examples. Step-wise regularization rules out that particular pooling shortcut more directly.

Conversely, demanding temporal variance in every short sequence could penalize correct representations of genuinely stationary scenes. Which axis we regularize encodes a substantive preference.

## Trace SIGReg with a tiny concrete array

Take $B=2,d=2,M=2$ and embeddings $Z=\begin{pmatrix}1&0\\-1&0\end{pmatrix}$. Choose the two coordinate directions as columns of $U=I$. Then $H=ZU=Z$. Along the first direction, projected values are $1,-1$; along the second they are $0,0$.

At frequency $\omega=1$, the first empirical characteristic function has real part $\cos1$ and imaginary part zero, because opposite sines cancel. The second has real part 1 and imaginary part zero. The Gaussian target is $q=e^{-1/2}$. Their discrepancies are $(\cos1-q)^2$ and $(1-q)^2$. The second direction exposes the collapsed coordinate much more strongly at this frequency.

At zero frequency every empirical characteristic function and target equals 1, so that node contributes exactly zero. At other frequencies the differences change. Integrating several frequencies and sampling more directions makes a richer measurement than inspecting this one pair of coordinates. Averaging examples must happen before squaring the discrepancy; otherwise we would penalize individual phasors instead of their distributional average.

The full phase array has shape $B\times M\times K$. Computing it requires work proportional to $BdM+BMK$: first project the embeddings, then evaluate the frequency measurements. Its straightforward storage is proportional to $BMK$, in addition to model activations and other arrays. Chunking directions can reduce peak memory if the reductions and gradients remain equivalent.

## A complete inspectable reference learner

The following reference uses a tiny tanh encoder and a single residual linear predictor so that every derivative fits on the page. It uses the same finite SIGReg definition as the earlier reference, but it is deliberately not the browser MLP architecture. Its purpose is to expose the full chain rule, including the learnable target branch.

<!-- CODE: book/edition2/model_reference.py -->

The forward pass above records the encoded window, concatenated context, and residual prediction. The backward pass below differentiates the scalar objective through those exact intermediates. Its imports refer to the reference modules printed in this book.

<!-- CODE: book/edition2/learner_reference.py -->

The output residual gradient is $2e/(Bd)$. It contributes positively to the predictor output and negatively to the target embedding. The current embedding receives an extra direct contribution through the residual skip. Context sensitivities are multiplied by the predictor's weight transpose. Every time position then receives its own SIGReg gradient, scaled by $\lambda/3$. Finally the encoder accumulates contributions from all three uses of its shared parameters.

The reference holds projection directions fixed during a derivative check. Otherwise a finite-difference perturbation would compare two different randomized objectives and the numerical derivative would be contaminated by sampling noise. During actual stochastic training, fresh directions can be sampled as part of each update's randomness.

## Optimization state is part of the experiment

<!-- CODE: book/edition2/optimizer_reference.py -->

The update modifies each parameter array in place and retains first and second moments between calls. Resetting those moments while keeping weights defines a different resumed run. A seed by itself is also not enough to resume a partially completed stochastic computation: one needs the current random-generator state, data-sampling position, optimizer state, configuration, and weights.

The browser uses an automatic differentiation runtime for the larger network. The manually differentiated reference serves as a transparent check of the mathematical structure. It is not a replacement for testing the runtime's own shape handling, device behavior, and optimizer implementation.

Global gradient clipping, used in the browser, rescales all gradients together if their combined Euclidean norm exceeds a cap $c$. The scale is $\min(1,c/\|g\|)$ for nonzero $g$, with scale one for zero $g$. Multiplying the whole vector preserves its direction while limiting its norm. Clipping changes the update; it should be documented rather than mistaken for an exact unconstrained optimizer step.

## Data splitting and matched comparisons

The browser generates 256 training episodes of 64 transitions and 12 separate validation episodes. A window sampler selects valid neighboring observations within one episode. It must never bridge the end of one episode and the start of another: such a fabricated transition teaches the model that arbitrary resets are ordinary dynamics.

A matched prediction-only comparison holds initialization, data, sampled batches, and update budget fixed while setting the regularizer coefficient to zero. This isolates one chosen change. It does not prove that every prediction-only architecture must fail, and it does not make raw MSE values across the resulting latent spaces directly comparable. The spread and control diagnostics provide the missing context.

The held-out action shuffle asks whether correctly aligned actions improve prediction. Replacing the earlier frame with the current frame asks whether the selected history supplies useful information. These interventions are performed at evaluation, so they can also produce unfamiliar inputs. Interpret an error increase as sensitivity on this test, not automatically as a complete causal identification result.

## Diagnostics should catch different kinds of failure

A useful training display combines several measurements. Prediction loss describes agreement. SIGReg describes the chosen finite distributional discrepancy. Coordinate spread detects shrinking representations. A covariance participation ratio detects concentration into a few dominant directions. Held-out prediction versus persistence tests a specific dynamics baseline. Actual physical control tests the whole loop.

For covariance eigenvalues $\lambda_j\geq0$, the participation ratio is

$$r_{\mathrm{eff}}=\frac{(\sum_j\lambda_j)^2}{\sum_j\lambda_j^2}.$$

If exactly $r$ eigenvalues are equal and positive, the ratio is $(r\lambda)^2/(r\lambda^2)=r$. Cauchy–Schwarz gives $r_{\mathrm{eff}}\leq r$, where $r$ is the number of positive eigenvalues, and expanding the squared sum shows it is at least 1 for nonzero covariance. At complete zero covariance the ratio is undefined, so an implementation must report collapse or use an explicitly labeled numerical convention.

## Worked challenge: a bug that improves the loss

An implementation computes SIGReg after averaging all embeddings into one batch mean. Training becomes faster and the statistic decreases. Has it found an efficient equivalent?

<details class="derivation"><summary>Inspect the order of operations</summary>

No. The empirical characteristic function averages $e^{i\omega u^\top z_b}$ over examples. The erroneous implementation computes $e^{i\omega u^\top\bar z}$. Exponentiation is nonlinear, so these are different quantities. For projected values $+1,-1$, the correct real part is $\cos\omega$, while exponentiating their zero mean gives 1 at every frequency. The latter contains no information about spread.

The same principle explains why averaging independently computed microbatch statistics differs from combining their characteristic-function averages and then squaring. An optimization is valid only if it preserves the mathematical reduction or explicitly changes the objective and its interpretation.

</details>

You are ready to use the laboratory. Make a prediction about each diagnostic, run the matched comparison, and save the measurements before interpreting the controller's behavior.
