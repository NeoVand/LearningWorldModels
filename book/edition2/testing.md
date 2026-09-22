# When does a cloud count as Gaussian?

<p class="lead">A finite sample never looks exactly like a smooth density. Before turning distribution matching into a training loss, we must understand how much mismatch sampling alone creates.</p>

JEPA needs a constraint on a collection of representations. Covariance is useful but incomplete: the circle example had the same covariance as a standard Gaussian. We now ask how a statistical test can distinguish a distributional mismatch from an ordinary fluctuation. This is a lesson in reasoning from samples, not a prescription to run a hypothesis test at every training update.

## A null model is a repeatable sampling story

A **null hypothesis** specifies the story against which we compare an observation. Here it is precise: draw $n$ independent values from the standard Gaussian $\mathcal N(0,1)$. Independence, mean zero, and variance one are all part of that story.

A **statistic** compresses the observed sample into a number. To use it as a test, we must know which values that statistic typically takes under the null. A large value means little without this comparison. A sample of four and a sample of four thousand fluctuate on different scales.

The null is not “the data look roughly bell-shaped.” It is a mathematical distribution plus a sampling protocol. If neighboring video frames are correlated, their statistic need not have the null distribution calibrated from independent draws.

## Compare accumulated probability rather than histogram bins

For a scalar variable, the cumulative distribution function is $F(x)=P(X\leq x)$. It records the probability to the left of $x$. For the standard Gaussian it is

$$\Phi(x)=\int_{-\infty}^{x}\frac{e^{-u^2/2}}{\sqrt{2\pi}}\,du.$$

For observations $x_1,\ldots,x_n$, the empirical version is $F_n(x)=n^{-1}\sum_i\mathbf1\{x_i\leq x\}$. The indicator is 1 when its condition holds and 0 otherwise. Thus $F_n(x)$ is simply the fraction of observed values at or below $x$. It rises by $1/n$ at each distinct sample, or by several such increments when samples tie.

Consider the largest vertical gap between these two cumulative curves:

$$D_n=\sup_x|F_n(x)-\Phi(x)|.$$

The supremum means the smallest upper bound over every real $x$; it includes values approached immediately before a jump. This is the Kolmogorov–Smirnov discrepancy for a fully specified standard-Gaussian reference. Its two CDFs let us draw the discrepancy directly. SIGReg uses a different distributional measurement, introduced in the next chapter.

Sort the samples as $x_{(1)}\leq\cdots\leq x_{(n)}$. First suppose the values are distinct. Immediately before the $i$th jump the empirical fraction is $(i-1)/n$; immediately after it is $i/n$. Between jumps the empirical curve is flat while $\Phi$ is monotone. The largest gap therefore occurs at one of those sides, giving the finite calculation

$$D_n=\max_i\left\{\frac in-\Phi(x_{(i)}),\ \Phi(x_{(i)})-\frac{i-1}{n}\right\}.$$

If sorted values tie from index $a$ through $b$, the real jump goes from $(a-1)/n$ to $b/n$. The same maximum formula still works: the largest right-side gap uses $i=b$ and the largest left-side gap uses $i=a$; intermediate tied indices cannot exceed those endpoints.

For samples $-1,+1$, use $\Phi(-1)\approx0.1587$ and $\Phi(1)\approx0.8413$. At the first point the two candidate gaps are $0.5-0.1587=0.3413$ and $0.1587-0=0.1587$. The second gives the same pair in reverse. Thus $D_2\approx0.3413$. That number is not yet a p-value.

<!-- VISUAL: T1 -->

## Calibrate by repeating the null experiment

Generate many independent samples of the same size $n$ from the null, and compute a discrepancy for each. Their histogram estimates the **null distribution of the statistic**. This differs from the Gaussian distribution of an individual sample value: the histogram now contains one discrepancy per whole dataset.

A 5% upper-tail threshold is a value exceeded in approximately 5% of these null experiments. Rejecting when an observed discrepancy exceeds that threshold controls the long-run false-alarm rate approximately at 5%, subject to simulation accuracy. It does not mean a rejected hypothesis has a 5% probability of being true.

For $R$ simulated discrepancies and an independently observed discrepancy $D_{\mathrm{obs}}$, a Monte Carlo upper-tail rank is

