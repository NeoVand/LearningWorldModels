# Learning before labels

<p class="lead">Before asking which loss to minimize, ask what kind of knowledge an agent needs. A useful prediction is a prediction about something, for a reason.</p>

## The lesson hidden in an ordinary video

Imagine watching a ball roll behind a screen. You expect it to reappear on the other side. Nobody needs to attach a class label to each frame for the sequence to contain a lesson. The visible past constrains the hidden present and the possible future. A learner can make a prediction, wait, and compare that prediction with what happens.

<figure class="generated-plate" data-art="P1"><img src="assets/generated/infographics/occlusion-narrow-screen.png" alt="A top-view schematic separates the ball’s path from the screen; three camera frames show the ball disappear and reappear."/><figcaption>The screen stands between the camera and the path. It blocks the middle position; sightlines to both outer positions clear its edges. Left: a top-view schematic. Right: successive camera views. All three marked positions belong to one moving ball.</figcaption></figure>

<!-- VISUAL: P1 -->

That comparison supplies a **learning signal**: information that can change the learner’s adjustable parameters. “Unlabeled” is not “without structure.” Time, spatial continuity, different views of the same scene, and the consequences of actions all provide structure. Self-supervised learning constructs an input and a target from that structure. A withheld image patch is a target; the next camera frame is another. The learner is not told an answer by a human annotator, but it still has an objective.

A supervised classifier solves a narrower problem: given an observation, predict a supplied label. If all training labels say whether a cup is present, there is little direct incentive to preserve the cup’s velocity or whether it is supported. A predictive learner can encounter pressure to preserve these quantities because they affect what happens next. A prediction objective can also exploit a shortcut such as the identity of the room or the unchanging background.

The central question is therefore not whether labels are good or bad. It is whether the training problem rewards the distinctions we will need later. For our mechanism, those distinctions include pose, motion, and response to action. Later goals may change without changing the mechanism’s dynamics.

## What LeCun proposes, and what remains a proposal

