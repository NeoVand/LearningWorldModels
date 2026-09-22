# From imagination to action

<p class="lead">A learned model tells us what it expects. A planner asks which expectation is worth trying, then returns to the world for a correction.</p>

## Separate learning from planning

During training, observations and actions are fixed examples and we change model parameters. During planning, the model parameters are fixed and we change proposed actions. Both may minimize a scalar objective, but they optimize different variables.

Starting from an encoded observation, define a rollout with an unambiguous action count:

$$\begin{aligned}&\pred_t=\lat_t, \\ &\pred_{t+k+1}=g_\psi(\pred_{t+k},\act_{t+k}), \\ &k=0,\ldots,H-1.\end{aligned}$$

There are $H$ transitions, $H$ actions, and a final state at $t+H$. A history-dependent predictor carries the required earlier embeddings and actions along with this simplified recurrence. We use the one-state notation only to keep the derivation readable.

Given a goal observation $\observed{o}_g$, encode $\lat_g=f_\theta(\observed{o}_g)$ and define terminal cost $\objective{J}=\|\pred_{t+H}-\lat_g\|^2$. The desired sequence is an argument attaining the smallest cost over the allowed actions. The notation $\arg\min$ names the minimizing input, whereas $\min$ names the minimum value. Numerical solvers generally return candidates, not certified global optima.

<!-- VISUAL: A1 -->

## Why latent distance might help, and when it misleads

A goal image specifies a new target through the existing encoder, avoiding a separately trained reward model for each target. If nearby latent states correspond to similar task-relevant physical states and the predictor is accurate along candidate paths, reducing latent goal distance can be useful.

Both qualifications matter. Two physically different states can share an embedding. A goal image can be visually ambiguous about hidden velocity. A representation can preserve state information through a nonlinear map while Euclidean latent distance gives a poor control landscape. An accurate probe therefore does not guarantee a useful planning metric.

Action effort can be added to discourage unnecessarily large commands:

$$\begin{aligned}&\objective{J}(\action{A})=\|\pred_{t+H}-\lat_g\|^2+\rho\sum_{k=0}^{H-1}\|\act_{t+k}\|^2, \\ &\rho\geq0.\end{aligned}$$

This is a modeling choice. It changes the task preference and may keep the planner from reaching a goal if the penalty is too strong. A running goal cost can reward progress at intermediate steps, but it can also favor a locally close route over a temporarily distant route needed to avoid an obstacle. The browser planner’s configuration specifies its actual combination; the paper’s Eq. 4 focuses on terminal goal matching.

<!-- VISUAL: A5 -->

## Differentiate through a rollout

If the model and cost are differentiable, action optimization can use gradients. For a terminal cost, let $v_H=2(\pred_{t+H}-\lat_g)$. This is the sensitivity of the squared distance to the final embedding. Working backward,

$$v_k=\left(\frac{\partial g}{\partial \encoded{z}}(\pred_{t+k},\act_{t+k})\right)^\top v_{k+1}.$$

The action gradient at step $k$ is the action Jacobian transpose times $v_{k+1}$, plus $2\rho\act_{t+k}$ if effort is included. This is backpropagation through time: the same chain rule as neural-network training, now with actions as adjustable inputs.

Large products of Jacobians can amplify or suppress sensitivities over long horizons. Nonsmooth constraints, inaccurate model gradients, and local minima can also make gradient optimization difficult. The final paper uses a gradient-free sampling method, CEM, instead. The existence of a differentiable predictor does not require the planner to differentiate it.

## CEM refits a distribution to promising plans

Flatten a candidate action sequence into $\action{A}\in\mathbb R^{Hd_\action{a}}$, where $d_\action{a}$ is action dimension. Start with a Gaussian sampling distribution with mean $\mu$ and coordinatewise standard deviations $\sigma$. Draw several sequences, evaluate their rollout costs, and keep the lowest-cost subset, called the elites.

Why update the mean and variance to the elites’ moments? Fix one action coordinate and write $\action{A}_i$ for its value in elite sequence $i$. Let $n_e=|\mathcal E|$ be the number of elites. We fit these selected values as if they were independent samples from $\mathcal N(\mu,\sigma^2)$.

A **likelihood** evaluates the observed data’s probability or density as a function of candidate parameters. For continuous observations it is a density, not a probability of observing those exact real numbers. Independence gives a product:

