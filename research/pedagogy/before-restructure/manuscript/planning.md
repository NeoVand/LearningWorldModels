# From imagination to action

<p class="lead">A learned model tells us what it expects. A planner asks which expectation is worth trying, then returns to the world for a correction.</p>

## Separate learning from planning

During training, observations and actions are fixed examples and we change model parameters. During planning, the model parameters are fixed and we change proposed actions. Both may minimize a scalar objective, but they optimize different variables.

Starting from an encoded observation, define a rollout with an unambiguous action count:

$$\pred_t=\lat_t,\qquad \pred_{t+k+1}=g_\psi(\pred_{t+k},\act_{t+k}),\quad k=0,\ldots,H-1.$$

There are $H$ transitions, $H$ actions, and a final state at $t+H$. A history-dependent predictor carries the required earlier embeddings and actions along with this simplified recurrence. We use the one-state notation only to keep the derivation readable.

Given a goal observation $o_g$, encode $\lat_g=f_\theta(o_g)$ and define terminal cost $J=\|\pred_{t+H}-\lat_g\|^2$. The desired sequence is an argument attaining the smallest cost over the allowed actions. The notation $\arg\min$ names the minimizing input, whereas $\min$ names the minimum value. Numerical solvers generally return candidates, not certified global optima.

## Why latent distance might help, and when it misleads

A goal image offers a convenient task interface. It does not require a separately trained reward model for every new target. If nearby latent states correspond to similar task-relevant physical states and the predictor is accurate along candidate paths, reducing latent goal distance can be useful.

Both qualifications matter. Two physically different states can share an embedding. A goal image can be visually ambiguous about hidden velocity. A representation can preserve state information through a nonlinear map while Euclidean latent distance gives a poor control landscape. An accurate probe therefore does not guarantee a useful planning metric.

Action effort can be added to discourage unnecessarily large commands:

$$J(A)=\|\pred_{t+H}-\lat_g\|^2+\rho\sum_{k=0}^{H-1}\|\act_{t+k}\|^2,\qquad\rho\geq0.$$

This is a modeling choice. It changes the task preference and may keep the planner from reaching a goal if the penalty is too strong. A running goal cost can reward progress at intermediate steps, but it can also favor a locally close route over a temporarily distant route needed to avoid an obstacle. The browser planner's configuration specifies its actual combination; the paper's Eq. 4 focuses on terminal goal matching.

## Differentiate through a rollout

If the model and cost are differentiable, action optimization can use gradients. For a terminal cost, let $v_H=2(\pred_{t+H}-\lat_g)$. This is the sensitivity of the squared distance to the final embedding. Working backward,

$$v_k=\left(\frac{\partial g}{\partial z}(\pred_{t+k},\act_{t+k})\right)^\top v_{k+1}.$$

The action gradient at step $k$ is the action Jacobian transpose times $v_{k+1}$, plus $2\rho\act_{t+k}$ if effort is included. This is backpropagation through time: the same chain rule as neural-network training, now with actions as adjustable inputs.

Large products of Jacobians can amplify or suppress sensitivities over long horizons. Nonsmooth constraints, inaccurate model gradients, and local minima can also make gradient optimization difficult. The final paper uses a gradient-free sampling method, CEM, instead. The existence of a differentiable predictor does not require the planner to differentiate it.

## CEM refits a distribution to promising plans

Flatten a candidate action sequence into $A\in\mathbb R^{Hd_a}$, where $d_a$ is action dimension. Start with a Gaussian sampling distribution with mean $\mu$ and coordinatewise standard deviations $\sigma$. Draw several sequences, evaluate their rollout costs, and keep the lowest-cost subset, called the elites.

Why update the mean and variance to the elites' moments? Suppose the elite sequences are temporarily treated as samples to fit with a diagonal Gaussian. For one coordinate, the negative log likelihood, ignoring constants, is

$$K\log\sigma+\frac1{2\sigma^2}\sum_{i\in\mathcal E}(A_i-\mu)^2.$$

Differentiating with respect to $\mu$ gives $\sum_i(\mu-A_i)/\sigma^2=0$, so the fitted mean is the elite average. Differentiating with respect to $\sigma^2$ gives a fitted variance equal to the average squared deviation from that mean, with denominator $K$, not $K-1$. This is maximum likelihood for the selected samples, not an unbiased variance estimate of the original population.

<figure class="diagram" data-diagram="cem"></figure>

CEM repeats this sample–score–select–refit loop. The elites are chosen by cost rather than sampled from a fixed data distribution, so this derivation explains the refitting step without proving global convergence of the whole optimizer. Smoothing updates, variance floors, action clipping, and retaining the best candidate are practical choices that further modify the basic procedure.

## A complete reference planner

<!-- CODE: book/edition2/planning_reference.py -->

The `cost` function must evaluate candidates using the learned model in a learned-model experiment. The reference keeps the best sequence actually scored. The final distribution mean can be another candidate, but its cost need not equal or beat the best elite's cost in a nonlinear problem. Clipping enforces action bounds; fitting ordinary Gaussian moments to clipped elites is a practical heuristic, not exact maximum likelihood for a truncated Gaussian family.

The number of model transitions evaluated is approximately iterations × samples × horizon. Doubling any one of these roughly doubles rollout work if other costs remain comparable. High-dimensional action sequences are harder to search because a fixed sample budget covers a smaller fraction of the space. A diagonal distribution also ignores correlations between action coordinates and time steps, although the elite mean can still encode a coordinated sequence.