Yann LeCun’s [2022 position paper, version 0.9.2](https://openreview.net/forum?id=BZ5a1r-kVsf), organizes a research program around learning from observation, planning through a world model, and representing the world at several levels of abstraction. It is a proposed synthesis, not a report that all its components have already been trained together successfully.

Its six main responsibilities are worth separating carefully. **Perception** extracts a useful state description. A **world model** predicts how that description can evolve. **Cost** expresses preferences, including intrinsic costs and a learned critic that anticipates future costs. An **actor** selects actions, possibly by optimizing a sequence through the model. **Short-term memory** retains information that the current observation does not provide. A **configurator** adjusts the other components to the task and circumstances.

The diagram below introduces the functional loop, before we specify neural networks or losses.

<figure class="diagram" data-diagram="agent"></figure>

Our running example is a small slice of this proposal. The browser learner has a visual encoder, a predictor, a hand-specified goal cost, and a planner. It has a short observation history, but not the proposed general memory system. It has no learned configurator, no learned intrinsic motivational system, and no hierarchy of trained world models. Keeping that boundary visible helps us understand exactly what LeWorldModel contributes.

LeCun distinguishes reactive action from deliberative action. A reactive policy is a function that directly maps available information to an action. A deliberative system first imagines consequences and searches for a good action. One can then teach a fast policy to imitate the planner. The expensive deliberation becomes training data for a cheaper response. The term **amortization** means spreading a one-time learning cost across many later uses: repeatedly solving a problem teaches a function to approximate its solution.

<!-- VISUAL: P2 -->

## State, observation, and memory are different things

Let the physical state be $s_t$, the action be $\act_t$, and an observation be $\obs_t$. A deterministic toy environment can be described by two functions:

$$s_{t+1}=F(s_t,\act_t),\qquad \obs_t=O(s_t).$$

These are definitions of a state-transition rule and a sensor rule. They are not claims that every real environment is deterministic. The notation $O$ here names the observation function; it is unrelated to the computational-complexity notation introduced later.

Suppose $s_t=(q_t,v_t)$ records position and velocity, while the camera reveals only position. In a simple unit-time model, $q_{t+1}=q_t+v_t$. The two states $(0,1)$ and $(0,-1)$ produce the same current picture but different next positions. No function of that picture alone can predict both correctly. This is an information problem, not a failure that a larger neural network can necessarily fix.

Two pictures can help. If velocity is constant between frames separated by time $\Delta t$, then $q_t-q_{t-1}=v\Delta t$. Dividing both sides by $\Delta t$ gives $v=(q_t-q_{t-1})/\Delta t$. If acceleration or occlusion matters, more history or a different state estimator may be needed. History helps when the earlier observations contain information about the hidden quantities needed for prediction. Some hidden quantities may remain unobservable even from a long sequence.

A state description is **Markov** for a prediction problem when, given that state and the relevant action, earlier history supplies no additional information about the next state. In everyday terms, the description has retained the past information needed for this prediction. Probability will later let us express that statement as conditional independence. The state must already include whatever memory matters. A compact learned embedding may fail to have that property even if the physical simulator’s full state has it.

## Why predict a representation?

A camera describes surfaces, lighting, shadows, textures, and geometry all at once. A decision may depend strongly on some of these and weakly on others. A map of a railway system deliberately loses street-level detail while preserving connections needed for route planning. A learned representation is also a selective description, though its coordinates need not have names we recognize.

<!-- VISUAL: P3 -->

The analogy has a limit. A transit map is designed around a known purpose. In representation learning, we ask an objective and data to shape the map. If the objective says only “make the future easy to predict,” a blank map is excellent: nothing changes on it. If it says only “retain all variation,” irrelevant camera noise may occupy much of the representation. JEPA needs a balance between predictability and information retention.

An **invariance** identifies observations that differ in a way we decide not to preserve. If changing a tablecloth leaves an embedding unchanged, the encoder is invariant to that change on those examples. An **equivariance** preserves a structured response: rotating an object causes a corresponding transformation of its representation. Invariance is appropriate for a nuisance; equivariance may be appropriate for a variable needed in control. Removing orientation from an arm representation would make some goals impossible to distinguish.

An encoder cannot create information missing from its input. It can organize information, suppress variations, and make some relationships easier for a later model to use. A surprising success must still be supported by some informative pattern in the observations or history.

## A description can hide detail without resolving uncertainty

Our map can leave out the tablecloth because a different tablecloth does not change the arm’s motion. But removing that detail does not tell us whether an unseen person will push the arm. These are two different problems: deciding what to describe and representing what remains uncertain.

LeCun’s broader proposal permits several compatible futures and uses a compatibility score called an energy. Lower scores mean a better fit. We will give this a mathematical definition after learning probability and prediction losses. LeWorldModel, our destination, uses a deterministic predictor; it implements a narrower part of that proposal.

## Planning needs preferences as well as predictions

A perfect description of what can happen does not specify what should happen. The same model can support moving toward a cup, moving away from it, or remaining still. A goal cost tells the planner which consequences to prefer.

This separates learning dynamics from solving a particular task. LeWorldModel learns from observation–action trajectories without reward labels, then uses a goal image at planning time. “Reward-free training” therefore does not mean preference-free behavior. The planner still receives an objective.

It also does not mean action-free data. Knowing which action preceded a transition is essential to the particular action-conditioned learning problem. A video of another agent may support visual prediction without telling us which motor command our own agent should issue. Inferring actions from video is a further research problem.

## Hierarchies shorten the question

To visit a friend, one might first choose a route across a city, then a street crossing, then individual foot placements. Long-range plans use coarser descriptions and larger time steps. A hierarchical world model would predict at several abstraction levels, allowing high-level subgoals to constrain lower-level action plans.

If each low-level step has $k$ alternatives, enumerating $H$ steps requires $k^H$ sequences: multiply $k$ choices once for every step. A good hierarchy can reduce the effective search by reusing meaningful subplans. That is the motivation; there is no general theorem that an arbitrary learned hierarchy will do so. Bad abstractions can erase the constraints needed to make a high-level plan feasible.

<figure class="generated-plate" data-art="P4"><img src="assets/generated/infographics/hierarchy-4.png" alt="Nested views connect a route around a block, a street crossing and a foot placement."/><figcaption>A route selects a crossing; the crossing selects shorter movements. The three views illustrate temporal abstraction. The browser laboratory later uses a single planning scale.</figcaption></figure>

<!-- VISUAL: P4 -->

LeCun’s proposal also emphasizes memory. Moving one cup changes only a small portion of the world. A system that updates a persistent description of that cup may avoid reconstructing an entire scene description at every moment. Attention, taught later, provides one differentiable way to retrieve relevant stored information. A short frame history is a modest precursor, not a complete implementation of that idea.

## A first worked challenge

A learner predicts the next frame of a swinging arm. Its training videos always use a dark background. It succeeds on those videos and fails on a bright background. Which part of our story does that challenge?

<details class="derivation"><summary>Work through the diagnosis</summary>

It challenges generalization of perception and prediction, not the definition of self-supervision. The encoder may use background intensity as a shortcut, or its activations may respond poorly to the new brightness. We should hold arm state and action fixed while changing only the background, then compare embeddings and predicted transitions. A useful test examines both invariance to the change and retention of pose distinctions. Making every image map to the same vector would achieve perfect background invariance while destroying the task.

A second test swaps actions while retaining the same history. If predictions do not respond, the model may be ignoring action information. Finally, test new combinations of familiar poses and actions. Each intervention asks a different question; one aggregate prediction error cannot diagnose all three.

</details>

The rest of the book makes these questions quantitative. First we need to understand what a vector can preserve, what a distribution says about uncertainty, and how an error changes the function that produced it.
