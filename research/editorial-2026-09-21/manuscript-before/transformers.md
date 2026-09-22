# Inside the vision transformer

<p class="lead">A transformer repeatedly lets pieces of a representation exchange information. The mechanism is a learned weighted average, surrounded by ordinary neural-network layers.</p>

## Patches turn an image into a sequence

Divide an image into nonoverlapping square patches of side $P$. If both image dimensions are divisible by $P$, there are $(H/P)(W/P)$ patches. Flatten each patch into a vector of length $CP^2$, then apply a learned affine map to a vector of width $d$. The resulting vectors are **tokens**: items in a sequence that the network can process together.

For LeWM's $224\times224$ RGB images and patch size 14, there are $16\times16=256$ patches. Each raw patch has $3\cdot14^2=588$ numbers. A projection maps those 588 numbers into a token width of 192 in the ViT-Tiny encoder described by the paper. This is a learned measurement, not a compression theorem.

A position embedding is added to each token so the network can distinguish where it came from. Without position information, ordinary self-attention is equivariant to reordering the input tokens: permuting the input simply permutes the output. That symmetry is useful for unordered sets, but image patches have spatial relationships that matter.

A special learned **CLS token** is prepended. It has no corresponding image patch. Through attention it can collect information from patch tokens. The final CLS representation is used as a summary of the frame. Whether it retains the needed spatial detail is learned and evaluated, not guaranteed by the name “summary.”

## Queries, keys, and values are learned linear maps

Stack $n$ tokens into $X\in\mathbb R^{n\times d}$. An attention head constructs

$$Q=XW_Q,\qquad K=XW_K,\qquad V=XW_V.$$

If query and key width is $d_k$, then $W_Q,W_K\in\mathbb R^{d\times d_k}$ and $Q,K\in\mathbb R^{n\times d_k}$. Values may have width $d_v$. Query $q_i$ describes what token $i$ seeks; key $k_j$ describes how token $j$ can be matched; value $v_j$ carries the content to retrieve. These are interpretations of learned roles, not manually assigned semantic labels.

Define scores $S_{ij}=q_i^\top k_j/\sqrt{d_k}$. The dot product produces one compatibility score for every ordered pair of tokens. The score matrix has shape $n\times n$.

Why divide by $\sqrt{d_k}$? Under the simplifying model that query and key coordinates are independent, mean-zero, and unit-variance, each product has variance 1 and their sum has variance $d_k$. Dividing by $\sqrt{d_k}$ makes that variance 1. Learned coordinates need not obey those assumptions exactly; the calculation motivates a scale that keeps scores from growing solely because the head width increases.

<figure class="diagram" data-diagram="attention"></figure>

## Softmax produces a normalized weighted average

For each query, define $A_{ij}=e^{S_{ij}}/\sum_r e^{S_{ir}}$. Every weight is positive and the row sums to one. The output is

$$Y_i=\sum_j A_{ij}v_j,\qquad Y=AV.$$

A single head therefore places each output in the convex hull of its value vectors: it is a nonnegative weighted average whose weights sum to one. The surrounding learned projections, multiple heads, residual paths, and nonlinear layers make the whole transformer much richer than one fixed average.

For scores $(0,\log2)$, exponentiation gives $(1,2)$ and weights $(1/3,2/3)$. If values are 3 and 9, the output is $3/3+18/3=7$. A larger score emphasizes a value but does not copy it exactly unless a limiting weight approaches one.

For numerical stability, subtract the largest score before exponentiation. This leaves the weights unchanged because the common factor $e^{-c}$ cancels between numerator and denominator. It avoids unnecessarily large exponentials.

The softmax derivative follows by the quotient rule:

$$\frac{\partial A_j}{\partial S_k}=A_j(\mathbf1\{j=k\}-A_k).$$

For $j=k$, increasing a score increases its own weight by $A_j(1-A_j)$. For $j\ne k$, increasing another score decreases its weight by $A_jA_k$. The weights compete because they must sum to one. This derivative is one of the local rules automatic differentiation uses.

