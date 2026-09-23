# Voice navigation contract

The reader controls the page. The tutor gets one verified destination per request,
and uses read-only lookups for other facts mentioned in its answer.

## What changed

Previously, a short debounce searched each growing speech transcript and scrolled
to its best match. Independently, backend tools could search, scroll and highlight.
Delayed fragments and tool results raced. A time-based focus lock did not identify
which request owned the action. Search could choose a glossary/reference entry.
Highlighting a whole figure changed the surface behind its transparent SVG.

`book/voice/navigation-controller.mjs` now owns page-mutation permission:

1. A submitted typed request, explicit selection, or Live delegation captures an
   immutable application request ID. Transcript fragments only update captions.
   No text from the assistant triggers navigation.
2. Tool calls carry delegation, response and call IDs plus that captured request
   ID. A continuation retains the original ID. A newer request invalidates older
   work. Repeated delegation without new input retains its existing scope.
3. Destination lookup is separate from committing focus. Editorial topic aliases
   bridge section titles and common terminology. Numbered paper equations are
   exact. Generic lookup excludes glossary, reference and cross-reference lists.
   Unknown concepts must fail rather than point at a coincidental shared word.
4. All bound anchors must belong to their own `main article`; navigation panels,
   headers and hidden tutor notes cannot be highlighted as course content.
5. Focus opens enclosing disclosures, closes obstructing contents, scrolls, then
   checks actual geometry and hit-testing below the fixed header. A successful
   call pins the destination. Repeating it does not scroll again. Trying a second
   destination in the same request fails with the retained ID.
6. Wheel, touch scrolling, reading-page interaction, assistant Pause, and prepared
   narration cancel pending assistant navigation. Reading/search tools still work.
7. Widget redraws rebind an unchanged formula without scrolling. If the expression
   has changed, the caption of the containing widget becomes the visual reference;
   the old equation is not reported as still visible or exact.
8. Prose uses the browser's text highlight layer. KaTeX gets a continuous background
   behind the expression. Figures highlight their title or caption. No tint,
   opacity, filter, border or overlay is applied to the figure or its SVG/canvas.
   Browsers without CSS Custom Highlight support use a text-element background.

## Repeatable harness

After `npm run build`, run `npm run verify:voice:navigation`. No provider keys or
microphone are needed. Set `BOOK_URL` to run the same checks against a deployment. It drives the **production transport and UI callbacks**
using a WebRTC stand-in and actual recorded protocol event shapes.

Checks cover editorial synonyms and missing topics; request races; fragmented
transcripts; duplicate delegations; typed requests delegated by the service;
late and conflicting tools; manual scroll; exact paper equations; article-only
anchors; mobile contents closure; and light/dark SVG screenshots that must be
byte-identical before and after highlighting. Screenshots and a bounded navigation
trace are written to ignored `tmp/navigation-qa/` for visual review.

`npm run verify:voice` also checks every index binding, narration controls,
responsive UI, dynamic formulas and model-switch acknowledgments. GitHub Pages
runs this suite before assembling a public deployment.

For a local reproduction, `window.__courseVoice.navigation.snapshot()` returns
request IDs, target IDs and outcomes. It never includes keys or transcript text.
The trace is capped at 160 events and remains in memory.

## Provider boundary and limits

The implementation follows [Live delegation](https://developers.openai.com/api/docs/guides/live-delegation)
and [Live conversation events](https://developers.openai.com/api/docs/guides/live-conversations).
Delivery gaps are not utterance boundaries. Server offsets identify stale work;
backend completion is not evidence that the learner heard the answer.

The offline harness tests application behavior deterministically. It cannot
certify microphone transcription, the provider's intent routing, or the quality
of every spoken explanation. Live smoke checks are needed after transport or
prompt changes. The release was additionally checked with a spoken request for
regularization and a typed explanation of LeWorldModel Equation 4. Those checks
verify actual destination and tool results, not just the assistant's claims.
