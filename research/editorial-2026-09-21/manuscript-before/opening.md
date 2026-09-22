# Before the move

<p class="lead">To act intelligently, we need some idea of what our actions will change. We will build that idea into a model you can understand, train, and question.</p>

<figure class="plate"><img src="assets/generated/observe-represent-imagine.png" alt="A camera observes a robot arm, a violet abstraction represents it, and several translucent poses illustrate possible consequences."/><figcaption>Observe, represent, imagine. This is a conceptual illustration. The middle panel is not the geometry of a measured embedding, and the future poses are not model predictions.</figcaption></figure>

A cup rests near the edge of a table. You move it inward because you expect something different to happen if you leave it there. You do not need an exact movie of the future. You need a description that preserves the distinctions relevant to the decision: where the cup is, what supports it, and what your hand can change.

A **world model** is a learned model of some aspect of how an environment changes. In this book, it learns from images and actions, predicts changes in an internal description, and helps choose what to do next. Our destination is [LeWorldModel, version 1](https://arxiv.org/pdf/2603.19312v1). We will reach its equations after constructing the ideas they compress.

## One mechanism, three questions

Our running world is a small two-link robotic arm seen by a camera. First ask: **what can we know from an image?** A picture reveals position but may hide motion. Two arms can look identical now while moving in opposite directions.

Then ask: **what description should we learn?** Keeping every pixel preserves shadows and table texture along with the arm. Keeping too little may erase the joint configuration. A representation is useful only if it retains distinctions that later prediction or action requires.

Finally ask: **how can predictions choose an action?** We can imagine several commands, compare their predicted consequences with a goal, execute one command, and look again. The observation after an action may correct the model's expectation.

These questions stay with us throughout the book. Every new piece of mathematics will answer one of them, expose a failure, or let us test an answer.

## The route through the book

We start with LeCun's reason for learning from observations rather than relying entirely on human labels. Next we learn to encode an image as numbers, measure distances, describe uncertainty, and inspect a cloud of representations. Calculus then gives us a way to change a model from its errors.

With those tools, we construct a predictive learning objective and discover its loophole: two networks can agree by saying nothing. We develop distributional regularization, derive SIGReg, and train an actual small model. We then make it choose actions and learn how to judge its successes and failures.

Only after that complete working example do we study the harder Gaussian theory and transformer architecture. We return to the research lineage with enough knowledge to compare the methods, read the target paper in full, and complete a worked capstone.

## How to use a mathematical lesson

Before looking at a worked answer, try the small calculation or prediction. If a symbol is unfamiliar, stop at its definition and substitute numbers. A formula should become a calculation you can perform, not a sentence you recognize.

Core derivations are visible in the reading path. Exercise answers can be expanded after an attempt; all answers are included in print. The interactive desks ask you to predict a change before moving a control. Later, the learning laboratory really updates neural-network weights. Its curves are measurements of your run, so they may differ from the recorded examples.

Our starting point is basic algebra, elementary derivatives and integrals, and an introductory encounter with vectors and probability. We rebuild the specific tools we need, including partial derivatives, covariance, and normality tests. The reference chapter supplies a symbol guide and a map from the final paper back to its explanations.

## A first prediction

Imagine two camera frames that show the arm in exactly the same position. Is its next position necessarily the same in both cases?

<details class="derivation"><summary>Think about what the camera omitted</summary>

No. One arm may be moving clockwise and the other counterclockwise. A single picture can hide velocity. A second frame can provide evidence about that motion. A larger predictor cannot recover missing information simply because it has more parameters.

Keep that distinction between **missing information** and **an inadequate model** in mind. It will explain why we use observation histories, why a prediction can remain uncertain, and why low training error is not the whole story.

</details>