<div class="lab" id="attention-lab"><div class="lab-head"><span class="eyebrow">Attention desk</span><h3>A weighted retrieval</h3><p>Divide three fixed scores by a temperature before softmax. Lower temperature concentrates the retrieval on the largest score.</p></div><div class="controls"><label>Temperature <input id="attention-temperature" type="range" min="0.15" max="3" step="0.05" value="1"/></label></div><canvas id="attention-canvas" aria-label="Three attention weights at the selected temperature"></canvas><p id="attention-readout" class="readout"></p></div>

## Multiple heads ask different questions

Several heads independently project the same input into different query, key, and value spaces. Their outputs are concatenated and passed through an output projection. A head could become sensitive to motion correspondence while another emphasizes appearance, but such interpretations must be tested rather than assumed.

If $h$ heads each produce width $d_v$, concatenation gives width $hd_v$, and an output matrix maps it back to the model width. A feed-forward sublayer then applies the same small MLP independently to each token. Attention mixes information across tokens; the MLP transforms features within a token. Residual additions preserve a route for the previous token state.

Computing all query–key dot products costs proportionally to $n^2d_k$ per head, ignoring constant factors. Multiplying attention weights by values costs proportionally to $n^2d_v$. This explains why reducing the number of tokens can matter greatly when a planner repeatedly evaluates many sequences. Other layers and memory traffic still contribute; a token-count ratio is not automatically an end-to-end speedup ratio.

## Causal masking enforces an information boundary

A temporal predictor should not use the future target to predict that same future. For a causal self-attention layer, entries with key time $j>i$ are masked before normalization. Mathematically, assigning them score $-\infty$ makes their exponential zero. The remaining weights normalize over allowed positions.

This mask is an information constraint. It does not make the learned relation causal in the intervention sense by itself. It only prevents access to later sequence positions. The action-conditioned dataset and evaluation must still establish whether the model predicts action consequences well.

During teacher-forced training, all observed context tokens can be processed in parallel under a triangular mask. During free rollout, the next predicted token is appended to the context and used to predict again. The context length can be fixed by retaining only a recent window. With several previous frames, the model can infer some hidden motion that a single frame would not reveal.

## Layer Normalization changes each example's geometry

For one token $x\in\mathbb R^d$, define its feature mean $\mu=d^{-1}\sum_jx_j$ and variance $v=d^{-1}\sum_j(x_j-\mu)^2$. Layer Normalization computes

$$\operatorname{LN}(x)_j=\gamma_j\frac{x_j-\mu}{\sqrt{v+\epsilon}}+\beta_j.$$

The learned scale $\gamma$ and shift $\beta$ are shared across examples. Before that affine step and with $\epsilon=0$, the normalized vector has coordinate sum zero and squared length $d$. Both follow directly: centering makes the sum zero, and dividing by $\sqrt v$ makes the sum of squared coordinates $\sum_j(x_j-\mu)^2/v=d$.

Those are per-example constraints. A standard Gaussian vector does not have exactly zero coordinate sum or exactly fixed length. Its radius varies from sample to sample. Thus asking the direct output of such normalization to behave like a full-dimensional standard Gaussian creates a geometric mismatch. A learned affine transform does not restore unconstrained full-dimensional support by itself; it transforms the constrained surface.

LeWM uses a projector after the encoder's final normalization, with Batch Normalization in the projector. A nonlinear projector can change the geometry instead of merely retaining the same fixed-radius constraint. The precise projector implementation is part of the architecture contract; the paper's description and pinned code should both be consulted when reproducing it.

Batch Normalization instead uses a feature's statistics across examples. At training time, an example's output then depends on the other examples in its batch. At evaluation, conventional implementations use running statistics collected during training. This difference must be respected in probes and planning. Mixing training and evaluation modes can change a goal embedding depending on what other goals happen to share its batch.

## Action conditioning through adaptive normalization

One simple action interface concatenates the action with the latent vector. The paper instead conditions transformer blocks using **Adaptive Layer Normalization**, or AdaLN. A network maps the action embedding to shifts, scales, and residual gates. A schematic branch has the form

