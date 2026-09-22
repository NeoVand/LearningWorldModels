# Build, challenge, explain

<p class="lead">The final test is not whether the terminology sounds familiar. It is whether you can reconstruct the model, predict its failures, and explain the evidence without overstating it.</p>

## The assignment

Build a small action-conditioned visual world model. Use observations and actions for representation learning, reserve physical state labels for evaluation, and train both encoder and predictor. Compare a prediction-only objective with prediction plus SIGReg. Evaluate on held-out episodes, then use the learned predictor inside a goal-image planner.

The laboratory is one complete executable realization of this assignment. The following sequence is a worked solution and an investigation guide. Keep a record of your predictions before running it; a surprising result is more informative when you can say which expectation it contradicted.

## 1 · Specify the information boundary

List every quantity available at each stage: data collection, model training, probe fitting, planning, and final evaluation. Decide whether the planner sees physical state or only camera history and the goal image.

<details class="derivation"><summary>Worked solution · the boundary used here</summary>

The simulator has joint angles and velocities because it must generate motion. Model training receives three camera frames and two action vectors per window. It does not receive those state variables as prediction targets. A separate readout uses state labels to draw imagined poses. Candidate scoring uses only the learned latent rollout, the encoded goal, and declared action costs. After an action executes, simulator state supplies physical error for evaluation.

This separation allows a meaningful claim about learning control from pixels in the teaching setting. If the planner used true joint-angle distance to score every imagined candidate, that would be a different experiment with privileged planning information.

</details>

<!-- VISUAL: K1 -->

## 2 · Derive the objective and its shapes

Write the total objective without leaving “mean” ambiguous. State which samples share an encoder, which branch receives gradients, and which axis defines the distribution regularized by SIGReg.

<details class="derivation"><summary>Worked solution · one window predicts one future</summary>

For the browser MLP, embeddings have shape $B\times3\times8$. Concatenating the first two embeddings and two two-dimensional actions gives $B\times20$ predictor inputs. The output has shape $B\times8$, matching the third embedding. Prediction loss averages $B\cdot8$ squared coordinate errors. SIGReg operates separately on each $B\times8$ time slice and then averages the three results. All shared encoder uses receive gradients.

The directions have shape $8\times32$ and unit-length columns. Multiplying an embedding slice gives $B\times32$ projected samples. Multiplying by 17 frequency values gives $B\times32\times17$ phases. Average cosines and sines across $B$, subtract the Gaussian real target, square and add, integrate frequency with the specified weights, multiply by $B$, then average directions. The coefficient is meaningful only with exactly those reductions.

</details>

## 3 · Prove why prediction alone has a loophole

Construct a parameterized function pair achieving perfect prediction agreement without distinguishing observations. Then explain why a weight penalty alone may not eliminate it.

<details class="derivation"><summary>Worked solution · do not rely on a slogan</summary>

Choose $f(o)=0$ for all inputs and a predictor returning zero. Every target and prediction is zero, so every squared error is zero. Zero weights and biases can realize this in many ordinary architectures, making a small-weight preference compatible with collapse. A distributional penalty must prefer a nonconstant collection of outputs. A positive penalty value at collapse still does not prove that an exactly symmetric collapsed point has a nonzero gradient; that requires the derivative analysis developed earlier.

</details>

## 4 · Check the implementation before training

Check attention's causal mask on a tiny array, compare analytic and finite-difference gradients of the reference learner, and test CEM on the two-action quadratic whose optimum we solved by hand.

<details class="derivation"><summary>Worked solution · what a passing check establishes</summary>

For attention, each row must sum to one over allowed positions, future weights must be zero, and changing a future token must not affect earlier outputs in the standalone causal-attention function. For the learner, hold directions and data fixed, perturb every parameter coordinate in a small configuration, and compare the central difference with the analytic gradient. This catches omitted target gradients and wrong reductions.

For CEM, use the known scalar dynamics only in this numerical unit check. Compare the best sampled action sequence with $a_0=a_1=1/(2+\rho)$. The discrepancy should shrink with adequate sampling, but a finite stochastic search need not hit the exact optimum. This verifies basic planner arithmetic; it does not establish that a learned dynamics model is accurate.

The book's reference checks execute these tests. The packaged browser model additionally has recorded real-training and control checks. These are different levels of verification and are reported separately.

</details>

## 5 · Run a matched learning experiment

