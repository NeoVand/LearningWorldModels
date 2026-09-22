# A world model you can train

<p class="lead">A small prediction error can mean “I have learned the dynamics.” It can also mean “I have stopped distinguishing anything.” Here you can watch the difference develop.</p>

This laboratory trains a visual encoder and an action-conditioned predictor from random weights. It adapts the numerical core developed for Jaxverse. The camera sees 64 × 64 grayscale pixels. The encoder produces eight coordinates. The model has 545,680 adjustable parameters. No pretrained representation is downloaded.

The physical environment is a simulated two-link mechanism. The simulator supplies camera frames and the outcomes of actions. During model training, its joint angles and velocities are not targets. The learning signals are next-embedding prediction and SIGReg. Labels are used only for explicitly described evaluation and for a separate visualization readout.

## Before you press train

We generate 256 training episodes with 64 transitions each: 16,384 transitions. Twelve separate episodes are reserved for validation. A batch contains 64 windows, each with three images and two actions. Splitting by episode helps prevent neighboring frames from the same trajectory appearing on both sides of the evaluation boundary.

The predictor receives the previous and current embeddings and their aligned actions. It outputs a correction to the current embedding. This **residual** parameterization begins near the persistence baseline: predict that nothing changes. Learning must improve on that baseline on held-out observations.

The browser chooses WebGPU when available and otherwise a supported CPU backend. The first update includes compilation. Actual speed depends on the device. A worker keeps the reading interface responsive. The complete numerical runtime is embedded in this HTML; preparing the laboratory generates data locally.

<div id="world-lab" class="lab">
<h3>Learning from camera images</h3>
<p class="instruction">First inspect the untrained model. Then train, pause after at least 5,000 updates, evaluate, and run the matched prediction-only comparison.</p>
<div class="controls"><label>Seed <input type="number" id="world-seed" value="17" min="1" max="99999"/></label><button class="primary" id="world-init">Reset model</button><label>Updates <select id="world-budget"><option value="0" selected>Until paused</option><option value="500">500</option><option value="2000">2,000</option><option value="5000">5,000</option></select></label><button id="world-train" disabled>Train</button><button id="world-stop" disabled>Pause</button></div>
<div id="world-status" class="state" role="status">Random weights initialize as this laboratory comes into view. Camera images are already live.</div>
<div class="metric-grid"><div class="metric"><strong id="world-step">0</strong><span>updates completed</span></div><div class="metric"><strong id="world-ratio">—</strong><span>prediction / persistence</span></div><div class="metric"><strong id="world-spread">—</strong><span>mean embedding standard deviation</span></div></div>
<canvas id="world-curves" class="wide-chart" width="900" height="450" aria-label="Live prediction loss and regularization contribution on logarithmic axes"></canvas>
<output id="world-evaluation">Evaluation appears after initialization and training.</output>
<div class="controls"><button id="world-evaluate" disabled>Evaluate held-out images</button><button id="world-compare" disabled>Train prediction-only baseline</button><button id="world-export" disabled>Save measurements</button></div>
<div id="world-comparison"><p class="lab-note">The matched comparison starts when requested. It freezes your current update count and trains a separate prediction-only model.</p></div>
<div id="future-choices"><p class="lab-note">Initializing the fixed future-image test with actual random weights…</p></div>
<p class="lab-note">The comparison starts a new model from the same seed with the same data, batch sequence, and update count. It sets the regularizer weight to zero. Your trained regularized model is retained. Raw losses from different latent spaces require a scale diagnostic.</p>
</div>

## Read the evidence, not just the curve

**Prediction / persistence** compares the trained predictor’s squared error with copying the current embedding, evaluated in the same learned representation. A ratio below one means that this predictor improves on that baseline. Pair it with the physical-state and control diagnostics to assess what the representation preserves.

**Embedding spread** is the mean standard deviation of the coordinates on a held-out batch. If prediction error becomes tiny while spread approaches zero, agreement may be explained by collapse. The ratio becomes numerically fragile when both prediction and persistence are almost zero; inspect their raw values too.

