# Widget audit · 22 September 2026

## Scope and method

The baseline review covered all **92 original registered teaching visuals** in `book/edition2/visuals/`, the six small canvas desks in `foundation-labs.js`, the `normality.js` experiment behind one of those desks, and the live training, control, future-choice, and forecast views in `ui.js`. I read each visual's initial state, controls, draw function, question, and caption. I inspected the 64-pixel build at 390 and 1440 CSS pixels for O1, B1, N2, P2, and the normality desk, and earlier light/dark desktop/mobile captures for additional figures. Automated visual checks can detect overflow and nonfinite values, but cannot decide whether a control teaches anything. The inventory below records the **starting state**; changes made in response are recorded above it. E8 was added during the redesign, bringing the current registered total to 93.

**Verdicts.** *Keep* means the visual directly answers its question and its control has a useful counterfactual. *Refine* means preserve the concept but change layout, scale, labeling, or one weak control. *Redesign* means preserve the learning objective but replace the interaction or visual structure. *Remove* means fold the useful content into nearby prose, a table, or a stronger visual already present.

## Findings that drove the redesign

1. **Stop shrinking plots into mobile thumbnails.** The grid keeps three to five 360-unit SVG plots in one row at 390px. N2's five activation curves become about 60px wide, and L6's four recorded trajectories about 78px wide. B1, D6, S4, C4, R5, and the three forecast panels have the same pattern to varying degrees. The lines technically fit, but axis labels and threshold crossings cannot be read. Keep comparisons synchronized, but show one full-width plot at a time on narrow screens with a compact plot selector or stack the plots vertically. L6 should retain a four-goal verdict strip and let the reader choose one full-width trajectory; local goals must continue to share a y-axis.

2. **B1 changes the scale of the very effect it asks readers to see.** Its density plot uses `ymax = max(1.1, density(0) × 1.15)`, so for narrow Gaussians the peak remains almost the same screen height as sigma changes. Fix a common density scale covering sigma's full range, or use a clearly labeled zoom inset while the main plot stays fixed. Keep the area and CDF linked to the same interval.

3. **Replace controls that only decorate a static answer.** P2's Stage slider adds a dot to one of five fully visible cards; I1's Sequence position slider changes only the printed selected-slice subscript while the displayed context and target remain fixed. For P2, show one concrete camera-to-action trace with a highlighted datum moving through modules, and have the reader predict the next datum before revealing it. For I1, highlight the actual `[time,batch,feature]` slice and the corresponding context/action/target wiring, or replace it with a fixed tensor diagram.

4. **Use the actual data relationship in evidence widgets.** E4 changes the display gap and a KL number but displays only the fixed input affinity matrix P; the changing output affinities Q are hidden, so the reader cannot explain the number. Show matched P and Q heatmaps or the top within/between affinities, with a shared legend. E6 stipulates a predictor's color penalty and position error instead of measuring the trained model. Keep it as an explicitly labeled experimental protocol, or connect it to a frozen checkpoint and show measured error. E7 combines a turning angle, expectile loss, and an ablation reminder in one figure; split the first two into focused examples and put the ablation reminder in prose.

5. **Keep axes honest in the theory and planning plots.** R5 fixes log-density at `[−15,1]` and score at `[−12,12]`, but sigma can be 0.3: at x=3, the true values are about −49.7 and −33.3. The curves silently clip. Use an x-range in standardized units with a common physical-scale inset, or mark clipping and expose numeric endpoints. R1 rescales both slope plots as the input spread shrinks, preserving within-state comparability but masking between-state amplification; add a fixed reference band or explicit scale switch. The standalone rollout-bound desk also rescales its y-axis with sensitivity, masking differences among large bounds; use fixed/log axes or paired reference values.

6. **Cut repeated card figures.** O3, I5, R6, V5, H3, P4, J1, and X1 are primarily static prose/equation cards. Several repeat nearby diagrams, generated plates, or paragraphs. Move their distinct claims into concise text, comparison tables, or the existing stronger visual. H1's nine cards are over a mobile screen tall even though its content is a three-method comparison; make a method × context/target/stability table. W1's six cards should become one tensor-shape flow with axes and reductions visible.