$$x'=x+\alpha(\act)\odot F\big((1+s(\act))\odot\operatorname{LN}(x)+b(\act)\big).$$

Here $s,b,\alpha$ are learned functions of action conditioning, all shaped to match the token features. Scaling and shifting adjust how the branch processes the current representation. The gate controls how strongly that branch modifies the residual stream.

In AdaLN-zero initialization, the modulation output is initialized to zero. Then $s=b=\alpha=0$, and the branch initially returns $x'=x$. This begins with an identity residual path rather than a large random action-dependent perturbation. The gate can receive a gradient even at zero because $\partial x'/\partial\alpha$ contains the branch output. Some deeper branch parameters initially receive zero contribution through that gate and become active as it opens. This is an initialization strategy, not an anti-collapse proof.

The pinned LeWM code uses separate modulation parameters for attention and MLP branches. Its internal modules also apply normalization. For a faithful implementation, follow the exact module structure rather than treating the schematic formula as a line-for-line replacement.

## Activations and positional parameters are ordinary learned machinery

A transformer MLP often uses GELU, defined as $\operatorname{GELU}(x)=x\Phi(x)$ with $\Phi$ the standard Gaussian cumulative distribution. It smoothly weights an input by a number between zero and one. Its derivative is $\Phi(x)+xp(x)$ by the product rule and the fundamental theorem of calculus. Implementations sometimes use a tanh approximation; those are numerically similar but not identical functions.

SiLU, used in some conditioning networks, is $x\sigma(x)$ with logistic sigmoid $\sigma(x)=1/(1+e^{-x})$. Differentiating gives $\sigma(x)+x\sigma(x)(1-\sigma(x))$. These activations are chosen model components. Their definitions should not be confused with probability claims about the features.

Learned positional embeddings are parameter vectors added to tokens at particular positions. They make order available to the model. They do not enforce a physical notion of time unless the training problem makes that interpretation useful. If frame spacing changes, the same position difference may correspond to a different physical interval, so the data preprocessing matters.

## A complete tiny attention calculation

The following implementation exposes one head. It is included from the tested reference source used by the book's numerical checks.

<!-- CODE: book/edition2/attention_reference.py -->

Each row of `weights` corresponds to one query. The mask is applied before the maximum and exponential. Every causal row includes its own position, so no row has all positions masked. Handling an entirely masked row would require an explicit convention to avoid undefined normalization.

## Return to the diagnostic decoder

The evaluation chapter separated decoder quality from world-model quality. We can now understand the decoder's architecture. **Cross-attention** uses queries from one collection and keys and values from another. If $Q$ has $n$ rows and $K,V$ have $m$ rows, then $QK^\top$ has shape $n\times m$, and multiplying its row-normalized weights by $V$ produces one output per query. The same calculation applies even though the two collections have different lengths.

LeWM's diagnostic decoder uses learned patch queries to retrieve information from an encoded frame description. The outputs can be mapped back to image patches. That reconstruction training occurs after the representation-learning experiment; it does not turn the main JEPA objective into pixel reconstruction.

## Worked exercise: why can a future leak?

Suppose a training window contains embeddings $z_1,z_2,z_3$, and the output at position 1 is compared with $z_2$. What happens if the predictor attends freely to every position?

<details class="derivation"><summary>Find the shortcut</summary>

It can retrieve $z_2$ directly, which is the target it is supposed to predict. A small training error could then reflect copying rather than dynamics. Causal masking at position 1 allows only the first context position, plus the correctly aligned action. For a task predicting the next embedding from each prefix, the output and target slices must also be shifted by one.

Masking alone does not prevent leakage through other preprocessing, such as constructing a context feature with access to future frames. Check the entire data flow, not only the attention matrix. A per-frame image encoder avoids temporal leakage through the encoder, provided each frame really is processed independently before temporal prediction.

</details>


We can now distinguish an architectural mechanism from its learning objective. The next chapter revisits the research papers using both, rather than asking you to memorize a chronology of names.