## A two-action calculation by hand

Consider the known scalar system $x_{k+1}=x_k+a_k$, starting at zero and aiming for 1 after two actions. Let the cost be $(a_0+a_1-1)^2+\rho(a_0^2+a_1^2)$. This is a teaching model, not the learned arm dynamics.

The two derivatives are $2(a_0+a_1-1)+2\rho a_0$ and $2(a_0+a_1-1)+2\rho a_1$. For $\rho>0$, subtracting them implies $a_0=a_1$. Substitution gives $a_0=a_1=1/(2+\rho)$. With no effort penalty, any sequence whose actions sum to 1 reaches zero terminal cost. With positive effort, the optimum splits the action evenly and stops short of the exact target to save effort.

A sampling planner should approach this analytic solution when its budget is sufficient. Comparing against a solvable toy problem is a stronger software check than looking at an attractive animation alone.

## Teacher forcing does not eliminate rollout error

<figure class="diagram" data-diagram="rollout"></figure>

Suppose the true latent transition $F$ is well defined on the relevant states, the learned transition $g$ has one-step error at most $\epsilon$ there, and $g$ is Lipschitz with constant $L$: $\|g(x,a)-g(y,a)\|\leq L\|x-y\|$. These are assumptions, not properties guaranteed by JEPA training.

Let $E_k$ be the distance between the imagined and true latent state after the same actions. Insert and subtract $g(z_k,a_k)$ and use the triangle inequality:

$$E_{k+1}\leq\|g(\hat z_k,a_k)-g(z_k,a_k)\|+\|g(z_k,a_k)-F(z_k,a_k)\|\leq LE_k+\epsilon.$$

Starting with $E_0=0$, repeated substitution gives $E_H\leq\epsilon\sum_{j=0}^{H-1}L^j$. If $L=1$, the bound is $H\epsilon$. If $L\ne1$, multiply the geometric sum by $L-1$ to obtain $(L^H-1)/(L-1)$. When $L>1$, the bound can grow rapidly. When $L<1$, it remains below $\epsilon/(1-L)$.

This bound is useful for understanding the mechanism, but its assumptions may fail. The learned representation may not admit deterministic Markov dynamics, or the imagined state may leave the domain where one-step error was bounded. Model exploitation occurs when the planner finds action sequences that look favorable mainly because they enter such inaccurate regions.

<div class="lab" id="rollout-lab"><div class="lab-head"><span class="eyebrow">Planning desk</span><h3>Small errors, repeated</h3><p>Change the assumed sensitivity of the transition. The chart computes a bound, not an observed performance curve.</p></div><div class="controls"><label>Transition sensitivity <input id="rollout-lipschitz" type="range" min="0.5" max="1.5" step="0.02" value="1"/></label></div><canvas id="rollout-canvas" aria-label="Worst-case rollout error bound over twelve steps"></canvas><p id="rollout-readout" class="readout"></p></div>

## MPC spends predictions in short installments

Model Predictive Control repeatedly plans, executes only a chosen prefix, observes again, and replans. Fresh observation replaces part of the imagined state with measured evidence. Executing one action before replanning gives frequent correction but requires more online computation. Executing a longer prefix reduces planning frequency but exposes the controller to more open-loop error.

Use separate names for planning horizon $H$ and execution prefix $K_{\mathrm{exec}}$. They need not be equal. The browser executes one selected action before replanning. LeWM v1's main text describes a general prefix strategy, while its implementation appendix specifies executing the full optimized five-step action-block sequence before replanning. With a frame skip of five, that corresponds to 25 environment actions. Read the exact setup rather than inferring “one action” from the term MPC.

A warm start shifts the previous optimized sequence forward and appends a final guess. It can save search effort when consecutive planning problems are similar. It can also preserve a bad local plan. Fresh exploration and a suitable variance floor help maintain alternatives, but no such heuristic replaces evaluating actual outcomes.

## Uncertainty and hierarchy remain separate challenges

A deterministic rollout supplies one predicted future per action sequence. If several futures remain possible, minimizing the cost of their mean can be misleading. One could instead sample latent uncertainties, average costs across outcomes, or penalize risk. The objective must say which uncertainties are represented and how they are weighted. A learned uncertainty estimate also needs calibration on held-out data.

Hierarchical planning changes the time and state scales of prediction. A high-level model can propose a subgoal several low-level steps away, then a lower-level controller realizes it. The high-level plan must remain achievable by the lower-level dynamics. LeWM's short-horizon results motivate this direction but do not implement the full H-JEPA proposal.

## Worked exercise: arriving is not staying

A controller enters the goal tolerance at action 12 and leaves it by action 15. Another approaches more slowly but remains within tolerance for the last ten actions. Which is better?

<details class="derivation"><summary>Specify the task before ranking the runs</summary>

For a one-time contact task, first arrival may be sufficient. For holding a pose, sustained occupancy matters. Report time to first success, fraction of time within tolerance, final error, and any declared hold criterion. These are different summaries of the same trajectory.

A goal image typically describes pose more directly than velocity. If the latent cost does not penalize residual motion, arriving with momentum can be cheap even though the mechanism drifts away. History, a velocity-sensitive representation, running costs, or a hold objective can change this behavior. Each modification should be tested under the same data and control budget.

</details>

We have reached the point where the final paper's training and planning equations can be read without a mathematical leap. Now we will walk through the paper itself, including the details that its compact main-text formulas leave implicit.