7. **Keep the real camera central and readable.** O1's headline says Observe → encode → imagine, yet the prominent Observe panel shows an idealized physical arm while the actual 64 × 64 sensor appears as a secondary inset. The eight bars are hand-picked functions of hidden state rather than the result of encoding those pixels; the caption does disclose this. Put the actual camera in the Observe position, move the simulator pose to a labeled explanatory reveal, and distinguish hand-made coordinates from learned ones at the point of use. In the live control desk the camera canvases are only 128px wide on desktop and 115px on mobile; allow an enlarged view so the increased sensor resolution is useful to readers.

8. **Reduce adjacent repetitions while preserving different questions.** The separate uncertainty desk and B4 both use outcomes −1/+1 and the optimal mean; B4 adds the more useful choice of a candidate prediction and its expected loss, so merge the desk's direct branch comparison into B4. T2 and the normality desk both simulate null discrepancies, but T2 uniquely shows one sample versus a distribution of sample-level statistics; keep that distinction and let the desk handle threshold/power. The geometry, rollout, and attention desks should retain their distinct questions only if their controls reveal something the registered visual does not.

The numerical issues in the normality desk and S7 were fixed first. The desk now fixes its horizontal axis by sample size across observed modes and marks an off-scale D. S7 now scales its gradient plot around zero; previously the first nonzero separation had a maximum gradient of 0.01546 on a ±5 axis, a subpixel response on mobile.

The redesign kept an interaction only where changing it exposes a useful counterfactual. L6 keeps all four outcomes visible while showing one full-width selectable trajectory. H1 compares methods across matched context, target, and training-boundary columns. V5 shows the two attention dataflows; H3 groups independent comparison axes; W1 traces tensor shapes and reductions; X1 connects its compact semantic-color legend to actual equations. The live control desk offers crisp magnification of its unchanged sensor pixels with explicit frame provenance.

### Resolution by teaching purpose

| Original issue | Resolution in the course |
|---|---|
| Decorative stage or index controls (P2, I1) | P2 now traces a concrete observation through representation, prediction, and action. I1 transposes an actual time × batch window and changes the selected context and target slices. |
| Small abstract prerequisite examples (G3, B3, C2) | G3 uses a row × column product table instead of an arbitrary cell slider. B3 physically filters the 100-case population down to the 26 positive reports and changes the denominator in view. C2 uses one closed centered-vector chain to derive the $B-1$ rank limit. |
| Static card walls (O3, P4, I5, J1, H1, H3, V5, W1, X1, R6, T4) | Recast as connected paths, comparisons, tensor flows, assumption chains, or compact equation keys. P4 reveals a subgoal tree; I5 follows checkpoint state; J1 makes pixel and latent targets converge at the loss; T4 separates calibration, power, and optimization. |
| Unreadable small plots (B1, B7, C4, D6, L6, N2, R5, S4, S5) | Mobile layouts now stack or enlarge the relevant plots, retain shared axes where comparison depends on them, and expose a full-width selected trajectory in L6. Layout verification checks minimum plot width at 390 CSS pixels. |
| Misleading probability and curve scales (B1, B7, S7, R1, R5, normality desk, rollout desk) | B1 uses a common density scale; B7 keeps 210-trial endpoints within its axes; S7 exposes the near-zero gradient; R1 adds a fixed slope reference; R5 fits the score and log-density endpoints; the normality desk marks an off-scale statistic; the rollout desk uses a fixed log-spaced scale with a visible reference. |
| Missing explanatory relationships (N4, E4, E6, E7) | N4 makes the forward circuit and backward chain factors visible. E4 shows fixed input versus changing output pair mass; E6 is an explicit matched-intervention protocol rather than a made-up measured error; E7 separates circular angle error, and new E8 accompanies the expectile derivation. |
| Overloaded opening and planning diagrams (O1, P3, A1, A5) | O1 puts the real sensor frame first and labels the hand-built coordinates. P3 distinguishes pose from surface. A1 shows the learning and planning loops together. A5 illustrates two distinct physical/latent failure modes without a decorative velocity slider. |
| Small or mismatched live views (camera, future choice, forecast, control) | Current and goal frames plus all held-out future-choice thumbnails can be inspected at enlarged pixel-perfect scale with provenance. Forecasts overlay actual and learned arms at a common origin and use full-width panels on phones. The live controller now plots action-zero and per-action physical goal error beside the arm, with a fixed 0.15-radian success threshold. |
| Duplicate or underexplained desks | The duplicate uncertainty desk was folded into B4; the attention desk exposes temperature and weighted output; the rollout desk reports values against its fixed reference. |
| Incomplete experiment context (K2) | The live report and JSON export identify the selected goal, model checkpoint, control-run checkpoint, and control error history. Changing goals resets the run history. |