Use the same initialization seed, data corpus, batch sequence, and update count for the two objectives. Before running, predict the relative MSE, embedding spread, and physical usefulness of the outcomes.

<details class="derivation"><summary>Worked solution · interpret the reference measurements</summary>

In the recorded seed-17 experiment after 5,000 updates, the regularized model had mean embedding standard deviation about 0.903 and prediction/persistence ratio about 0.116. The matched prediction-only model's spread was approximately $3.84\times10^{-5}$. Its extremely small MSE accompanied near-complete collapse.

That comparison supports the need for the regularizer in this architecture and training setting. It does not show that every possible prediction-only learning procedure collapses, nor that the selected coefficient is optimal. Repeat with declared seeds and retain all outcomes. A different device backend can introduce numerical variation even with the same nominal seed.

</details>

## 6 · Test what the predictor actually uses

Evaluate correct action alignment, shuffled actions, and removed history. Then select the same local goals and control budget for each trained seed. Keep the distant goal as a stress test.

<details class="derivation"><summary>Worked solution · turn failures into diagnoses</summary>

If action shuffling leaves prediction unchanged, investigate whether actions have enough variation, whether indexing is correct, and whether persistence already explains the data. If removing history has little effect, the task may not require it at that frame spacing, or the model may have failed to use it. An error increase under an intervention shows sensitivity in the tested distribution, not accurate behavior under all counterfactual actions.

The recorded three-seed suite reached all nine local goals at least once, but only seven were within tolerance at the final observation. All three distant-goal trials failed. The difference between arrival and final occupancy exposes the hold-control problem. The stress failures expose the limits of coverage, latent geometry, planning, or prediction beyond the local suite; further controlled experiments are needed to separate those causes.

</details>

## 7 · Explain the research model from memory

Without looking at the paper, sketch its training graph and planning graph. Label observations, actions, representations, predictions, and losses. Mark which weights are shared and which quantities change during planning.

<details class="derivation"><summary>Worked solution · the two graphs have different adjustable variables</summary>

The training graph has frame encoder branches with shared parameters, an action-conditioned causal predictor, next-embedding MSE, and step-wise SIGReg. Both target and context encoder paths receive gradients; no EMA teacher or training stop-gradient is used. The paper's image encoder is a ViT and its predictor is a transformer, unlike the smaller MLP laboratory.

The planning graph encodes a current context and goal, rolls proposed action blocks through the fixed learned predictor, computes terminal latent distance, and uses CEM to refine actions. Parameters remain fixed. The optimized prefix executes in the environment, then a new observation supplies context for another plan. The paper's execution cadence must be taken from its appendix/configuration, not assumed to match the browser demonstration.

</details>

## 8 · Write a claim that survives its own evidence

Write three sentences: what you built, what you measured, and what remains unestablished. Include a failure in the second sentence.

<details class="derivation"><summary>A worked scientific conclusion</summary>

We trained a small visual encoder and action-conditioned predictor jointly with prediction MSE and step-wise SIGReg, then used the fixed learned predictor to score candidate controls toward goal images. In a recorded three-seed local diagnostic suite, all nine local goals were reached at least once, seven remained within tolerance at the final observation, and all three distant-goal trials failed. These measurements support local learned-model control in the tested setup, while leaving broad transfer, robust long-horizon planning, calibrated uncertainty, and reproduction of LeWM's published benchmarks unestablished.

Each sentence has a different job. The first specifies the system. The second reports evidence with its scope and failures. The third marks the boundary. This is more informative than calling the model a general physical intelligence or dismissing it because it is small.

</details>

<!-- VISUAL: K2 -->

## Investigations after the capstone

Change one question at a time. Reduce action coverage while keeping the validation protocol fixed. Change frame spacing and ask whether more history helps. Rotate the latent representation and transform the predictor consistently, checking which metrics remain invariant. Compare fixed and freshly sampled SIGReg directions. Add an appearance shift and test whether the encoder preserves pose distinctions. Increase the planning horizon and separate lower imagined cost from better physical outcomes.

For each investigation, first state the expected mechanism. Then specify the controlled variables, measurement, and failure criterion. Record the result even when it contradicts the expectation. A useful research notebook preserves the questions that failed as carefully as those that succeeded.

The larger LeCun program remains open: learn richer abstractions, preserve memory, represent uncertain futures, and plan across time scales. LeWorldModel offers a compact experiment within that program. You now have the mathematical and practical tools to understand that experiment, reproduce its central learning principle at small scale, and ask a more precise next question.
