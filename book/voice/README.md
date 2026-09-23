# Course voice index

`tools/build-voice-index.mjs` reads the twenty chapter sources, the registered
teaching figures, `widget-narration.json`, and `table-narration.json`. It writes the deterministic
`course-index.json`. The book build can call `buildVoiceIndex()` and embed its
return value in the single HTML file. No service, key, or network call is
needed to construct the index.

The index has four top-level collections: `chapters`, `sections`, `items`, and
`counts`. Each item has a content-derived stable `id`, `kind`, `chapterId`,
`sectionId`, `text`, `speech`, `playback`, and a `locator`. A section stores
its items in reading order. `playback: false` denotes a selectable subpart
(for example, an inline formula, a table row, or an equation inside a widget)
that the continuous player should not repeat after reading its parent.

Figures have exact IDs such as `visual-O1` and selectors such as `#visual-O1`.
Equations retain their source LaTeX for matching KaTeX annotations and have
natural-language `speech`. All 128 display equations have an editorially
reviewed explanation: a short authored set is bundled with the semantic reader
and the rest live in `equation-speech.json`, keyed by stable item ID. All 93
teaching figures have authored explanations in `widget-narration.json`.
Inline equations are spoken within their parent paragraph during continuous
listening; individually selected inline expressions also have a contextual
fallback marked `speechSource: "heuristic"`. A future editorial pass can replace
that fallback without changing navigation IDs.
All 15 rendered tables expose a whole-table narration; the source tables also
have individually selectable rows. The
index also covers all ten standalone labs, generated images, diagrams, code
references, chapter prose, and derivation headings.

The browser import `book/edition2/voice-index-runtime.js` exports:

- `attachVoiceIndex(index, document)`: binds every item to a rendered element,
  sets `data-voice-id` on that element, and returns `Map<itemId, Element>`.
- `closestVoiceItem(element)`: returns the nearest `data-voice-id` for the
  selection or click target.
- `searchCourseIndex`, `findPassage`, and `contextFor`: local retrieval of
  chapter/section/figure context for the conversational assistant.

Rebuild with `node tools/build-voice-index.mjs`. Check source coverage and
speech with `node tools/verify-voice-index.mjs`. After building the HTML, run
`node tools/verify-voice-index.mjs --dom` to test every DOM binding. The
Playwright verification honors `BOOK_PLAYWRIGHT_MODULE` when the bundled
browser runtime is needed.

`tools/review-display-speech.mjs` is an optional authoring tool that uses the
local ignored `.env` key to draft reviewable overrides. It is never run by the
book build or the published app.