The table records concrete fixes, not a claim that all visuals are equally strong. The inventory still lists lower-priority refinements worth revisiting: G5's rank examples, T2's sampling labels, S3's finite-batch noise, S6's pair-kernel calculation, V1's patch selection, V4's residual conditioning, and W3's protocol summary. None currently has a misleading control or a measured layout failure in the automated sweep, but a further reader study could improve their teaching value.

### Verification and remaining judgment calls

The redesigned build has 93 registered figures. The browser sweep exercised 186 control endpoints across 1440px and 390px, light and dark, with no page errors, nonfinite drawing values, body overflow, clipped math, or label overlap. Focused interaction checks covered the 210-trial B7 endpoint, the camera inspector and held-out thumbnails, the forecast overlay, the rollout bound at both scale extremes, the B3 filter, and the live control trace's goal/checkpoint resets. Print layout checks found no stretched SVGs or clipped formulas. A 232-page PDF was regenerated from the same course source; representative pages across the opening, probability, calculus, SIGReg, planning, and evaluation were rendered and inspected.

The unresolved question is chiefly pedagogical, not a known rendering defect: an actual beginner reader study may reveal steps where the surrounding prose needs another example, or where a static figure should become an exercise. The inventory makes those lower-priority candidates explicit instead of treating the absence of a technical error as proof of teaching quality.

## Inventory of the 92 registered visuals

The “control intent” column states what the reader is supposed to learn by changing controls, rather than merely listing input names. `Static` means there is no control.

