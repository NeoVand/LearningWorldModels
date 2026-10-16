# Before the Move — a close reading

A full editorial, mathematical and craft review of the HTML book, made on 2026-09-22
against the build of `world-models.html` produced at 01:51 (commit `ec5eded` plus the
uncommitted layout revision).

---

## The short version

I read all twenty chapters, checked every worked number I could check, verified the
book's claims about *LeWorldModel* against the paper text and the pinned repository,
ran the browser laboratory to 5,454 real updates, and inspected the rendered page in
both themes at desktop and phone widths.

**The mathematics is in excellent shape.** I re-derived roughly sixty worked
calculations — Gaussian normalisation, Cauchy–Schwarz, the spectral theorem, the
characteristic-function ODE, the pairwise-distance closed form, the Adam trace, the
Nadaraya–Watson bias, the Fisher-information bound, the expectile balance, the CEM
maximum-likelihood refit — and found **no errors**. The finite SIGReg formula, its
gradient, the NumPy reference and the browser implementation all agree with each other
and with `research/lewm-pinned/module.py`. The parameter count 152,464 is exact. The
laboratory reproduces the recorded seed-17 numbers (I measured ratio 0.120 and spread
0.9158 against the book's 0.116 and 0.903). That is a rare level of care and it should
be said plainly before anything else.

**The remaining problems are not in the reasoning; they are in the presentation of the
reasoning.** Three of them are systemic, and one of those is doing real damage:

1. **The semantic colour system is applied to symbols that have no semantics** — 177
   amber `u`, 54 amber `λ`, 42 amber `h`. Amber is declared to mean *action*. In the
   product-rule proof a reader sees an amber function `u`, a violet step size `h` and a
   blue variable `x`, none of which are actions, representations or observations. The
   book's own reference chapter promises the opposite ("Neutral mathematical parameters
   remain neutral"). This is the single highest-value fix.
2. **Fifty-five display equations overflow their container on a phone**, some at nearly
   twice the available width, and are cut mid-formula with a scrollbar underneath.
3. **Forty-seven figures carry axis ticks like `-4.3`, `2.8`, `6.3`** because the shared
   plot helper divides the range into equal parts instead of choosing round numbers.

Plus a handful of genuine, small, fixable defects: one misattributed claim about the
paper, one symbol reused for two different things inside three paragraphs, one symbol
string (`ΔL`) that means two different things twenty lines apart, an abbreviation
(`LeWM`) used nine chapters before it is defined, and 202 straight apostrophes in a book
whose double quotes are all properly curly.

Nothing here requires re-thinking the book. It is seven focused passes.

---

## How to use this document

Each phase is independent and ordered by *value per hour*. Phase 1 is correctness and
should ship on its own. Phases 2–4 are the ones that move the book from "very good" to
the standard the project is aiming at. Phases 5–7 are polish and can be taken
opportunistically.

Every finding gives: where it is, what a reader experiences, and what to change.

---

# Phase 1 — Correctness

*Five items. Roughly two hours. Ship separately; these are the only things in the book I
believe to be wrong.*

### 1.1 The "18% higher" claim is attributed to a figure caption; it is body text

[paper.md:95](book/edition2/paper.md#L95)

> "A figure caption says "18% higher" on PushT for 96 versus 78."

`18%` occurs exactly twice in the paper (`research/leworldmodel-v1.txt` lines 420 and
428) and both are in the body of §4.2. No figure caption contains it. The observation
itself — 18 percentage points versus a 23.1% relative increase — is correct and worth
making; only the attribution is wrong. The comparison is also specifically against
**PLDM** (Table 5: LeWM 96.0 ± 2.83, PLDM 78.0 ± 5.0), which the sentence leaves
implicit.

**Fix.** "Section 4.2 reports an "18% higher" success rate on PushT, comparing LeWM's
96% with PLDM's 78% (Table 5)."

This matters more than its size suggests: a chapter whose whole purpose is teaching
careful citation should cite carefully.

### 1.2 `A` means both "advantage" and "the data action" in the same passage

[evaluation.md:163](book/edition2/evaluation.md#L163)

Three paragraphs earlier the chapter defines `A = r + γV(s′,g) − V(s,g)` as the
advantage, and writes the objective as `E[e^{βA(s,a,g)} ‖π(s,g) − a‖²]` with `a` for the
action. Then:

> "differentiate with respect to a constant predicted action `c`: `2E[w(c − A_data)] = 0`
> … the optimum is `c = E[w A_data]/E[w]`."

Here `A_data` must mean the *action* in the data, i.e. the `a` of the line above. A
reader tracking the advantage will read this as regressing onto the advantage, which is
a different and wrong statement.

**Fix.** Use `a_{\mathrm{data}}` (or just `a`). One-character change, removes a real
misreading.

### 1.3 `ΔL` means two different things in one chapter

[calculus.md:99–101](book/edition2/calculus.md#L99) versus
[calculus.md:123](book/edition2/calculus.md#L123)

```
Δ L ≈ (∇_y L)ᵀ Δ y            ← "the change in the loss"
Δ L = Σ_j ∂_j² L              ← "the Laplacian of the loss"
```

The same two rendered glyphs, twenty lines apart, in the chapter that introduces both
notations. The Laplacian then reappears in [theory.md:89](book/edition2/theory.md#L89)
as `Δa`, where it is the only meaning — so the collision is local and easy to remove.

**Fix.** Either write the Laplacian as `∇²L` throughout, or introduce it on a neutral
letter (`Δa = Σ_j ∂_j²a`) and say explicitly that `Δ` before a *function name* means a
second-derivative sum while `Δ` before a *variable* means a small change. I would take
`∇²`; the book already uses `∇` heavily and `∇²` costs nothing.

### 1.4 `λ` and `r` each carry two meanings inside the implementation chapter

[implementation.md:48](book/edition2/implementation.md#L48) sets `L = L_pred + λR` with
`λ = 0.01`. Sixty lines later,
[implementation.md:108–112](book/edition2/implementation.md#L108) writes "For covariance
eigenvalues `λ_j ≥ 0`". The reference chapter's symbol table lists `λ` only as the
regulariser coefficient and warns it is "Not weight decay or Gaussian window width" —
without mentioning that it is also every eigenvalue in the book (`clouds`, `calculus`,
`theory`, `implementation`).

Same chapter, `r` is the time-position index in `R = ⅓Σ_{r=1}^{3}`, the count of positive
eigenvalues in "if exactly `r` eigenvalues are equal", and the subscript in `r_eff`.

**Fix.** Two options, both cheap:
- Use `ρ_j` for eigenvalues in `implementation.md` (the theory chapter already uses `ρ`
  for the eigenvalues of `G`, so this also improves cross-chapter consistency), and `s`
  or `t` for the time-position index.
- Add both collisions to the symbol table's "Important distinction" column. The table is
  already the book's promise that notation has been audited; it should carry the hard
  cases, not only the easy ones.

### 1.5 `LeWM` is used from chapter 7 and never defined

First occurrences: [learning.md:123](book/edition2/learning.md#L123) and
[jepa.md:31](book/edition2/jepa.md#L31). The full name `LeWorldModel` is introduced
properly in `lineage.md` (chapter 17) and `paper.md` (chapter 18). The abbreviation
itself — which comes from the paper's own "LeWorldModel (LeWM)" — is never expanded
anywhere in the book. Twenty-six uses across nine chapters.

Two smaller siblings:
- **`MLP`** is first used in [implementation.md:26](book/edition2/implementation.md#L26)
  and only expanded in `laboratory.md`, one chapter later. For a book that opens with
  "No deep-learning background is needed," that ordering is backwards.
- **`MSE`** is first used in `implementation.md` and "Mean squared error" first written
  out in `evaluation.md`, three chapters later; the two are never explicitly linked.
- **`EMA`** appears only in the `lineage.md` comparison table, having never been tied to
  the "exponential moving average" defined in `jepa.md`.

**Fix.** Expand on first use, once each. In `opening.md`, where `LeWorldModel` is
already named, add "(LeWM)".

---

# Phase 2 — The notation colour system

*The largest systemic issue. Half a day. Everything else in the book is more careful
than this.*

## What is promised

`jepa.md` prints a legend: **observation / representation / prediction / action / loss or
cost**. `reference.md` restates it and adds a guarantee:

> "Neutral mathematical parameters remain neutral when coloring would imply a semantic
> role they do not have."

## What is delivered

I extracted every coloured token in the rendered page. Counts across the whole book:

| Token | Colour role | Count | What it actually means |
|---|---|---:|---|
| `u` | **action** | 177 | unit direction, eigenvector, a function in the product rule, kernel integration variable |
| `h` | representation | 107 | hidden activation *and* the step size `h` in `f(x+h)` |
| `h` | **action** | 42 | the kernel **bandwidth** in `theory.md` |
| `λ` | **action** | 54 | eigenvalues and the ridge/SIGReg coefficient |
| `ω` | **action** | 113 | characteristic-function frequency |
| `Q`,`K`,`V` | action / obs / lat | 25 | attention queries, keys, values |
| `p` | observation | 72 | a probability density |
| `3` | **action** | 1 | a literal digit, used as a highlight |

The mechanism is in [notation.mjs](book/edition2/notation.mjs): a `base` map assigns a
role to single letters globally, and a `scoped` map overrides per chapter. The scoped
entries are not semantic — `theory: { p: "obs", m: "pred", h: "act" }` and
`transformers: { Q: "act", K: "obs", V: "lat" }` are simply "give each letter its own
hue". That is a legitimate design idea, but it is a *different* idea from the one the
legend states, and the two are running at the same time.

## Why it hurts

Here is the worst case, `calculus.md`, the product rule, as a phone reader sees it:

> (**u**v)(**x**+**h**) − (**u**v)(**x**) = **u**(**x**+**h**)[v(**x**+…

`u` is amber (action), `x` is blue (observation), `h` is violet (representation), `v` is
black. None of that is true. `h` here is the step size that is about to go to zero. A
beginner — the declared audience — is being told, in the book's own colour language,
that the step size is a learned representation. And the asymmetry between amber `u` and
neutral `v`, two interchangeable functions, invents a distinction that does not exist.

The same pattern recurs wherever the book does pure mathematics: eigenvalues and
eigenvectors in `clouds` are coloured as actions; the projection direction and the
Cauchy–Schwarz proof in `geometry` are coloured as actions; the kernel bandwidth in
`theory` is coloured as an action forty-two times.

## Recommended fix

Decide what the colours are for, then make the code do only that.

**My recommendation: colour only the macro-declared quantities, and nothing else.**

1. Delete the `base` and `scoped` single-letter maps from `notation.mjs` and delete
   `semanticLatex`'s token walk. Keep the explicit macros (`\obs`, `\lat`, `\pred`,
   `\act`, `\loss`, `\reg`, `\Z`, `\U`, `\uvec`, `\proj`, `\cf`, `\ecf`, `\target`,
   `\freq`, `\disc`, `\stat`). Those are authored deliberately and are semantically
   correct.
2. Then go through the manuscript and *use the macros where the meaning is real*. Today
   `jepa.md` declares the legend and then writes plain `a_t` and `\hat z` in the
   equations right below it — so the action symbol in the chapter that introduces action
   conditioning renders in black while the eigenvalues in chapter 5 render amber. That
   is exactly backwards, and it is the strongest argument for this direction.
3. For the genuinely useful disambiguation cases (`Q`/`K`/`V`, the SIGReg frequency
   `ω`), introduce a **separate neutral palette** — two or three desaturated hues with a
   local legend — so a reader is never asked to decode `ω` as "action".
4. Fix the one outright bug: `foundations.js` in the `G3` figure uses
   `\htmlClass{math-act}{…}` as a generic highlight on a matrix entry, which is why a
   literal `3` renders amber. Add a `math-mark` class for highlights and use it here and
   anywhere else the role classes are borrowed for emphasis.

If you would rather keep the broad colouring, the minimum honest change is to rewrite
the legend and the reference paragraph to say "colours separate symbols within a chapter;
five of them additionally carry a fixed meaning in the world-model notation" — and to
still remove `λ`, `h`-as-bandwidth and product-rule `u` from the role maps, because those
three actively contradict the text around them.

**Also**: `\lambda: "act"` in the `base` map is the single worst entry. Removing just
that line fixes 54 tokens.

---

# Phase 3 — Equations on a phone

*Half a day. This is the difference between "readable on a phone" and "pleasant on a
phone".*

At 375 px, **55 display equations overflow** their container. They do not widen the page
(good — `overflow-x: auto` contains them), but the reader sees a formula cut off
mid-expression with a scrollbar underneath and must swipe each one horizontally.

Worst offenders, measured (available width 329 px):

| Width | Chapter | Equation |
|---:|---|---|
| 620 px | calculus | product-rule expansion |
| 506 px | probability | Gaussian variance by parts |
| 490 px | learning | two-layer network definition line |
| 471 px | learning | Adam `m_k`, `v_k` on one line |
| 458 px | clouds | `Q`, `Λ`, `C = QΛQᵀ` on one line |
| 441 px | clouds | `C`, `u`, `v` definitions on one line |

The pattern is clear and encouraging: **almost every one is several statements joined by
`\qquad` on a single display line.** The current layout review records this as accepted
("Long manuscript equations still scroll within their own containers on phones"). I would
not accept it. Three mechanical fixes cover nearly all 55:

1. **Split `\qquad` chains under a width breakpoint.** Most of these are two or three
   independent definitions typeset side by side for desktop economy. `\begin{aligned}`
   with a line per statement reads better on a phone *and* no worse on desktop.
2. **Let display math shrink a little.** `font-size: clamp(0.8rem, 3.6vw, 1rem)` on
   `.katex-display` at narrow widths recovers about 20% of width for free and handles the
   residue.
3. **Add a scroll affordance.** A right-edge fade mask on `.katex-display` when
   `scrollWidth > clientWidth` tells the reader there is more. Today the only cue is a
   scrollbar that appears after they touch it.

Do (1) for the six equations above by hand, then (2) and (3) globally, then re-measure.
`tools/verify-figure-layout.mjs` already walks all the widths; add an assertion that no
display equation exceeds, say, 1.15 × its container, so this cannot regress.

---

# Phase 4 — Charts and figures

*A day. Most of it is one function.*

### 4.1 Axis ticks are not round numbers — 47 of 92 figures

[core.js:96–98](book/edition2/visuals/core.js#L96) computes ticks by equal division:

```js
for (let i = 0; i <= ticks; i++) {
  let x = xmin + ((xmax - xmin) * i) / ticks,
      y = ymin + ((ymax - ymin) * i) / ticks;
```

With `ymin = -4, ymax = 5, ticks = 4` this yields `-4, -1.75, 0.5, 2.75, 5`, printed as
**`-4, -1.8, 0.5, 2.8, 5`**. Sampled results from the current build:

```
N2: -4.3, 4.3      D6: 3.1, 1.6, 6.3, 3.3      D1: -0.3, 0.3, 1.3, 2.8
D5: 1.3, 5.8       B4: -0.8, 1.6, 3.3, 4.9     N5: 0.7, 1.4, 2.1, 2.8
```

No chart in a finished book has a tick at `-4.3`. The recent layout pass widened the
axis margin to *accommodate* these labels; the better move is to not generate them.

**Fix.** A ten-line "nice number" tick generator (round the raw step up to the nearest
1, 2 or 5 × 10ᵏ, then emit ticks from `ceil(min/step)*step`). Snap the domain outward to
the resulting bounds so the axis ends on a tick. Roughly 47 figures improve from one
change. `D6`'s `3.1` and `6.3` are π and 2π and deserve a `yTickFormat` that prints them
as such — the hook already exists.

### 4.2 The laboratory's training chart wastes most of its height and prints `10^-4`

[ui.js:718–727](book/edition2/ui.js#L718)

```js
for (let i = -8; i <= 2; i += 2) { … txt(c, 50, y + 4, `10^${i}`, …) }
```

Two problems in three lines:

- **The y range is hardcoded to ten decades** (10⁻⁸ … 10²) while both curves live inside
  roughly one decade. In my run everything sat in a band about 12% of the plot's height;
  the remaining 88% was empty. A reader watching for the moment SIGReg starts to bite
  cannot see it.
- **The labels are ASCII carets.** `10^2`, `10^-4` — in a book that renders 1,741 KaTeX
  expressions and whose axis *title* on the same chart is a properly subscripted
  `log₁₀ loss`. The inconsistency is visible at a glance.

**Fix.** Use Unicode superscripts (`10²`, `10⁰`, `10⁻²`) or a small `<tspan>` helper; and
auto-fit the decade range to the observed history with a floor of, say, three decades so
it stops jumping around early in training. Keep a fixed range if you prefer stability
across runs — but choose a range the data actually occupies.

### 4.3 The generated plates carry baked-in typography

The seven `assets/generated/infographics/*.png` plates each contain a rendered title and
caption inside the raster image — "Hidden from the camera, not stopped by the screen",
"The image loses the ball. Its motion can continue." — and then the HTML `<figcaption>`
says a third thing below.

Consequences: that text does not scale with the reader's font size, does not respond to
the theme (a bright white plate in dark mode), is not selectable or searchable, and
reaches a screen reader only through the `alt` attribute. It is also the only place in
the book where typography is not under the book's control.

**Fix, in order of cost.** (a) Cheapest: add a dark-mode variant or a subtle
`filter: brightness(.92)` so the plates stop glaring in dark mode. (b) Better: regenerate
the plates without baked-in text and promote both lines into the figure markup, where
`<figcaption>` and a `<h4>` can carry them. (c) Best, for the two most schematic plates
(`P1` occlusion, `S8` SIGReg overview): redraw as SVG like the fifteen architecture
diagrams already are. The occlusion plate in particular is pure geometry and would be
sharper, lighter and themeable as SVG.

### 4.4 Three small coherence gaps

- **The regularisation example changes three times.** `learning.md` motivates with the
  observation `(x=1, y=1)` and the curvature family `g(x) = 1 + 100(x−1)²`; figure `N6`
  draws the same idea at `x = 0`; the ridge desk below fits `(1, 1)` with a line through
  the origin. Each is fine alone; together the reader cannot carry one example through.
  Align the figure to `x = 1`.
- **"Run 20 actions" versus "40 executed actions".** `laboratory.md` labels the control
  button `Run 20 actions` and then reports a tolerance defined "over 40 executed
  actions" (which is what `tools/verify-edition2.mjs:126` runs). A reader cannot
  reproduce the stated criterion with one click. Either offer a 40-action run or say
  "press twice".
- **Figure IDs are out of order in the reading flow**: `O1, O3, O2`, `I1, I2, I3, I5,
  I4`, `A1, A5, A2, A3, A4`, `V1, V2, V5, V3, V4`. Harmless in the page, mildly
  confusing in `figure-atlas.html`. Renumber or sort the atlas by document order.

---

# Phase 5 — Prose and voice

*Ongoing. The writing is good; one habit has hardened into a tic.*

The book's intellectual honesty is its signature and should not be diluted. But the
honesty has settled into a single sentence shape, and I can measure it:

| Construction | Occurrences in ~40,000 words |
|---|---:|
| `distinguish` / `separate` | 76 |
| `X, not Y.` appositive | 73 |
| `is/are not` | 65 |
| `It/This does not …` | 55 |
| `does not mean / imply / prove / establish / guarantee` | 34 |
| `not automatically` | 12 |

**25% of all multi-sentence paragraphs end on a caveat.** In `paper.md` it is 16% of
sentences carrying a negation; `evaluation.md` 15%; `philosophy.md` 14%.

Read three pages and it is rigour. Read thirty and the cadence becomes audible: claim,
claim, "but this does not establish X." The reader starts skipping the last sentence of
every paragraph — which is precisely the sentence the book most wants read.

**What I would do.** Not remove the caveats; vary their delivery.

1. **Promote the important ones.** Perhaps one caveat in five is load-bearing (the
   collapse-gradient subtlety in `jepa.md`, the bound-minimisation warning in
   `theory.md`, the adaptively-chosen-sample warning in `testing.md`). Those already get
   bold or their own paragraph in places — do it consistently, and let the rest be
   ordinary sentences.
2. **Demote the routine ones into the clause they qualify.** "A positive penalty at
   collapse is not the same as a nonzero escape gradient" is strong. "This is a
   motivation, not a guarantee," repeated nineteen times in various forms, is noise.
   Where the qualification is generic, fold it in: "…can encounter pressure to preserve
   these quantities" already carries the hedge; the following sentence restating it can
   go.
3. **Cut the ones that qualify something nobody would have believed.** `geometry.md`:
   "A **tensor** in this book is a multidimensional array with named axes, not a
   mysterious extra mathematical object." The second half argues with a reader who does
   not exist.
4. **End some paragraphs on the positive claim.** A chapter that always retreats reads
   as unsure of itself. The book has earned the right to occasionally just assert a
   result it has proved.

Target: roughly halve the appositive count and the `It does not …` count. The book would
lose no accuracy and read noticeably faster.

### Two specific prose fixes

- [philosophy.md:45](book/edition2/philosophy.md#L45): "then `q_t − q_{t−1} = vΔt`.
  **Dividing both sides** gives `v = (q_t − q_{t−1})/Δt`." Dividing both sides *by what*?
  Say `by Δt`. In a chapter that is scrupulous about spelling out every step, this one
  is uncharacteristically elided.
- [implementation.md:28](book/edition2/implementation.md#L28): "the encoder therefore has
  … `=132232` parameters. The predictor has … `=20232`. Their sum is 152,464." Two
  numbers without separators and one with, in consecutive sentences. Use `132{,}232` and
  `20{,}232` in the math.

---

# Phase 6 — Pedagogical scaffolding and navigation

*Half a day. High leverage for a book this long.*

### 6.1 The learning outcomes are hidden at the back

`curriculum.mjs` declares a precise, testable outcome for each of the twenty chapters —
"Trace a derivative through a scalar chain and a vector-valued map", "Derive the finite
SIGReg objective and trace its gradient back to embeddings". These are genuinely good
and they are verified by `verify:pedagogy`.

The reader sees them **only** in the "Learning route" table inside chapter 20, at the
bottom of a 227,000-pixel page. Someone reading chapter 10 has no idea what they are
meant to be able to do when they finish it.

**Fix.** Render each chapter's outcome at the top of that chapter (one line, under the
lead paragraph: *Check before moving on: …*) or at its end. The data and the build hook
already exist; this is a template change. It is the cheapest pedagogical improvement
available.

### 6.2 There is no chapter-to-chapter pager

At the end of chapter 3 the reader gets a closing paragraph and then, immediately,
chapter 4's masthead. There is no "Next: Prediction under uncertainty →" and no "back to
contents". On a single scrolling page of a quarter-million pixels, the contents drawer is
the only navigation, and it must be opened deliberately.

**Fix.** A small pager after each chapter's last paragraph: previous chapter, contents,
next chapter. It also gives the eye a resting point at the chapter boundary, which the
current design lacks.

### 6.3 The running head repeats the book, not the chapter

Every chapter's right-hand meta line reads `WORLD MODELS, FROM FIRST PRINCIPLES` — the
book's subtitle, already present in the sticky header two centimetres above. The
left-hand side (`03 / MATHEMATICAL LANGUAGE`) does useful work; the right-hand side does
none.

**Fix.** Put the chapter's own outcome there, or its prerequisites ("after: geometry,
probability"), or delete it.

### 6.4 Cross-references between chapters are one-directional

The glossary in `reference.md` links forward beautifully ("See [SIGReg](#sigreg)"). But
inside the chapters, forward promises are made in prose and never linked: `calculus.md`
says "We will prove the needed finite-dimensional version after learning directional
derivatives", `clouds.md` says "We will prove the needed version in the next chapter",
`learning.md` says "This will explain why LeWM places a projector after…". None is a
link.

**Fix.** Turn the dozen or so explicit "we will prove / we will see / derived earlier"
promises into anchors. The section IDs already exist (`#calculus-6`, etc.). A reader who
wants to jump ahead and check that the promise is kept currently has to search.

---

# Phase 7 — Accessibility, performance and polish

*A few hours. Nothing here is broken; several things are just short of excellent.*

### 7.1 Apostrophes are straight; quotes are curly

In the rendered prose: **202 straight `'`** against 6 curly `’`, while **96 of 96 double
quotes are properly curly** `“ ”`. So "LeCun's" sets a vertical typewriter tick three
words from a correctly curled `“Unlabeled”`, in Newsreader, at 19 px.

**Fix.** Enable smart apostrophes in the markdown pipeline, or run a one-time
substitution over the twenty `.md` files (`\b's\b` → `’s` plus the contractions). Guard
against touching code blocks, LaTeX and HTML attributes. This is twenty minutes and it is
the single most visible typographic improvement available.

### 7.2 Light-mode amber falls below WCAG AA

Measured against the light background `#edf0f6`:

| Token | Contrast | AA (4.5) |
|---|---:|---|
| `--amber` | **4.23** | ✗ |
| `--red` | 4.58 | ✓ (barely) |
| `--blue` / `--accent` / `--muted` | 4.67 | ✓ (barely) |
| `--teal` | 4.69 | ✓ |
| `--violet` | 4.78 | ✓ |

Dark mode is excellent throughout (8.65 – 15.45). Light mode is the weak theme and amber
is the one actual failure — and amber is also the most-used semantic colour (177 `u`
tokens alone).

**Fix.** Darken light-mode amber to about `#8a5726` (≈ 5.3:1). While there, lift the
other five by a few percent so none sits on the boundary; at 4.6:1 a slightly different
display or a user's brightness setting puts them under.

### 7.3 Images have no intrinsic dimensions

All seven `<img>` elements — 1536×1024 base64 PNGs — carry neither `width`/`height` nor
`loading`. Each one shifts the layout as it decodes.

**Fix.** Emit `width` and `height` from the source image at build time. (`loading="lazy"`
is moot for data URIs, but the attributes still prevent the reflow.)

### 7.4 The 25.6 MB single page

227,187 px tall, 1,741 KaTeX nodes, 265 SVGs, 13 canvases, 92 interactive figures, seven
base64 plates and an embedded numerical runtime — all in one document. It works, and the
"everything in one file, no network" property is genuinely valuable.

Two symptoms I hit while reviewing: the browser occasionally failed to paint after a
programmatic `scrollIntoView` deep in the document, and scrolling far into the page is
visibly less smooth than near the top.

**Fix.** `content-visibility: auto` with a `contain-intrinsic-size` estimate on each
`main > article` lets the browser skip layout and paint for off-screen chapters. It is
one CSS rule, it preserves in-page search in current Chromium, and on a document this
size it is the highest-leverage performance change available. Measure before and after
with `verify-figure-layout.mjs` to confirm no figure initialises differently.

### 7.5 Smaller items

- **Every one of the 92 teaching figures uses the eyebrow "Explore the idea."** Ninety-two
  identical labels. Either vary by kind (*Work it out* / *Compare* / *Watch the
  mechanism*) or drop the eyebrow and let the heading carry the figure.
- **All `plot()` SVGs share the aria description `"Computed graph: x against y"`.** The
  figure titles are excellent; pass them into the description.
- **`learner_reference.py` imports `initialize` and never uses it.** The reference files
  are printed in the book as exemplary code; an unused import is a small blemish on that
  claim.
- **The `New revision` button crowds the header on phones**, overlapping the space the
  masthead wants. It is a local-preview affordance, so this only affects authoring — but
  the authoring view is where you judge the design.

---

## Verification log

What I actually checked, so you know which parts of the book this review is and is not
evidence about.

**Mathematics — re-derived independently, all correct.**
Geometry: projection by completing the square, Cauchy–Schwarz, `AW` composition, outer
product, worked encodings. Probability: Bayes numeric example (8/26), `Var(X̄) = σ²/B`,
Gaussian normalisation via polar coordinates, variance by parts, `Cov(X, X²) = 0`,
binomial standard error (0.028), law of total variance. Clouds: eigen-decomposition of
`[[2,1],[1,2]]`, `QΛQᵀ`, trace, whitening, the radius-√2 circle, the three-embedding
exercise. Calculus: all numeric traces, Jacobian at (2,3) including the `−0.0102` versus
`−0.01` mismatch, `∇_xL = (19,13)`, Hessian and Laplacian, the spectral-theorem proof.
Learning: gradient-descent step, the full Adam two-step trace (0.4211, 2.4925), ridge
normal equations, the four-gradient backprop exercise and its post-update output 5.5448.
JEPA: softmax gradient, variance-hinge gradient, VICReg forms against Bardes et al.
Testing: KS `D₂ = 0.3413`, Monte Carlo p-value, Box–Muller derivation. SIGReg: the
characteristic-function ODE, `E[D_B] = (√2π − √(2π/3))/B`, the pairwise-distance closed
form, the collapse value 0.4089, the gradient, the local `s²` expansion, the truncation
and trapezoid error bounds, and the three-node numerical trace (0.04648 → 0.09296).
Implementation: parameter counts 132,232 + 20,232 = 152,464, participation ratio bounds.
Planning: CEM maximum-likelihood refit, the two-action optimum `1/(2+ρ)`, the Lipschitz
rollout bound. Evaluation: t-SNE normalisation, expectile balance `v = τ`, advantage-
weighted optimum, MSE unit scaling. Theory: `σ²/2` versus `σ²/0.02`, ridge bias,
Cauchy–Schwarz on eigenvalues, the triangular-kernel average 3.5, `q² + h²/3`, the
`d/(d+2)r²` ball moment, `E[Z_j s_k] = −δ_jk`, `J(p) ≥ tr(Σ⁻¹)`, `2B₀² + 8L²J(p)`.
Transformers: `224/14 → 256` patches, `3·14² = 588`, softmax example → 7, softmax
gradient, permutation equivariance, LayerNorm constraints, SiLU derivative.

**Code — read and checked against the derivations.**
`sigreg_reference.py` matches the book's `R(Z)` and its analytic gradient exactly.
`learner_reference.py`'s backward pass matches the stated chain rule including the target
branch. `model.ts`'s `sigreg` and `objective`, and `runtime.ts`'s Adam with the
`min(1, 5/‖g‖)` clip, match both the book and `research/lewm-pinned/module.py`.
`parameterCount` evaluates to 152,464.

**Paper correspondence — verified against `research/leworldmodel-v1.txt` and the pinned
repo at `8edfeb3`.** ViT-Tiny / patch 14 / 12 layers / 3 heads (paper line 271);
predictor 6 layers / 16 heads / dropout 0.1 (line 277); `dim_head: 64` with
`embed_dim: 192`; projector `Linear → BatchNorm1d → GELU → Linear`, hidden 2048; SIGReg
weight 0.09, 1024 projections, 17 knots; `max_epochs: 100` in YAML against 10 in the
appendix; AdamW, lr 5e-5, wd 1e-3, bf16, clip 1.0; CEM 300 candidates / 30 elites / 30
iterations for PushT and 10 elsewhere (line 1268); horizon 5 blocks × frame-skip 5 = 25
timesteps, full-prefix execution; dataset sizes for all four environments; ablations
96/86, 96/94, dropout 0.1; Table 5's three seeds and 50 trajectories; Appendix A's
`[0.2, 4]` and its missing batch factor; Algorithm 1's single-argument `mse_loss` and
unbalanced parenthesis; Appendix C.2's unsquared off-diagonal covariance sum. **All
confirmed.** The only mismatch found is §1.1 above.

**Runtime.** The laboratory initialised on WebGPU reporting "152,464 parameters · 16,384
training transitions", trained 5,454 real updates at ~4.4 ms/update, and finished at
prediction/persistence 0.120 and embedding spread 0.9158 — within noise of the book's
recorded seed-17 figures of 0.116 and 0.903. Pause preserved weights, Adam moments and
random streams as documented.

**Rendered page.** No KaTeX errors in 1,741 expressions. No broken internal links among
277. No heading-level skips across 501 headings. All 7 images have alt text; all 114
figures have captions; all 13 canvases have aria labels; all 35 `<details>` have
summaries. No page-level horizontal scroll at 375 px. Theme toggle preserves scroll
position. 226-page PDF present with 40 outline entries and correct metadata.

**Not checked.** Human comprehension; whether the pedagogical sequence works for a real
beginner; the paper's Figure 6 bar values (87 / 86 / 96 / 74) beyond the ones that appear
in tables, since the extracted figure text is not reliable; reproduction of any published
benchmark; long-run numerical stability of the browser model beyond ~5,500 updates.

---

## Suggested order of work

| Phase | What | Effort | Why now |
|---|---|---|---|
| 1 | Five correctness fixes | ~2 h | Independent, shippable, removes the only wrong statements |
| 2 | Notation colours | ~4 h | Largest systemic issue; affects every mathematical chapter |
| 3 | Phone equations | ~4 h | 55 broken reading experiences; mechanical fix |
| 4 | Axis ticks + lab chart | ~6 h | 47 figures from one function; the chart is the book's centrepiece |
| 7.1–7.2 | Apostrophes, amber contrast | ~1 h | Highest polish-per-minute in the document |
| 6 | Outcomes, pager, cross-links | ~4 h | Turns existing structure into visible scaffolding |
| 5 | Prose de-hedging | ongoing | Do it chapter by chapter; no deadline |
| 7.4 | `content-visibility` | ~1 h | Do after Phase 4 so figure init is re-verified |
| 4.3 | Replate or theme the PNGs | ~1 day | Largest remaining aesthetic gap; lowest urgency |

---

## A closing note

It is worth saying what this book already is. Twenty chapters that go from "what is a
vector" to a line-by-line reading of a March 2026 paper, with every derivation carried
out rather than cited, a working world model that really trains in the reader's browser,
and a standard of claim-hygiene that I did not manage to break in about sixty independent
checks. The Fisher-information argument in chapter 15 and the SIGReg derivation in
chapter 10 are better than most textbook treatments of either.

The findings above are what is left when a book is already correct. The colour system is
the one place where an idea has outrun its execution, and the phone equations and axis
ticks are the two places where the rendering is below the standard of the writing. Fix
those three and the rest is housekeeping.
