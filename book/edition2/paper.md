# Read LeWorldModel closely

<p class="lead">We can now read the destination paper as a connected argument: a learnable representation, a prediction objective, a distributional constraint, and an action search built on top.</p>

This chapter follows [LeWorldModel: Stable End-to-End Joint-Embedding Predictive Architecture from Pixels, arXiv:2603.19312v1](https://arxiv.org/pdf/2603.19312v1), dated March 13, 2026. Equations and figure numbers below refer to that PDF. The HTML rendering and later versions can differ. The implementation comparison uses the authors' repository at commit `8edfeb336732b5f3ce7b8b210d0ba370a09e2cac`; it is a pinned code reference, not an assertion that every default exactly reproduces the v1 experiments.

## Abstract and introduction: identify the actual claim

The paper proposes jointly learning an encoder and predictor from pixels with two loss terms: next-embedding prediction and SIGReg. The intended simplification is to avoid a frozen pretrained encoder, stop-gradient target, moving-average teacher, and a collection of separately balanced representation penalties.

Its main empirical claims concern stable training in the reported experiments, competitive control, lower planning cost than a foundation-feature baseline, and physical information accessible in the learned representation. These claims should be separated. A compact architecture helps speed; the regularizer addresses representation geometry; an empirical control comparison assesses the whole combination.

The comparison figure in the introduction compresses several research families into short labels. Treat those as the authors' framing, not exhaustive definitions of every generative model or reinforcement-learning method. Rewards, reconstruction, pretrained features, and state inputs can be combined in many ways. The precise baseline configuration matters more than a category slogan.

## Section 3.1: what is actually observed?

The training dataset contains trajectories of images and actions, collected before model training. “Offline” means this stage learns from a fixed corpus rather than choosing new actions online to improve its data. “Reward-free” means the representation and dynamics objective does not need task reward labels. The action sequence is still supplied.

A behavior policy generated those trajectories. It can be exploratory or directed toward tasks. Its coverage determines what transitions the learner can observe. Offline prediction cannot validate actions and states absent from that coverage merely by minimizing its empirical objective.

Appendix D describes frame skip five, grouping five consecutive actions into one action block between selected observations. With four selected frames, the model obtains several shifted prediction targets from a short window. The code's context length three and one-step offset pair the first three frame embeddings with the next three. This teacher-forced sequence convention differs from the browser MLP, which uses two context frames to predict one final frame per window.

## The encoder: one frame becomes one compact vector

The reported default visual encoder is ViT-Tiny with patch size 14, 12 layers, three attention heads, and token width 192. At $224\times224$ resolution, 256 image-patch tokens plus a CLS token pass through the image transformer. The CLS output is projected into the representation used for prediction and regularization.

<figure class="diagram" data-diagram="paper-architecture"></figure>

The projector matters because the encoder's final Layer Normalization imposes per-token geometric constraints. The transformer chapter showed why a normalized fixed-radius description is incompatible with an exact full-dimensional standard Gaussian target. In the pinned code, the projector is linear → Batch Normalization → GELU → linear, with hidden width 2,048 and output width set by the embedding dimension. The paper's brief “1-layer MLP” phrasing should not be substituted for this concrete module sequence when implementing the pinned configuration.

The predictor also has a projector of this form. Its temporal transformer has six layers, 16 attention heads, and dropout 0.1 in the paper's stated default. The pinned configuration uses head dimension 64 even though the model's input/output width is 192: learned projections can expand to $16\cdot64=1024$ attention channels internally, then project back. One must not infer head width by dividing 192 by 16 without reading the code.

Actions pass through an action embedder and condition transformer blocks with AdaLN-zero. A causal mask controls which temporal embeddings each prediction can attend to. The same model is used autoregressively during planning. Batch Normalization pools the flattened batch-and-time examples during training in the pinned implementation, so strict temporal information-flow statements need to distinguish the attention mask from training-time normalization statistics. At evaluation, running statistics are used under the conventional evaluation mode.

<!-- VISUAL: W1 -->

## Equation 1: the compact prediction notation

The paper writes $L_{\mathrm{pred}}=\|\pred_{t+1}-\lat_{t+1}\|_2^2$. It is a definition of a chosen prediction objective, not a theorem. The hat marks a prediction, and the target is produced by the same trainable encoder used for context observations.

The short formula suppresses the history window, batch average, temporal average, and feature reduction. The pinned training code computes the mean of squared coordinate errors between predicted and shifted target tensors. With $B$ examples, $N$ predicted positions, and $d$ coordinates, the explicit reduction is the $1/(BNd)$ formula from the JEPA chapter.

This difference between a squared norm and coordinate-averaged MSE changes numerical scale by a factor of $d$. It does not change the set of minimizers of that term alone, but it changes its relative weight against SIGReg unless the coefficient is adjusted. Always interpret a reported coefficient together with the executable reduction.

There is no target detachment in this training path. Gradients flow through the predictor, context encoder, and target encoder. A detached diagnostic copy or inference-only clone elsewhere in the repository does not imply that the training target uses stop-gradient.

## Equations 2, 3, and 6: regularize a distribution at each time

Equation 6 defines projected samples $h^{(m)}=Zu^{(m)}$ for unit directions. Equation 2 averages the univariate discrepancy over directions. Equation 3 adds that result to prediction with coefficient $\lambda$. All the mathematics of the characteristic function, Gaussian target, quadrature, and gradient was derived in the SIGReg chapter.

The tensor entering the pinned regularizer has shape time × batch × feature. Direction sampling creates a feature × projection matrix. After projection and frequency multiplication, the phase tensor has time × batch × projection × frequency axes. The code averages the batch axis before squaring the real and imaginary discrepancies, integrates frequencies, multiplies by batch size, then averages directions and time.

The **batch-size factor** is absent from the unscaled integral displayed in Appendix A but present in the pinned implementation. The appendix mentions a possible quadrature range $[0.2,4]$; the code uses 17 nodes on $[0,3]$ with doubled positive-side trapezoid weights and Gaussian window $e^{-\omega^2/2}$. These are documented differences, not interchangeable conventions.

The appendix's limiting distribution-matching statement is an ideal population identification claim. For a growing empirical batch, the unscaled discrepancy has a sampling floor that vanishes; the batch-scaled statistic has a nonzero null-scale expectation. Increasing the number of directions alone does not turn a fixed finite empirical cloud into a continuous Gaussian. The finite-batch calculations earlier in the book make that qualification precise.

## Algorithm 1: translate intent into valid operations

The printed pseudocode contains abbreviated syntax, including a single-argument MSE expression and an incomplete parenthesis in the regularizer line. Read it as a conceptual sequence, then use a dimensionally explicit implementation. In words: encode the window; predict from the context; compare against embeddings shifted forward by one; transpose for step-wise SIGReg; add the weighted terms; differentiate all trainable components.

The pinned code's main loss computation expresses that intent directly. The book's NumPy reference independently checks the same reduction and target-branch gradient structure on a small model. Neither the typeset pseudocode nor our educational model should be mistaken for a complete reproduction of the authors' benchmark pipeline.

## Configuration is part of the scientific object

| Choice | v1 paper description | Pinned repository default inspected |
|---|---|---|
| SIGReg weight | Main text 0.1; ablation peaks near 0.09 | 0.09 |
| Directions / frequency nodes | 1,024; quadrature discussed in appendix | 1,024 / 17 |
| Epochs | Environment appendix reports 10 | Training YAML allows 100 |
| Batch / image size | 128 / 224 × 224 | 128 / 224 × 224 |
| Context | Three for PushT and Cube; one for TwoRoom | Default three, before any override |
| Optimizer | Main text does not fully specify the recipe | AdamW, learning rate $5\times10^{-5}$, weight decay $10^{-3}$ |
| Precision / gradient cap | Consult implementation | bf16 / 1.0 |

AdamW decouples weight decay from Adam's adaptive gradient transformation. Schematically it adds a shrinkage update $-\eta\lambda_{\mathrm{wd}}\theta$ to the adaptive step. An L2 penalty placed inside Adam's gradient would instead be scaled by Adam's coordinatewise denominators. These are generally different updates. Weight decay here is an optimizer choice, separate from the representation-level SIGReg coefficient.

A faithful reproduction should save the resolved configuration, dependency versions, dataset identity, preprocessing and normalization statistics, random seeds, checkpoint selection, and evaluation protocol. The checked-in defaults alone do not certify the settings behind a published table. We inspected source and configurations; the full 15M-parameter benchmark training has not been rerun for this book.

## Equations 4 and 5: plan in the learned coordinates

Equation 4 defines terminal squared latent distance to the encoded goal. Equation 5 seeks an action sequence minimizing that cost. The paper's abbreviated indices write a horizon endpoint and action sequence without spelling out every initial-state offset. The planning chapter's convention—$H$ actions produce an endpoint at $t+H$—removes that ambiguity for implementation.

Appendix B describes CEM with Gaussian candidate sequences, elite selection, and mean/variance refitting. Appendix D gives 300 candidates and 30 elites, with up to 30 iterations for PushT and 10 for other environments. The general appendix description of 30 iterations is therefore not the full environment-specific prescription.

The planning horizon is five action blocks of five physical actions. Appendix D and the pinned PushT evaluation configuration specify an execution prefix of five blocks before replanning. This is longer open-loop execution than the browser's one-action correction loop. A model's apparent control robustness depends on this cadence as well as its prediction accuracy.

<!-- VISUAL: W2 -->

## Section 4: read the performance comparisons on their own terms

The paper evaluates TwoRoom, Reacher, PushT, and OGBench-Cube. Its Figure 6 reports, for the plotted setting, LeWM success rates of 87%, 86%, 96%, and 74%, respectively. It is not uniformly best: the reported foundation-feature method is stronger on Cube, and several alternatives reach higher success in TwoRoom. Those exceptions are essential to the result.

Figure 3 reports planning times of 0.98 seconds and 47 seconds for LeWM and DINO-WM in the compared setup. Dividing gives about 48. The claim concerns that hardware, implementation, and planning configuration, not every device or deployment. The fixed-compute comparisons additionally show that a cheaper model can use a planning budget differently. They should not be conflated with unconstrained best-quality comparisons.

A figure caption says “18% higher” on PushT for 96 versus 78. The arithmetic difference is 18 percentage points; the relative increase is $18/78\approx23.1\%$. This is a small language distinction with a large interpretive consequence. Use units for improvements as carefully as for losses.

Appendix E describes offline data collection: 20,000 PushT expert episodes averaging 196 steps; 10,000 TwoRoom episodes averaging 92 steps; and 10,000 episodes of 200 steps for Cube and Reacher. These are different data distributions, even though all are offline. Reacher data comes from a trained control policy; TwoRoom and Cube use specified heuristic collection procedures.

<!-- VISUAL: W3 -->

## Sections 5 and 6: physical structure and remaining limits

Physical probes recover labeled quantities from frozen embeddings. The paper reports strong access to several positional quantities, while some rotational and dynamic properties remain difficult. A post-training decoder visualizes information retained in the representation; it is not used to supply a reconstruction objective in the main method. A separate decoder-loss ablation is a different experiment.

Violation-of-expectation tests compare normal trajectories, color changes, and teleportation-like physical perturbations. Prediction error increases more for some physical violations, supporting sensitivity to the tested continuity breaks. This is not a calibrated general detector of physical impossibility. The evaluation chapter derived the metrics and examined that distinction.

The stated limitations include short planning horizons, dependence on offline interaction coverage, tension between a high-dimensional Gaussian target and very simple environments, and the need for action labels. Hierarchical models, broader pretraining, and learned action representations are proposed directions. They are not already implemented capabilities of the reported model.

## Appendix G: what an ablation isolates

An ablation changes one selected component under a chosen protocol. Reported PushT examples include 96% without decoder loss versus 86% with it, ViT versus ResNet-18 at 96% versus 94%, and predictor dropout 0.1 outperforming the tested zero and larger dropout settings. These results support particular choices in that experiment. They do not establish that reconstruction always harms control or that one backbone always wins.

The embedding-dimension curve tests discrete settings, including 192; the prose's approximate threshold should not be treated as a universal boundary. Projection counts and knot counts show a relatively insensitive range in the tested setup. A finite range of successful settings does not eliminate the need to specify them.

The paper suggests logarithmic bisection-style coefficient search. Ordinary bisection needs a monotone predicate or a bracketed root; arbitrary validation performance as a function of $\lambda$ need not provide one. Reducing six jointly varied coefficients to one greatly reduces a grid's combinatorial size, but it does not prove a universal $O(\log n)$ global hyperparameter search. This is another place where practical simplification and formal guarantee should be kept distinct.

## Appendix H and I: geometry and curves are diagnostics

Appendix H defines straightness using cosine similarity of consecutive latent displacement vectors. We derive its bounds and edge cases in the evaluation chapter. A larger average cosine indicates straighter paths in the chosen coordinates, not smaller physical error or a proof of more faithful dynamics. The authors' explanation in terms of time-wise regularization is a hypothesis about the observed phenomenon.

Appendix I contrasts training curves. Smooth curves can support an empirical stability narrative but depend on smoothing, measurement intervals, and the runs shown. They are not by themselves a proof of global optimization stability. The multiple-seed control table provides complementary evidence, still on a limited task and evaluation set.

## Your equation-by-equation checkpoint

You should now be able to reconstruct all numbered equations in v1: prediction MSE (1), projected-statistic averaging (2), the two-term objective (3), terminal latent cost (4), action optimization (5), unit projections (6), the frozen-feature baseline loss (7), PLDM's weighted multi-term objective (8), and temporal straightness (9). The SIGReg appendix's unnumbered characteristic-function formulas were derived earlier. The evaluation chapter supplied the unnumbered reinforcement-learning baseline equations, probes, and evaluation statistics.