| ID | Title | Control intent | Verdict |
|---|---|---|---|
| O1 | Observe → encode → imagine | Scrub the pose and compare proposed commands with simulated futures. | Refine |
| O2 | The picture hides the velocity | Reveal earlier frames, then compare futures from an identical image. | Keep |
| O3 | Three questions that keep returning | Static roadmap of seeing, learning, acting. | Remove |
| P1 | The object continues; the image loses it | Scrub a ball behind a screen to separate state from observation. | Keep |
| P2 | Follow one decision through the proposed agent | Select a stage, currently only adding a dot to a card. | Redesign |
| P3 | Keep a distinction; ignore a distraction | Change surface and elbow independently to test invariance. | Refine |
| P4 | A subgoal connects two time scales | Static coarse-to-fine examples beside an existing plate. | Remove |
| G1 | Four pixels, two coordinates | Swap bright pixels; inspect flattening and a lossy encoding. | Refine |
| G2 | A matrix moves every point by the same rule | Switch linear maps and follow basis vectors. | Keep |
| G3 | The order changes the shape | Select an outer-product entry to inspect dimension order. | Refine |
| G4 | A shadow with a sign | Move a vector and direction to make signed projection visible. | Keep |
| G5 | A square, a line, a point | Static comparison of full, rank-one, and zero maps. | Refine |
| B1 | Height is not probability | Narrow density and move an integration boundary. | Redesign |
| B2 | A mean that stays put while spread changes | Move symmetric mass and distance; compare mean and variance. | Keep |
| B3 | A positive report filters the population | Filter 100 cases to see the conditional denominator. | Refine |
| B4 | The least-squares answer can be an impossible future | Change outcome probability and guess a loss-minimizing prediction. | Keep |
| B5 | A one-dimensional integral becomes an area | Static annulus explanation of Gaussian normalization. | Keep |
| B6 | Uncorrelated does not mean independent | Select distributions and conditional slices. | Keep |
| B7 | What is being repeated? | Vary within-experiment trials and seed; currently shows unrelated model cards. | Redesign |
| C1 | Covariance is an average of signed products | Move one point and inspect centered products. | Keep |
| C2 | The last centered row is already determined | Static sample-rank comparisons. | Refine |
| C3 | Whitening changes scale along principal directions | Step through rotation, rescaling, and rotation back. | Keep |
| C4 | Identity covariance does not specify a shape | Resample three equal-covariance shapes. | Refine |
| D1 | Shrink the step; keep the ratio | Move base point and step to compare secant and tangent. | Keep |
| D2 | Follow the slope across a landscape | Click a start, step/play descent, then test step size. | Keep |
| D3 | Multiply along paths; add across paths | Vary input/bias; currently recomputes card values without a path graph. | Redesign |
| D4 | The Jacobian is a local map | Move base point and neighborhood to compare exact and linear maps. | Keep |
| D5 | A local approximation has a neighborhood | Widen the interval and compare approximation errors. | Keep |
| D6 | Variance as a function of direction | Rotate a direction across variance and derivative plots. | Redesign |
| N1 | One neuron: follow a number through the circuit | Change activation/weights and probe a linked circuit and curve. | Keep |
| N2 | Activation and local sensitivity | Move one probe through five activation/derivative plots. | Redesign |
| N3 | Build a curve from individual neurons | Train a small network; change width, nonlinearity, and target. | Keep |
| N4 | Read a gradient as three local factors | Change weight/input to recompute chain-rule factors. | Redesign |
| N5 | Three optimizers, one starting point | Run three actual update rules on matched landscapes. | Keep |
| N6 | The fit alone leaves a choice | Change curvature and penalty strength in an underdetermined fit. | Refine |
| N7 | Normalize across features—or across examples? | Change example B and compare normalization axes. | Keep |
| J1 | Two targets ask for different kinds of agreement | Static pixel-versus-latent equations beside a generated plate. | Remove |
| J2 | Both uses of shared weights contribute | Stop target gradients while retaining forward values. | Keep |
| J3 | Agreement can improve by forgetting | Shrink all or one representation direction. | Keep |
| J4 | Moment constraints change different aspects of a cloud | Select shape/scale and compare moment adjustments. | Refine |
| J5 | The action belongs between the frames | Toggle correct versus shifted action alignment. | Keep |
| T1 | The empirical CDF jumps at observations | Add observations, including a tie, to a step CDF. | Keep |
| T2 | Each sample contributes one statistic | Change sample size/distribution to contrast data and null statistics. | Refine |
| T3 | Fitting the reference changes the test | Shift/resample a set; compare fixed versus fitted reference. | Keep |
| T4 | Three questions, three experiments | Static testing, power, and optimization comparison. | Redesign |
| S1 | Turn each sample into an arrow | Change frequency/sample and inspect a complex average. | Keep |
| S2 | Space and frequency tell different stories | Shift and scale a Gaussian in density and frequency space. | Keep |
| S3 | A correct population still gives a noisy batch | Increase batch size and resample finite discrepancy. | Refine |
| S4 | The axes can hide dependence | Rotate projection to expose hidden non-Gaussianity. | Refine |
| S5 | The window and the grid solve different problems | Change integration cutoff and knot count separately. | Refine |
| S6 | Expand the square into pairs | Static pair-kernel check against quadrature. | Refine |
| S7 | A differentiable penalty can be stationary at collapse | Separate samples from zero and compare analytic/finite gradients. | Keep |
| S8 | The complete measurement, without hidden steps | Static projection-to-frequency-to-penalty flow. | Refine |
| I1 | A window keeps its axes through the graph | Select time slice; context/target wiring remains unchanged. | Redesign |
| I2 | Average before squaring | Rotate a second phasor to reveal cancellation. | Keep |
| I3 | Trace a two-by-two batch | Select operation/direction and trace numbers into source lines. | Keep |
| I4 | A split can leak a frame without copying a window | Toggle random windows versus whole-episode split. | Keep |
| I5 | A checkpoint is more than weights | Static list of state needed to resume. | Remove |
| L6 | Keep the failed trajectories in view | Change recorded seed; inspect four goal-error histories. | Redesign |
| A1 | The graph stays; the movable quantities change | Toggle learning versus planning variables. | Refine |
| A2 | Search, keep, refit, repeat | Step deterministic CEM iterations and inspect elite updates. | Keep |
| A3 | One good step does not guarantee a good rollout | Extend horizon with fresh versus fed-back inputs. | Keep |
| A4 | A long plan can be spent one action at a time | Change planned horizon and executed prefix. | Refine |
| A5 | A cheap latent move can be physically wrong | Change representation scale and arrival velocity in separate examples. | Redesign |
| E1 | A probe measures accessibility to a chosen decoder | Switch invertible encodings and compare decoder access. | Keep |
| E2 | Rotation renames coordinates | Rotate data while checking distance and sampled score. | Refine |
| E3 | An angle lives on a circle | Cross the ±π seam and compare naive versus wrapped error. | Keep |
| E4 | Neighbor probabilities are not ruler distances | Change display gap and watch KL without showing changing Q. | Redesign |
| E5 | Turn compatibility into a probability only after normalization | Change temperature with fixed energy and normalized density. | Keep |
| E6 | Change appearance or break continuity? | Select a stipulated intervention/error response. | Redesign |
| E7 | Geometry, asymmetric loss, and experimental controls | Move two unrelated diagnostic controls beside an ablation card. | Redesign |
| R1 | Small input spread makes a slope noisy | Shrink design spread and resample slope estimates. | Refine |
| R2 | A covariance preference needs a task assumption | Reallocate variance and change ridge penalty. | Keep |
| R3 | A local prediction is a weighted average | Move query/bandwidth, including a no-support case. | Keep |
| R4 | Symmetry cancels only with balanced density | Change density tilt and kernel half-width. | Keep |
| R5 | Density, log density, and score are different functions | Narrow a Gaussian across three clipped plots. | Redesign |
| R6 | Follow the assumptions all the way to the claim | Static six-card assumption chain and caveat. | Remove |
| V1 | From image patches to a token sequence | Select a sensor patch and inspect flattening/position. | Refine |
| V2 | One query creates one row of weights | Select query token and recompute attention weights/output. | Keep |
| V3 | Mask before the maximum and exponential | Change a future token; earlier causal rows should stay fixed. | Keep |
| V4 | Normalization, conditioning, and an identity path | Change action signal and residual gate. | Refine |
| V5 | Heads share an input, not their projection matrices | Static six-card attention-head/decoder description. | Remove |
| H1 | What is hidden, and what supplies the target? | Static nine-card method comparison. | Redesign |
| H2 | Frozen features and joint learning are different boundaries | Static three-method gradient-boundary comparison. | Refine |
| H3 | Choose the comparison axis before choosing a winner | Static five-card taxonomy beside the generated atlas. | Remove |
| W1 | The research model’s dimensions fit together | Static six-card tensor-size narrative. | Redesign |
| W2 | The paper spends actions in blocks | Static source/target and action-block count. | Refine |
| W3 | Reported results, with the exceptions visible | Static selected paper outcomes and protocol notes. | Refine |
| K1 | Label the information boundary yourself | Reveal a worked answer after self-assignment. | Keep |
| K2 | An experiment report starts at update zero | Live report card and export linked to model state. | Keep |
| X1 | One role, one color | Static six-card symbol legend. | Remove |
| X2 | Trace each paper equation back to its tools | Static linked prerequisite map. | Refine |

