# World models, from first principles

<p class="course-kicker">A complete learning path · mathematics, neural networks, prediction and action</p>

<p class="lead">How can a machine learn what will happen next—and use that knowledge to decide what to do? This course builds the answer from basic mathematics to Yann LeCun’s joint-embedding predictive architecture, or JEPA, and the research paper <em>LeWorldModel</em> (LeWM).</p>

<div class="course-promise"><div><strong>Start with</strong><p>Basic algebra, a first encounter with vectors and probability, and the idea of a derivative. No deep-learning background is needed.</p></div><div><strong>Build the missing tools</strong><p>Embeddings, covariance, gradients, neurons, regularization, normality tests, characteristic functions and attention—each introduced before we need it.</p></div><div><strong>Finish by doing</strong><p>Derive SIGReg, train a small world model in your browser, plan through its predictions, and read LeWorldModel’s equations and experiments critically.</p></div></div>

A **world model** learns some aspect of how an environment changes. Here, a camera observes a robotic arm; a neural network turns its images into a compact description; another network predicts how that description will change after an action. A planner can then compare possible actions before moving the real arm.

We will build every part of that loop. The course explains the mathematical prerequisites along the way, with worked calculations, derivations and experiments. The browser model is small enough to inspect; the final chapters show how the same ideas lead to the larger system in [LeWorldModel, version 1](https://arxiv.org/pdf/2603.19312v1).

## One mechanism, three questions

Our running world is a small two-link robotic arm seen by a camera. First ask: **what can we know from an image?** A picture reveals position but may hide motion. Two arms can look identical now while moving in opposite directions.

Then ask: **what description should we learn?** Keeping every pixel preserves shadows and table texture along with the arm. Keeping too little may erase the joint configuration. A representation is useful only if it retains distinctions that later prediction or action requires.

Finally ask: **how can predictions choose an action?** We can imagine several commands, compare their predicted consequences with a goal, execute one command, and look again. The observation after an action may correct the model’s expectation.

These questions stay with us throughout the book. Every new piece of mathematics will answer one of them, expose a failure, or let us test an answer.

<!-- VISUAL: O1 -->

## The route through the book

We start with LeCun’s reason for learning from observations rather than relying entirely on human labels. Next we learn to encode an image as numbers, measure distances, describe uncertainty, and inspect a cloud of representations. Calculus then gives us a way to change a model from its errors.

With those tools, we construct a predictive learning objective and discover its loophole: two networks can agree by saying nothing. We develop distributional regularization, derive SIGReg, and train an actual small model. We then make it choose actions and learn how to judge its successes and failures.

Only after that complete working example do we study the harder Gaussian theory and transformer architecture. We return to the research lineage with enough knowledge to compare the methods, read the target paper in full, and complete a worked capstone.

<!-- VISUAL: O3 -->

## How to use a mathematical lesson

Before looking at a worked answer, try the small calculation or prediction. If a symbol is unfamiliar, stop at its definition and substitute numbers. A formula should become a calculation you can perform, not a sentence you recognize.

Core derivations are visible in the reading path. Exercise answers can be expanded after an attempt; all answers are included in print. The interactive desks ask you to predict a change before moving a control. Later, the learning laboratory really updates neural-network weights. Its curves are measurements of your run, so they may differ from the recorded examples.

Our starting point is basic algebra, elementary derivatives and integrals, and an introductory encounter with vectors and probability. We rebuild the specific tools we need, including partial derivatives, covariance, and normality tests. The reference chapter supplies a symbol guide and a map from the final paper back to its explanations.

## A first prediction

<!-- VISUAL: O2 -->

Imagine two camera frames that show the arm in exactly the same position. Is its next position necessarily the same in both cases?

<details class="derivation"><summary>Think about what the camera omitted</summary>

No. One arm may be moving clockwise and the other counterclockwise. A single picture can hide velocity. A second frame can provide evidence about that motion. A larger predictor cannot recover missing information simply because it has more parameters.

Keep that distinction between **missing information** and **an inadequate model** in mind. It will explain why we use observation histories, why a prediction can remain uncertain, and why low training error is not the whole story.

</details>
