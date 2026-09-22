# The papers as a conversation

<p class="lead">Each paper becomes easier to read when we know which obstacle it tries to remove. The lineage is a set of related design decisions, not a ladder on which every newer method dominates every older one.</p>

## A reading method for research papers

For each paper, ask five questions. What data enters the learner? What is withheld or predicted? Which parameters receive gradients? What prevents trivial agreement? How is usefulness measured? Write the answers before interpreting an accuracy table.

The word “world model” covers several settings. A representation model can predict missing video features without accepting actions. An action-conditioned model can evaluate candidate controls. A generative model can render future observations. A policy learned using an imagined simulator may no longer need that simulator at execution time. Our endpoint instead keeps the learned model inside an online planner.

The following papers are primary sources. They are linked at fixed versions so changes in later revisions do not silently change the argument.

## I-JEPA: predict a missing region in representation space

[I-JEPA, 2301.08243v1](https://arxiv.org/pdf/2301.08243v1), asks whether a visible context in an image can predict representations of hidden target regions. The target encoder processes image information to provide targets; the online context encoder sees the permitted context. A predictor also receives information identifying which target positions to predict.

This last detail matters. Without location information, “predict a missing feature” is ambiguous: the left corner and the center may contain different things. Position identifies the question; the context helps answer it. Masking must prevent the context encoder from directly reading the target pixels. Large target blocks discourage a solution based only on tiny local texture continuations and encourage use of broader scene relationships.

The target encoder is updated by an exponential moving average, and the target branch is detached from gradient computation. Thus I-JEPA belongs to the teacher-based family developed in the JEPA chapter. It is not the same symmetric end-to-end objective as LeWM.

Its evaluations include representation tasks such as classification and spatial understanding. These ask whether useful information is accessible from learned features. They do not directly test motor action selection. A model can be an important step toward predictive representation learning without already being an action-conditioned world model.

**Reading exercise.** If the context were the entire image including every target pixel, why might the task become less useful? The encoder and predictor could exploit information that will be unavailable in the intended missing-content problem. A low loss would then answer an easier question than the one we wanted to pose.

## V-JEPA: time becomes part of the missing information

[V-JEPA, 2404.08471v1](https://arxiv.org/pdf/2404.08471v1), extends feature prediction to video. It masks parts of a spatiotemporal signal and predicts target features. The context now includes relationships across frames as well as within a frame. Motion-sensitive tasks can reveal whether the representation learned temporal structure beyond static appearance.

The input is passive video, not a sequence of motor commands for our particular robot. A video learner can infer patterns of movement while remaining unable to answer, “What will happen if I apply torque $a$?” That question requires some bridge between actions and visual changes.

The paper uses a teacher-style target mechanism and evaluates frozen representations on downstream tasks. **Frozen evaluation** means the pretrained backbone is held fixed while a smaller readout is fitted. This isolates information accessible from the representation under that readout's capacity. Fine-tuning the entire model answers a different question because the representation can change using the downstream labels.

A key lesson is that predicting features can produce useful motion and appearance information without reconstructing pixels. It is evidence for that training route on the tested data and tasks, not a proof that pixel prediction is universally unnecessary.

## V-JEPA 2: large-scale video learning meets robot actions

[V-JEPA 2, 2506.09985v1](https://arxiv.org/pdf/2506.09985v1), separates broad action-free visual pretraining from action-conditioned post-training. The first stage develops visual representations from large video collections. The action-conditioned stage uses robot interaction data to learn how actions change those representations, enabling goal-directed planning.

This separation answers two practical needs. Natural video contains extensive information about objects and motion, but often lacks the action labels a robot predictor needs. Robot datasets contain the relevant actions but are more expensive to collect and narrower in visual coverage. Combining the two can reuse a broad visual prior while learning a specific action interface.

The associated planning results should therefore be read with the pretraining investment visible. “No task-specific reward” does not mean no prior data. “Zero-shot” transfer to an evaluated robot setting does not mean the system has never seen related visual or robot data. Always ask what was held out and from which stage.

LeWM explores a different tradeoff: jointly learn the encoder and predictor directly on environment-specific offline trajectories with a compact model. This can reduce dependence on a large frozen visual foundation model, but it also loses the benefit of that model's broad pretraining. These are different resource and transfer choices.

## DINO-WM: start from a visual representation that already works

[DINO-WM, 2411.04983v1](https://arxiv.org/pdf/2411.04983v1), learns dynamics over frozen DINOv2 visual features. DINOv2 supplies patch-level representations from image pretraining. Freezing the encoder removes the trainable-encoder collapse route while preserving a rich spatial description.

The predictor learns how those features evolve under action, and a planner compares imagined features with a goal's features. The goal is supplied at test time; the model need not be retrained for each goal. This illustrates why latent dynamics and planning can be useful even without training the visual representation from scratch.

The representation's granularity affects computational cost. Predicting many patch tokens retains local spatial information but increases the work of repeated candidate rollouts. Compressing a frame into one vector can be cheaper but may discard fine spatial details. Neither choice wins by definition. The quality–compute tradeoff depends on the task and architecture.

LeWM's comparisons distinguish DINO-WM with additional proprioceptive inputs from a pixels-only comparison. **Proprioception** means measurements of the agent's own body, such as joint angles. Such measurements are valuable inputs, but including them changes the information available to the model. Compare like with like before attributing a gain solely to an objective.

## PLDM: jointly learn perception and dynamics

[PLDM, 2502.14819v1](https://arxiv.org/pdf/2502.14819v1), develops planning with learned latent dynamics and is the close end-to-end comparison in the LeWM paper. The important contrast is that perception can adapt to the dynamics task rather than remain fixed from unrelated pretraining.

LeWM's baseline implementation uses prediction plus several VICReg-inspired constraints across examples and time, with an inverse-dynamics term available in the formulation. An inverse-dynamics model tries to infer the action from consecutive state representations. If two transitions require different actions, accurate inverse prediction can pressure the representation to retain the distinction. It can also introduce another loss coefficient and another modeling assumption.

Batch variance asks whether different trajectories at the same relative time remain distinguishable. Temporal variance asks whether one trajectory changes over its window. These are not the same requirement. For a stationary arm, low temporal variance can be correct even while different stationary poses should have substantial variance across the batch.

The LeWM appendix describes seven terms and six relative coefficients for its PLDM baseline, and notes differences between the original exposition and code-based temporal terms. Accordingly, do not project every detail of that baseline formulation backward onto every version of PLDM. The version, configuration, and implementation are part of the comparison.

## LeJEPA: make the geometry explicit

[LeJEPA, 2511.08544v1](https://arxiv.org/pdf/2511.08544v1), motivates isotropic Gaussian embeddings through downstream-probe analysis and introduces SIGReg as an efficient way to encourage that distribution. Its representation-learning setting is not identical to action-conditioned temporal prediction. LeWM transfers the regularization idea into a world-model objective.

Two contributions must be read separately. One is a theoretical argument about representation geometry under specific probe and smoothness assumptions. The other is an implementable discrepancy based on random projections and characteristic functions. We will derive the discrepancy fully, then develop the probe argument and inspect its limitations. The existence of a useful objective does not turn every broad theoretical slogan into an unconditional theorem.

The word **sketched** refers to a randomized reduced measurement: instead of testing every direction in a high-dimensional space, sample a manageable collection. A sketch saves computation while introducing sampling error. Repeatedly refreshing directions reduces the chance that the encoder can satisfy one fixed small set while exploiting blind directions indefinitely, but finite training still does not examine every direction exactly.

## LeWorldModel: put the pieces into one compact learner

[LeWorldModel, 2603.19312v1](https://arxiv.org/pdf/2603.19312v1), combines action-conditioned next-embedding prediction with step-wise SIGReg. Both encoder and predictor receive gradients. There is no frozen pretrained encoder, moving-average teacher, or detached target branch in this training recipe.

The model uses a vision transformer to turn a frame into a compact representation, a temporally causal predictor conditioned on actions, and a sampling-based planner. Its experiments examine goal-directed control, physical-variable probes, perturbation responses, computational cost, and training ablations.

The important simplification is in the loss and training dependencies. The system still has a resolution, context length, latent dimension, learning rate, architecture, data distribution, planning horizon, and solver settings. “One effective hyperparameter” refers to the authors' reported practical loss-tuning story, not the literal number of choices in the whole system.

## Compare the contracts, not just the names

| Method | Prediction target | Encoder during main dynamics or representation training | Where action enters |
|---|---|---|---|
| I-JEPA | Hidden image-region features | Online encoder plus EMA target | No motor action in the image task |
| V-JEPA | Hidden video features | Online encoder plus EMA target | Passive video representation learning |
| V-JEPA 2 | Video features; then action-conditioned features | Separate pretraining and action-conditioned stages | Robot post-training and planning |
| DINO-WM | Future frozen patch features | Frozen pretrained visual encoder | Dynamics predictor |
| PLDM | Future learned latent state | Jointly trained, with several constraints | Dynamics predictor and optional auxiliary formulation |
| LeJEPA | Related-view representations | Regularized joint representation learning | Not the LeWM motor-action task |
| LeWM | Future learned frame embedding | Jointly trained with prediction plus SIGReg | Causal predictor through adaptive normalization |

This table intentionally compares contracts rather than compressing each paper into “better” or “worse.” There are many architectural details within each row. The linked primary papers are the record for those details.

## A worked paper-reading exercise

Suppose paper A reports better control with a frozen large encoder, while paper B reports faster planning with a compact jointly learned encoder. What information would make the comparison meaningful?

<details class="derivation"><summary>Build the comparison before interpreting it</summary>

Record pretraining data and compute, downstream trajectory data, available sensor modalities, goal distribution, success definition, action budget, horizon, solver iterations, candidate count, hardware, and whether timing includes observation encoding. Then compare both unconstrained quality and quality under a fixed relevant resource budget.

A faster model may permit more candidates under a fixed wall-clock budget. A richer representation may be more accurate per rollout but allow fewer rollouts. A fixed-FLOP comparison and a fixed-latency comparison are related but not identical because hardware utilization and overhead differ. Report which comparison was actually made.

Finally inspect failure cases. A visual prior that helps on a complex manipulation scene may provide little benefit in a simple room. A compact Gaussian-regularized embedding may work well on one environment and distort another. Such variation is information about the design, not an inconvenience to hide.

</details>

We can now read the target paper without treating its ingredients as unexplained names. The next chapter follows its equations and experiments, using the comparisons we have just established.