## Standalone desks and live laboratory

| View | Verdict | Concrete next step |
|---|---|---|
| Geometry rotation desk | Keep | The rotation angle changes the same vector under a fixed coordinate system; add angle ticks and keep equal x/y units. |
| Uncertainty desk | Remove | Its two-outcome mean/loss lesson is already handled more actively by B4. Merge its direct branch comparison into B4 if that numeric explanation is needed. |
| Ridge desk | Keep | Coefficient shrinkage responds to the penalty and connects the formula to a visible fit. Label the unpenalized reference consistently. |
| Rollout bound desk | Refine | Its `max(1, ...values)` rescales the y-axis as sensitivity changes, and the canvas has no numeric y ticks. Add a fixed or logarithmic reference scale and endpoint values so growth is comparable. |
| Attention desk | Refine | Keep the live score-to-weight calculation, but display the temperature and weighted-output value next to the bars; otherwise the normalization is hard to read at a glance. |
| Normality desk | Keep | Its null histogram and shifted trials show sample-size effects. The per-sample-size horizontal axis and off-scale observed marker were fixed during this audit; retain the fixed axis when switching modes. |
| Live training and control | Refine | The model is actually trained, but the 64 × 64 camera is displayed at 128px desktop/115px mobile. Add an enlarge control and show goal error across control steps beside the arm, so success is traceable rather than judged only from one pose. |
| Future-choice evaluation | Refine | The view renders only `probe.examples.slice(0, 2)` while the score summarizes more examples. Show the evaluation count and let readers browse all examples or deliberately select representative successes and failures. |
| Forecast evaluation | Refine | Three small plots become hard to read on mobile. Within each plot, actual and predicted poses sit at separate x-centers (90 and 270), so displacement is hard to compare; offer a synchronized overlay or direct error graphic as well as the side-by-side states. |
| K2 experiment report | Refine | Include the active goal and checkpoint with the exported control summary, since the control history resets when the goal changes. |

The inventory and verdicts above describe the audited baseline. During this pass, L6, H1, V5, H3, W1, and X1 were replaced with comparison or dataflow views; the live and held-out camera frames gained a labeled 64 × 64 pixel inspector, and the three forecasts now overlay actual and learned poses at one origin with a shared step control. Remaining recommendations still need a separate design pass.