**Shuffled actions** replace the action associated with a transition with another batch example’s action. If the prediction error increases, the predictor uses action information on this test. **Removed history** replaces the previous embedding with the current one. If error increases, the extra observation helped. These interventions are diagnostics, not proofs of a universal causal model. The corpus uses temporally correlated exploratory actions.

**Effective rank** here is a covariance participation ratio: squared trace divided by the trace of the squared covariance. If eigenvalues are equal in $r$ nonzero directions, this ratio is $r$; one dominant direction makes it close to one. It is an effective dimension, not a test that the distribution is Gaussian.

Do the prediction-only experiment even if the regularized model looks successful. It demonstrates why the objective contains two terms. Judge prediction loss together with target spread: the encoder can lower the error simply by shrinking its targets.

## Let the learned model choose actions

The planner receives two camera images, the previous action, and a goal image. It samples candidate action sequences, rolls them forward through the learned predictor, and scores their distance from the encoded goal plus an action-effort term. It keeps promising candidates, resamples around them, executes the first action, and observes again. This is the sample–score–refit procedure called the cross-entropy method. The [planning chapter derives the procedure](#planning-4); here you can watch the loop operate.

<figure class="diagram" data-diagram="mpc"></figure>

<div id="control-lab" class="lab">
<h3>Imagine, act, observe again</h3>
<p class="instruction">Prepare a model above. You can try the untrained controller, then repeat after learning. The goal is a camera image; the planner does not receive joint-angle error.</p>
<div class="controls"><label>Goal <select id="world-goal"><option value="0">A · local reach</option><option value="1">B · local turn</option><option value="2">C · local curl</option><option value="3">D · distant stress test</option></select></label><button id="world-control-reset" disabled>Reset mechanism</button><button id="world-control" disabled>Run 40 actions</button></div>
<div class="sensor-pair"><div><canvas id="world-current" width="64" height="64" aria-label="Actual camera image supplied to the model"></canvas><div class="plot-label">Current camera · 64 × 64</div></div><div><canvas id="world-goal-image" width="64" height="64" aria-label="Goal camera image"></canvas><div class="plot-label">Goal camera · 64 × 64</div></div></div>
<svg id="world-control-plot" class="control-instrument" viewBox="0 0 720 360" role="img" aria-label="Actual arm, goal arm, and imagined future poses"></svg>
<output id="world-control-output">Train a model above or inspect the untrained controller first.</output>
<p class="lab-note">Blue: actual physical pose. Amber dashed: goal. Teal translucent: imagined poses drawn by a separately fitted diagnostic readout. The readout uses state labels to draw predictions but never scores candidate actions. Its error contributes to discrepancies in the drawing.</p>
</div>

The displayed physical error uses the simulator’s angles **after** an action to evaluate the outcome. That number never enters the search. This separation matters: a demonstration that secretly uses the simulator to choose torques has not established learned-model control.

The first three goals test local movements from the starting pose. The fourth tests a much more distant target, where the learned controller struggled in the reference evaluation below. The mechanism may miss a goal, arrive and drift away, or fail on a different seed. Long imagined rollouts accumulate errors. Replanning helps by anchoring each new search in a fresh observation, but it does not turn an inaccurate model into a reliable physical simulator. Compare runs under the same goal and budget, and retain the failures in your conclusions.

<div class="lab" id="forecast-lab"><h3>One checkpoint, three commands</h3><p>Freeze the model and the same two-frame context. Compare push, reverse and release. The actual paths come from the simulator; learned paths use a separate pose readout fitted with labels for drawing only.</p><button id="world-forecast" disabled>Compare the three futures</button><div id="world-forecasts"><p>The physical starting pose and available commands are shown below. Prepare the nearby laboratory to measure learned forecasts.</p></div></div>

## What the implementation actually optimizes

For three sequence positions, batch size $B$, and embedding dimension $d$, the embeddings have shape $[3,B,d]$. The prediction term averages squared error across examples and coordinates. The regularizer computes a batch-size-scaled projected discrepancy independently at each time position, then averages across those positions:

$$\begin{aligned}\loss&=\frac{1}{Bd}\sum_{b=1}^B\sum_{j=1}^d(\pred_{b,j}-\lat_{b,\mathrm{next},j})^2\\&\quad+\lambda\frac{1}{3}\sum_{t=1}^3\reg(\Z_t),\\&\quad \lambda=0.01.\end{aligned}$$

The coefficient is specific to these reductions and this small experiment. Multiplying one term by the batch size or feature count would change the tradeoff. The target embeddings receive gradients as well as the predicted embeddings.

The encoder is a 4,096 → 128 → 8 multilayer perceptron. The predictor is a 20 → 128 → 128 → 8 multilayer perceptron with a residual output. The 20 inputs are two eight-coordinate embeddings and two two-coordinate actions: $8+8+2+2=20$. GELU activations supply nonlinearity; a stack of affine maps without nonlinearities would still be one affine map.

Adam uses a learning rate of 0.001, moment coefficients 0.9 and 0.99, and a global gradient-norm cap of 5. These settings specify the experiment. Keeping them visible makes a comparison reproducible and shows which choices are held fixed.

## Three investigations with worked interpretations

<details><summary>1 · Prediction-only obtains a lower loss. Has it won?</summary>

Not necessarily. If both its target and predicted embeddings shrink toward a constant, their distance shrinks even when the representation contains less information. Compare embedding spread, future discrimination, and actual control. Prediction error is expressed in a coordinate system that the encoder itself learns.

</details>

<details><summary>2 · The action-shuffling ratio is above one. What have we established?</summary>

On this held-out batch, the predictor performs better with the supplied action alignment than with the chosen shuffle. This supports action sensitivity in the tested distribution. To examine actions absent from the exploration corpus, change exploration coverage and test deliberately chosen interventions.

</details>

<details><summary>3 · The arm briefly reaches the target, then leaves. What should success mean?</summary>

Declare the evaluation before comparing models. “Ever within a tolerance,” “within tolerance for five consecutive observations,” and “within tolerance for the final five observations” measure different behaviors. Report the trajectory, not only its smallest error. The present demonstration displays the error after every action and exports the measurements so these definitions can be evaluated explicitly.

</details>

## Research correspondence

A 64 × 64 reference evaluation used seeds 17, 41, and 73, each with 5,000 updates, the same three local goals, and one distant stress goal. Here are the measurements from this machine’s WebGPU backend, not promises about a new run:

| Seed | Prediction / persistence | Embedding spread | Local goals reached at least once | Local goals within tolerance at final observation |
|---|---:|---:|---:|---:|
| 17 | 0.100 | 0.933 | 2 / 3 | 0 / 3 |
| 41 | 0.094 | 0.947 | 3 / 3 | 2 / 3 |
| 73 | 0.139 | 0.837 | 3 / 3 | 1 / 3 |

Tolerance was a circular joint RMS error of 0.15 radians over 40 executed actions. All three distant-goal trials failed that criterion. Eight of nine local trials reached tolerance at least once, but only three finished within tolerance. The trajectories show why a good one-step prediction score does not guarantee stable control. Nine local trials and three stress trials are a diagnostic suite, not a population success-rate estimate. The raw trajectories and configuration are retained with the book’s verification record. The first seed’s matched prediction-only model reached mean embedding standard deviation approximately $2.68\times10^{-5}$, compared with $0.933$ for the regularized model; its smaller prediction loss came with near-complete collapse.

This is a small educational model with the same prediction-plus-SIGReg structure. It is not a reproduction of LeWorldModel’s architecture, scale, or benchmark results. The paper uses a vision-transformer encoder and an action-conditioned transformer predictor. The transformer chapter explains those components, and the guided paper chapter maps their exact research configuration to the published method.

The laboratory runs locally in a worker so you can keep reading while it trains. Its source and experimental records are retained alongside the book. Use its successes and failures to form specific questions about the larger research model.

<!-- VISUAL: L6 -->