$$\begin{aligned}&\mathcal L(\mu,\sigma)=\prod_{i\in\mathcal E}\frac1{\sqrt{2\pi}\sigma}\exp\!\left[-\frac{(\action{A}_i-\mu)^2}{2\sigma^2}\right], \\ &\sigma>0.\end{aligned}$$

The product can become extremely small. Taking its logarithm preserves which parameters maximize it and turns multiplication into addition. Negate that logarithm to obtain a minimization objective:

$$\begin{aligned}-\log\mathcal L&=\frac{n_e}{2}\log(2\pi)+n_e\log\sigma\\&\quad+\frac1{2\sigma^2}\sum_{i\in\mathcal E}(\action{A}_i-\mu)^2.\end{aligned}$$

The first term is constant with respect to the fitted parameters. The mean derivative is $\sum_i(\mu-\action{A}_i)/\sigma^2$, so its zero gives $\mu_*=(1/n_e)\sum_i\action{A}_i$. Its positive second derivative $n_e/\sigma^2$ makes this the unique minimum for any fixed positive variance.

Now write $v=\sigma^2$ and $S=\sum_i(\action{A}_i-\mu_*)^2$. The remaining variance-dependent terms are $(n_e/2)\log v+S/(2v)$. Their derivative is $(n_ev-S)/(2v^2)$. For $S>0$, it is negative below $S/n_e$ and positive above it, proving

$$v_* = \frac1{n_e}\sum_{i\in\mathcal E}(\action{A}_i-\mu_*)^2.$$

The denominator is $n_e$, rather than $n_e-1$, because we maximized the selected samples’ likelihood; we did not seek an unbiased population variance estimate. If all elite values coincide, $S=0$ and the fitted variance tends to zero: there is no optimum with strictly positive variance. A variance floor prevents this degeneracy and preserves room to explore. Apply the same calculation separately to each coordinate for a diagonal Gaussian.

<figure class="diagram" data-diagram="cem"></figure>

CEM repeats this sample–score–select–refit loop. The elites are chosen by cost rather than sampled from a fixed data distribution, so this derivation explains the refitting step without proving global convergence of the whole optimizer. Smoothing updates, variance floors, action clipping, and retaining the best candidate are practical choices that further modify the basic procedure.

<!-- VISUAL: A2 -->

## A complete reference planner

<!-- CODE: book/edition2/planning_reference.py -->

The `cost` function must evaluate candidates using the learned model in a learned-model experiment. The reference keeps the best sequence actually scored. The final distribution mean can be another candidate, but its cost need not equal or beat the best elite’s cost in a nonlinear problem. Clipping enforces action bounds; fitting ordinary Gaussian moments to clipped elites is a practical heuristic, not exact maximum likelihood for a truncated Gaussian family.

The number of model transitions evaluated is approximately iterations × samples × horizon. Doubling any one of these roughly doubles rollout work if other costs remain comparable. High-dimensional action sequences are harder to search because a fixed sample budget covers a smaller fraction of the space. A diagonal distribution also ignores correlations between action coordinates and time steps, although the elite mean can still encode a coordinated sequence.

## A two-action calculation by hand

Consider the known scalar system $x_{k+1}=x_k+\action{a}_k$, starting at zero and aiming for 1 after two actions. Let the cost be $(\action{a}_0+\action{a}_1-1)^2+\rho(\action{a}_0^2+\action{a}_1^2)$. This is a teaching model, not the learned arm dynamics.

The two derivatives are $2(\action{a}_0+\action{a}_1-1)+2\rho \action{a}_0$ and $2(\action{a}_0+\action{a}_1-1)+2\rho \action{a}_1$. For $\rho>0$, subtracting them implies $\action{a}_0=\action{a}_1$. Substitution gives $\action{a}_0=\action{a}_1=1/(2+\rho)$. With no effort penalty, any sequence whose actions sum to 1 reaches zero terminal cost. With positive effort, the optimum splits the action evenly and stops short of the exact target to save effort.

A sampling planner should approach this analytic solution when its budget is sufficient. Comparing against a solvable toy problem is a stronger software check than looking at an attractive animation alone.

## Teacher forcing does not eliminate rollout error

<figure class="diagram" data-diagram="rollout"></figure>

Suppose the true latent transition $F$ is well defined on the relevant states, the learned transition $g$ has one-step error at most $\epsilon$ there, and $g$ is Lipschitz with constant $L$: $\|g(x,\action{a})-g(y,\action{a})\|\leq L\|x-y\|$. These are assumptions, not properties guaranteed by JEPA training.

