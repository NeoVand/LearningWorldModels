# Before the move

<p class="lead">To act intelligently, we need some idea of what our actions will change. This book builds that idea into a working mathematical model.</p>

<figure class="plate"><img src="assets/generated/observe-represent-imagine.png" alt="A camera observes a robot arm; a violet abstraction represents it internally; several translucent future poses illustrate imagined consequences."/><figcaption>Observe, represent, imagine. The middle panel is a metaphor for learned coordinates, not a claim that an embedding resembles a physical skeleton. The future poses illustrate alternatives, not measured model predictions.</figcaption></figure>

Place a cup near the edge of a table. You do not need to watch it fall a thousand times before deciding to move it inward. You have learned something about objects, support, motion, and the consequences of your own actions. Much of that learning happened without somebody naming every pixel you saw.

There are several ideas hiding inside that ordinary decision. You observe only part of the world. You remember enough to interpret it. You distinguish the cup from the pattern on the tablecloth. You imagine a change. You prefer one outcome to another. Finally, you act and observe again.

A **world model** is a learned model of some aspect of how an environment changes. It need not simulate the entire universe. Here we care about a model that predicts changes in a learned representation of observations, optionally conditioned on actions. Its usefulness depends on which information that representation preserves and what we ask the model to do with it.

## The question that guides us

How can a machine learn useful internal descriptions from observations, and then use those descriptions to choose actions? That question connects the mathematics to the experiments throughout this book. Expand a derivation to follow the reasoning step by step; the proofs are also included when you print.

Our destination is [LeWorldModel, version 1](https://arxiv.org/pdf/2603.19312v1). Our starting point is first-year mathematics. Between them we must construct a chain of ideas: representations, self-supervision, prediction, collapse, distributional regularization, and planning.

<div class="note">

**A reading contract.** Every equation will say what its symbols mean, why it appears, and whether it is a definition, a deduction, an approximation, or a choice. When a result has assumptions, those assumptions are part of the result. The objective is for you to reconstruct the argument yourself.

</div>

## One world, two different descriptions

Our running experiment uses a small two-link mechanism. Its physical state includes joint angles and angular velocities. Its camera produces a tiny grayscale image. Two mechanisms at the same angles can look identical while moving in opposite directions. Their next images will differ. This is why a single picture can be insufficient for predicting the future.

The model receives images and actions. It is not handed the simulator's angles or velocities during representation learning. An **encoder** is a parameterized function that turns an image into a vector. An **embedding** is the resulting vector: a list of numbers that the model learns to use as a description.

$$\lat_t=f_\theta(\obs_t).$$

Here $\obs_t$ denotes the image at time $t$, $f$ the encoder's computation, and $\theta$ its adjustable parameters. The subscript is a time label, not multiplication. The vector $\lat_t$ is an internal description; it is not automatically a list of named physical quantities. Nothing in the word “embedding” promises that coordinate one is position or coordinate two is velocity.

<div class="legend"><span class="obs">observation</span><span class="lat">representation</span><span class="pred">prediction</span><span class="act">action</span><span class="loss">loss or cost</span></div>

A predictor uses representations and proposed actions to imagine what comes next. The teaching model uses two observations and their aligned actions:

$$\pred_{t+1}=g_\psi(\lat_{t-1},\lat_t,\act_{t-1},\act_t).$$

The action $\act_{t-1}$ explains the transition we have just observed; $\act_t$ is the action whose consequence we now want to predict. A hat means “predicted.” The predictor parameters $\psi$ are distinct from the encoder parameters $\theta$. This particular history length is an architectural choice, not a theorem that two images always reveal the full state.

## Learning without hand-written answers

In supervised learning, a person might label an image “cup.” In self-supervised learning, the data supplies a learning target: a hidden region, a related view, or a later observation. Calling the target self-supervised does not mean that there is no target. It means that we obtain it from the structure of the observations rather than an external label for every example.

Why not predict the next image directly? Sometimes that is appropriate. But a future camera frame may depend on tiny changes in reflections, textures, and lighting that contribute little to the decision. A representation can potentially retain what is useful while abstracting away some of that detail. The word “potentially” matters: the learning objective must make useful retention preferable to throwing everything away.

Suppose we compare our prediction to the encoder's description of the image that actually arrives:

$$\loss_{\mathrm{pred}}=\|\pred_{t+1}-f_\theta(\obs_{t+1})\|^2.$$

The double bars mean Euclidean length: square each coordinate difference, add the squares, and take a square root. Squaring that length leaves the sum of squared differences. A small loss means that the two descriptions agree. But the encoder itself chooses those descriptions. If it always returns the same vector, agreement becomes trivial. Understanding this loophole is the entrance to SIGReg.

<figure class="diagram" data-diagram="jepa"></figure>

## The larger LeCun picture

The attraction of a predictive representation is broader than fitting the next frame. A model can support internal rehearsal: consider possible actions, predict their consequences, score those consequences against a goal, and choose an action. New observations then correct the internal story.

<figure class="diagram" data-diagram="agent"></figure>

Read this diagram as a division of responsibilities. Perception creates a useful description of observations. The world model predicts consequences. A cost expresses what the agent prefers or must avoid. An actor selects actions using those predictions and preferences. Memory and history help when the present observation is ambiguous. A broader system may configure these components for different tasks and reason at different time scales.

This is an introductory interpretation of the research program associated with LeCun's [A Path Towards Autonomous Machine Intelligence](https://openreview.net/forum?id=BZ5a1r-kVsf). The small laboratory implements a limited perception–prediction–cost–planning loop; it is not the complete proposed architecture.

Abstraction and uncertainty are different. Ignoring the tablecloth may simplify a prediction. It does not tell us whether an unseen person will push the cup. A deterministic predictor can average incompatible futures. Richer latent-variable or probabilistic models address a different problem from preventing representational collapse. We will keep those questions separate.

## Read, predict, experiment

Begin with learning from observations, then build the geometry, probability, and optimization needed to understand the architectures. Follow the research lineage into transformers and the detailed SIGReg argument. Train the small model, derive the planner, and use those experiences to read LeWorldModel and its appendices. Finish with the worked capstone and the [paper-to-book reference map](#reference).

At each experiment, make a prediction before moving the control. Expand the worked derivations when you need the algebra; they are included in print. The contents menu is searchable, and the reference chapter provides return paths for symbols and concepts. If the opening equations are unfamiliar, treat them as a map of the destination: the following chapters reconstruct their ingredients before using them in full.

The early experiments compute exact small examples or numerical approximations. The learning laboratory actually changes neural-network weights. Its measurements describe your run. Those are different kinds of evidence, and the captions will tell you which you are looking at.
