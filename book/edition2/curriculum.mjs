// Reading order, prerequisite links, and learning outcomes share one source.
export const chapters = [
 ['opening','Begin with the world','The question',[], 'Explain why an image can omit information needed to predict.'],
 ['philosophy','Learning before labels','The question',['opening'], 'Distinguish a world model, a representation, and a preference.'],
 ['geometry','A world in coordinates','Mathematical language',['philosophy'], 'Encode a tiny image and compute a distance and a projection.'],
 ['probability','Prediction under uncertainty','Mathematical language',['geometry'], 'Compute an expectation and explain why squared error predicts a mean.'],
 ['clouds','The geometry of a cloud','Mathematical language',['geometry','probability'], 'Compute covariance, inspect principal directions, and explain why whitening is not Gaussianity.'],
 ['calculus','How a small change travels','Learning from errors',['geometry','clouds'], 'Trace a derivative through a scalar chain and a vector-valued map.'],
 ['learning','How errors change a model','Learning from errors',['calculus','probability'], 'Perform a parameter update and explain the separate roles of loss, optimizer, and regularizer.'],
 ['jepa','Agreement without collapse','A useful prediction task',['learning','clouds'], 'Construct collapse and explain what different anti-collapse methods constrain.'],
 ['testing','When does a cloud count as Gaussian?','Distributional regularization',['probability','clouds','jepa'], 'Calibrate a discrepancy and distinguish a statistical test from a training penalty.'],
 ['sigreg','A statistic for useful variation','Distributional regularization',['testing','calculus','jepa'], 'Derive the finite SIGReg objective and trace its gradient back to embeddings.'],
 ['implementation','From equations to a learner','A working world model',['sigreg','learning'], 'Match every array axis, reduction, and gradient path to executable code.'],
 ['laboratory','A world model you can train','A working world model',['implementation'], 'Train a model, compare collapse, and interpret held-out measurements.'],
 ['planning','From imagination to action','Acting and evaluating',['laboratory','calculus'], 'Derive the sample–score–refit planner and explain why it observes again.'],
 ['evaluation','What counts as understanding?','Acting and evaluating',['planning','testing','sigreg'], 'Distinguish representation, prediction, and control evidence.'],
 ['theory','What Gaussian geometry can promise','Research bridges',['evaluation','calculus','clouds','learning'], 'Reconstruct the Gaussian argument with its statistical assumptions and limits.'],
 ['transformers','Inside the vision transformer','Research bridges',['learning','planning','clouds'], 'Compute attention and explain masking and action conditioning.'],
 ['lineage','The papers as a conversation','Research bridges',['jepa','theory','transformers','planning'], 'Compare research systems by their targets, gradients, data, and evaluations.'],
 ['paper','Read LeWorldModel closely','The destination',['lineage','evaluation','theory','transformers'], 'Reconstruct the target paper and reconcile its formulas with the pinned implementation.'],
 ['capstone','Build, challenge, explain','The destination',['paper','laboratory'], 'Defend one complete learning-and-control experiment, including its failures.'],
 ['reference','Keep the whole argument in view','Reference',['capstone'], 'Return from a paper equation or unfamiliar symbol to the lesson that teaches it.'],
];
const seen=new Set();
for(const [id,,,needs] of chapters){for(const dependency of needs){if(!seen.has(dependency))throw new Error(`${id} precedes its prerequisite ${dependency}`);}seen.add(id);}