Let $E_k$ be the distance between the imagined and true latent state after the same actions. Insert and subtract $g(\encoded{z}_k,\action{a}_k)$ and use the triangle inequality:

$$\begin{aligned}E_{k+1}&\leq\|g(\predicted{\hat z}_k,\action{a}_k)-g(\encoded{z}_k,\action{a}_k)\|\\&\quad+\|g(\encoded{z}_k,\action{a}_k)-F(\encoded{z}_k,\action{a}_k)\|\\&\leq LE_k+\epsilon.\end{aligned}$$

Starting with $E_0=0$, repeated substitution gives $E_H\leq\epsilon\sum_{j=0}^{H-1}L^j$. If $L=1$, the bound is $H\epsilon$. If $L\ne1$, multiply the geometric sum by $L-1$ to obtain $(L^H-1)/(L-1)$. When $L>1$, the bound can grow rapidly. When $L<1$, it remains below $\epsilon/(1-L)$.

This bound is useful for understanding the mechanism, but its assumptions may fail. The learned representation may not admit deterministic Markov dynamics, or the imagined state may leave the domain where one-step error was bounded. Model exploitation occurs when the planner finds action sequences that look favorable mainly because they enter such inaccurate regions.

<div class="lab" id="rollout-lab"><div class="lab-head"><span class="eyebrow">Planning desk</span><h3>Small errors, repeated</h3><p>Change the assumed sensitivity of the transition. The chart compares every bound on the same fixed, log-spaced error axis; the dashed line holds L = 1.</p></div><div class="controls"><label>Transition sensitivity <input id="rollout-lipschitz" type="range" min="0.5" max="1.5" step="0.02" value="1"/></label></div><canvas id="rollout-canvas" aria-label="Worst-case rollout error bound over twelve steps, compared with L equals one"></canvas><p id="rollout-readout" class="readout"></p></div>

<!-- VISUAL: A3 -->

## MPC spends predictions in short installments

Model Predictive Control repeatedly plans, executes only a chosen prefix, observes again, and replans. Fresh observation replaces part of the imagined state with measured evidence. Executing one action before replanning gives frequent correction but requires more online computation. Executing a longer prefix reduces planning frequency but exposes the controller to more open-loop error.

Use separate names for planning horizon $H$ and execution prefix $K_{\mathrm{exec}}$. They need not be equal. The browser executes one selected action before replanning. LeWM v1's main text describes a general prefix strategy, while its implementation appendix specifies executing the full optimized five-step action-block sequence before replanning. With a frame skip of five, that corresponds to 25 environment actions. Read the exact setup rather than inferring “one action” from the term MPC.

A warm start shifts the previous optimized sequence forward and appends a final guess. It can save search effort when consecutive planning problems are similar. It can also preserve a bad local plan. Fresh exploration and a suitable variance floor help maintain alternatives, but no such heuristic replaces evaluating actual outcomes.

<!-- VISUAL: A4 -->

## Uncertainty and hierarchy remain separate challenges

A deterministic rollout supplies one predicted future per action sequence. If several futures remain possible, minimizing the cost of their mean can be misleading. One could instead sample latent uncertainties, average costs across outcomes, or penalize risk. The objective must say which uncertainties are represented and how they are weighted. A learned uncertainty estimate also needs calibration on held-out data.

Hierarchical planning changes the time and state scales of prediction. A high-level model can propose a subgoal several low-level steps away, then a lower-level controller realizes it. The high-level plan must remain achievable by the lower-level dynamics. LeWM’s short-horizon results motivate this direction but do not implement the full H-JEPA proposal.

The next chapter evaluates the complete observation–prediction–action chain. First, use this exercise to decide what the word “success” should measure.

<section class="short-exercise">

## Worked exercise: arriving is not staying

A controller enters the goal tolerance at action 12 and leaves it by action 15. Another approaches more slowly but remains within tolerance for the last ten actions. Which is better?

<details class="derivation"><summary>Specify the task before ranking the runs</summary>

For contact, first arrival may suffice; holding a pose requires sustained occupancy. Report first-arrival time, fraction of time within tolerance, final error, and the declared hold criterion. A goal image can hide velocity: arriving with momentum may be cheap even when the mechanism immediately drifts away. Compare a hold criterion, added history, or a motion-sensitive cost under the same data and control budget.

</details>

</section>
