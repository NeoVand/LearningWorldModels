# Build, challenge, explain

<p class="lead">The final test is not whether the terminology sounds familiar. It is whether you can reconstruct the model, predict its failures, and explain the evidence without overstating it.</p>

## The assignment

Part A is the browser experiment. Part B is a LeWorldModel v1 reconstruction with no worked answers on this page. Keep a record of your predictions before running anything.

## Part A · the browser experiment

Build a small action-conditioned visual world model. Use observations and actions for representation learning, reserve physical state labels for evaluation, and train both encoder and predictor. Compare a prediction-only objective with prediction plus SIGReg. Evaluate on held-out episodes, then use the learned predictor inside a goal-image planner.

The [implementation chapter](#implementation) already stated the information boundary, the shapes $B\times3\times8$, and the two reductions. Confirm that preflight, then do the four steps below. Print keeps the worked answers; attempt each step before opening them.

### A1 · Prove why prediction alone has a loophole

Construct a parameterized function pair achieving perfect prediction agreement without distinguishing observations. Then explain why a weight penalty alone may not eliminate it.

<details class="derivation"><summary>Worked solution · do not rely on a slogan</summary>

Choose $f(\observed{o})=0$ for all inputs and a predictor returning zero. Every target and prediction is zero, so every squared error is zero. Zero weights and biases can realize this in many ordinary architectures, making a small-weight preference compatible with collapse. A distributional penalty must prefer a nonconstant collection of outputs. A positive penalty value at collapse still does not prove that an exactly symmetric collapsed point has a nonzero gradient; that requires the derivative analysis developed earlier.

</details>

<!-- VISUAL: K1 -->

### A2 · Run a matched learning experiment

Use the same initialization seed, data corpus, batch sequence, and update count for the two objectives. Before running, predict the relative MSE, embedding spread, and physical usefulness of the outcomes.

<details class="derivation"><summary>Worked solution · interpret the reference measurements</summary>

In the recorded seed-17 experiment after 5,000 updates, the regularized model had mean embedding standard deviation about 0.903 and prediction/persistence ratio about 0.116. The matched prediction-only model’s spread was approximately $3.84\times10^{-5}$. Its extremely small MSE accompanied near-complete collapse.

That comparison supports the regularizer in this architecture and training setting. Repeat with declared seeds and retain all outcomes.

</details>

### A3 · Test what the predictor actually uses

Evaluate correct action alignment, shuffled actions, and removed history. Then select the same local goals and control budget for each trained seed. Keep the distant goal as a stress test.

<details class="derivation"><summary>Worked solution · turn failures into diagnoses</summary>

If action shuffling leaves prediction unchanged, investigate whether actions have enough variation, whether indexing is correct, and whether persistence already explains the data. If removing history has little effect, the task may not require it at that frame spacing, or the model may have failed to use it.

The recorded three-seed suite reached all nine local goals at least once, but only seven were within tolerance at the final observation. All three distant-goal trials failed. The difference between arrival and final occupancy exposes the hold-control problem.

</details>

### A4 · Write a three-sentence claim for the browser run

Write what you built, what you measured, and what remains unestablished. Include a failure in the second sentence.

<details class="derivation"><summary>A worked scientific conclusion</summary>

We trained a small visual encoder and action-conditioned predictor jointly with prediction MSE and step-wise SIGReg, then used the fixed learned predictor to score candidate controls toward goal images. In a recorded three-seed local diagnostic suite, all nine local goals were reached at least once, seven remained within tolerance at the final observation, and all three distant-goal trials failed. These measurements support local learned-model control in the tested setup, while leaving broad transfer, robust long-horizon planning, calibrated uncertainty, and reproduction of LeWM’s published benchmarks unestablished.

</details>

## Part B · reconstruct LeWorldModel v1

No solutions follow. Draw from memory.

### B1 · Two graphs

Sketch the training graph and the planning graph. Label observations, actions, representations, predictions, and losses. Mark which weights are shared and which quantities change during planning. Include the ViT encoder, the three-frame context, action blocks, and step-wise SIGReg.

### B2 · One axis table

Compare the browser MLP with LeWM v1 on one page: image size, latent width, context, $\lambda$, SIGReg directions and nodes, planner candidates, execution prefix. Use the paper chapter’s configuration table, not a guess.

### B3 · Equation 3 and one mismatch

Write Equation 3’s reductions. Explain why $\lambda=0.09$ is not portable without an axis check, using the batch-size factor or the quadrature interval.

### B4 · Two three-sentence claims

Write the three-sentence claim twice: once for the browser run, once for the paper’s published tables. The first sentence specifies the system. The second reports evidence with its scope and a failure. The third marks the boundary.

<!-- VISUAL: K2 -->

## Investigations after the capstone

Change one question at a time. Reduce action coverage while keeping the validation protocol fixed (Appendix E’s collection policies). Change frame spacing and ask whether more history helps. Rotate the latent representation and transform the predictor consistently, checking which metrics remain invariant (Appendix H). Compare fixed and freshly sampled SIGReg directions (Appendix A). Add an appearance shift and test whether the encoder preserves pose distinctions (Appendix F). Increase the planning horizon and separate lower imagined cost from better physical outcomes (Appendix D).

For each investigation, first state the expected mechanism. Then specify the controlled variables, measurement, and failure criterion. Record the result even when it contradicts the expectation.

The larger LeCun program remains open: learn richer abstractions, preserve memory, represent uncertain futures, and plan across time scales. LeWorldModel offers a compact experiment within that program. You now have the tools to reconstruct that experiment at small scale and to read v1 as an argument.