$$p_{\mathrm{MC}}=\frac{1+\#\{r:D_n^{(r)}\geq D_{\mathrm{obs}}\}}{R+1}.$$

Why add one? Under the null, the observed experiment and simulated experiments are exchangeable: any could occupy any rank among the $R+1$ results. With no ties, its upper-tail rank is uniform on $1,\ldots,R+1$. This formula reports that rank divided by $R+1$, never a false zero produced only by limited simulation. Counting ties with $\geq$ is conservative. It gives a valid Monte Carlo test under the specified independent null simulation, with discrete resolution $1/(R+1)$.

<!-- VISUAL: T2 -->

## Run a test, then change the amount of evidence

First predict what happens to ordinary null discrepancies as $n$ grows. Then compare a true standard-Gaussian sample, a Gaussian shifted by 0.4, and equally likely values at $-1$ and $+1$. The two-point population has the correct mean and variance but the wrong shape.

<div class="lab" id="normality-lab">
<div class="lab-head"><span class="eyebrow">Testing desk</span><h3>A discrepancy needs a reference</h3><p>Each histogram contains 511 simulated standard-Gaussian datasets. The observed sample and power experiment use separate random streams.</p></div>
<div class="controls"><label>Sample size <input data-value-format="power2" id="normality-size" type="range" min="4" max="8" step="1" value="5" aria-label="Sample size as a power of two"/></label></div>
<div class="controls normality-choices" role="group" aria-label="Observed sampling distribution"><button data-normality="normal" aria-pressed="true">Standard Gaussian</button><button data-normality="shifted" aria-pressed="false">Shifted mean</button><button data-normality="two-point" aria-pressed="false">Two points</button></div>
<canvas id="normality-canvas" aria-label="Histogram of simulated null discrepancies with an observed discrepancy and a five-percent threshold"></canvas>
<p id="normality-readout" class="readout"></p><p class="caption">Seeded Monte Carlo simulation, not neural-network training. The Gaussian CDF is evaluated numerically. The plotted threshold and power estimate have simulation error.</p>
</div>

Under the correct null, a small p-value is still possible. Approximately one in twenty independent null experiments can cross a 5% rejection threshold. Increasing sample size does not make false alarms impossible when the test keeps the same nominal level.

Under a fixed alternative, larger samples often make a departure easier to detect. **Power** is the probability of rejecting under that particular alternative. The desk estimates power for a mean shift of 0.4 using 128 fresh alternative datasets. That estimate is noisy: if 96 of 128 reject, the estimated power is 0.75, with a binomial standard error of approximately $\sqrt{0.75(0.25)/128}=0.038$. It is neither a guarantee for an individual sample nor a measure of practical importance.

## Where the simulated Gaussian samples come from

The simulation begins with seeded pseudorandom uniforms. The Gaussian integral taught us that a two-dimensional standard Gaussian has density proportional to $e^{-r^2/2}$ in radius, with area element $r\,dr\,d\alpha$. The angle is uniform, and integrating the radial density gives $P(R\leq r)=1-e^{-r^2/2}$ for $r\geq0$.

For a uniform $U$ in $(0,1)$, set $R=\sqrt{-2\log U}$. Indeed, $P(R\leq r)=P(U\geq e^{-r^2/2})=1-e^{-r^2/2}$. Choose an independent uniform angle $2\pi V$ and return $R\cos(2\pi V)$ as one Gaussian coordinate. This derives the sampler used in the desk from the density rather than assuming a mysterious source of normal numbers. Pseudorandom generation approximates the ideal sampling story; the fixed seeds make this teaching experiment reproducible.

## Fitting the null changes the question

Testing specifically $\mathcal N(0,1)$ differs from testing whether any Gaussian could have generated the data. If we estimate mean and variance from the same sample, the fitted Gaussian bends toward that sample and tends to reduce its discrepancy. The previous null calibration no longer applies unchanged. A simulation for the fitted procedure must re-estimate those parameters inside every simulated replicate.

SIGReg deliberately wants a standardized target. A cloud centered far from zero or shrunk almost to a point should not pass simply because we can fit a Gaussian with the same small scale. The center and scale are part of the representation preference.

<!-- VISUAL: T3 -->

## A training penalty is not a hypothesis-test verdict

A hypothesis test asks whether an untouched sample is unusual under a specified null procedure. A training penalty changes the encoder to make its sample outputs less discrepant. The data have now been adaptively chosen by optimization. A small training statistic cannot be interpreted using the untouched-sample p-value story.

With a continuous reference and distinct samples, the sorted formula for $D_n$ is piecewise differentiable. Its maximum often sends a gradient through just one extreme discrepancy, and the active sample can change abruptly. We instead want a smooth aggregate with contributions from all samples. This does not guarantee a nonzero gradient at every configuration. SIGReg will replace this illustrative statistic with characteristic-function measurements, then average their squared deviations. The ideas of finite-sample fluctuation and a fully specified target still apply.

<!-- VISUAL: T4 -->

## Check the conclusion before accepting it

A researcher reports $p=0.2$ on a batch of 16 embeddings and says, “There is an 80% chance our embeddings are Gaussian.” Identify the two mistakes. Then say what changes if the batch was selected after optimizing its test statistic.

<details class="derivation"><summary>Separate evidence, probability, and selection</summary>

The p-value is a tail probability computed under the null, not a probability assigned to the null. Also, failure to reject does not establish Gaussianity; a small sample may have little power against the departures that matter. If the embeddings were selected through optimization, the calibrated sampling story has changed, and the nominal p-value may no longer have its claimed false-alarm behavior.

A useful report gives the discrepancy, sample size, specified target, sampling procedure, and independent downstream evaluation. The next chapter builds the differentiable discrepancy itself. It will be a training tool whose statistical limitations we can now explain.

</details>
