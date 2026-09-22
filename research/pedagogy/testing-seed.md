## A normality test is a calibrated decision procedure

A hypothesis test starts with a null model, such as independent standard Gaussian samples. It chooses a statistic that tends to be unusual when the null fails, then calibrates how unusual a measured value is under the null. A p-value is a tail probability under that null procedure. It is not the probability that the null is true.

If the Gaussian mean and variance are fitted from the same data, the null distribution of many statistics changes. Testing a fully specified $\mathcal N(0,1)$ target is different from testing membership in the family of all Gaussians. SIGReg specifically wants the standardized target, because the desired center and scale are part of its objective.

A differentiable discrepancy can be minimized during training without ever computing a p-value. That is how SIGReg uses a normality-test statistic. Samples are then adaptively chosen by the encoder to lower it, and projected samples are not an untouched independent test set. Quoting a textbook test threshold afterward would require a fresh calibration argument.

“Failure to reject” also does not establish equality of distributions. A small sample or poorly chosen statistic can have little power to detect a difference. Conversely, a large sample can detect a small practically irrelevant deviation. We care about both the distributional constraint and downstream behavior.

