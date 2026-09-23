// Browser-side bridge from a source-derived voice item to the single-file book.
// Explicit figure IDs are exact; prose and formulas are matched within their
// chapter and heading so an insertion elsewhere does not break navigation.
const sameText = (a, b) =>
  String(a)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim() ===
  String(b)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

function words(text) {
  return String(text)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function similarity(source, candidate) {
  const a = words(source),
    b = words(candidate);
  if (!a.length || !b.length) return 0;
  let prefix = 0;
  while (prefix < Math.min(a.length, b.length) && a[prefix] === b[prefix])
    prefix++;
  const overlap =
    a.filter((word) => b.includes(word)).length / Math.max(a.length, b.length);
  return Math.max(prefix / Math.min(a.length, 18), overlap * 0.6);
}

function proseWithoutMath(element) {
  const clone = element.cloneNode(true);
  clone.querySelectorAll(".katex").forEach((math) => math.remove());
  return clone.textContent;
}

function owningSection(element, article) {
  const headings = article.querySelectorAll("h2[id]");
  let section = article.id;
  for (const heading of headings) {
    if (
      heading === element ||
      heading.compareDocumentPosition(element) &
        Node.DOCUMENT_POSITION_FOLLOWING
    )
      section = heading.id;
    else break;
  }
  return section;
}

export function attachVoiceIndex(index, scope = document) {
  const byId = new Map();
  const usedParagraphs = new WeakSet();
  const usedMath = new WeakSet();
  const articles = new Map(
    [...scope.querySelectorAll("main article[id]")].map((element) => [
      element.id,
      element,
    ]),
  );
  const tag = (item, element) => {
    if (!element) return false;
    byId.set(item.id, element);
    element.dataset.voiceId = item.id;
    return true;
  };
  const direct = (item) => {
    const article = articles.get(item.chapterId);
    if (!article) return null;
    if (item.locator?.selector) {
      const matches = scope.querySelectorAll(item.locator.selector);
      return matches[(item.locator.index ?? 1) - 1] ?? null;
    }
    if (item.kind === "table") {
      const tables = [...article.querySelectorAll(".table-wrap")].filter(
        (element) =>
          owningSection(element, article) === item.sectionId &&
          ![...byId.values()].includes(element),
      );
      return (
        tables.find((element) => {
          const header =
            element.querySelector("thead tr") ?? element.querySelector("tr");
          const labels = [...(header?.querySelectorAll("th,td") ?? [])].map(
            (cell) => cell.textContent,
          );
          return (
            labels.length === item.headers?.length &&
            labels.every((label, i) => sameText(label, item.headers[i]))
          );
        }) ??
        tables[0] ??
        null
      );
    }
    if (item.kind === "tableRow") {
      const parent = byId.get(item.parentId);
      return parent?.querySelectorAll("tbody tr")[item.locator.row] ?? null;
    }
    if (item.kind === "detailHeading") {
      const topic = (text) =>
        String(text).includes("·")
          ? String(text).split("·").slice(1).join("·").trim()
          : text;
      return (
        [...article.querySelectorAll("summary, .proof h3")].find(
          (element) =>
            owningSection(element, article) === item.sectionId &&
            (sameText(element.textContent, item.title) ||
              sameText(topic(element.textContent), topic(item.title))),
        ) ?? null
      );
    }
    if (item.kind === "code")
      return (
        article.querySelectorAll(".code-wrap")[item.locator.codeIndex] ?? null
      );
    if (item.kind === "list")
      return (
        [...article.querySelectorAll("ul,ol")].find(
          (element) =>
            owningSection(element, article) === item.sectionId &&
            !element.closest(".teaching-visual, .lab, figure, .code-wrap") &&
            similarity(
              item.text.slice(0, 160),
              element.innerText || element.textContent,
            ) > 0.3,
        ) ?? null
      );
    return null;
  };
  for (const item of index.items) {
    if (["paragraph", "equation", "widgetEquation"].includes(item.kind))
      continue;
    tag(item, direct(item));
  }
  const paragraphsBySection = new Map();
  for (const article of articles.values())
    for (const element of article.querySelectorAll("p")) {
      if (
        element.closest(
          ".teaching-visual, .lab, figure, .code-wrap, .visual-panel, .visual-explanations",
        ) ||
        element.classList.contains("chapter-outcome")
      )
        continue;
      const sectionId = owningSection(element, article);
      if (!paragraphsBySection.has(sectionId))
        paragraphsBySection.set(sectionId, []);
      paragraphsBySection
        .get(sectionId)
        .push({ element, text: proseWithoutMath(element) });
    }
  for (const item of index.items.filter(
    (entry) => entry.kind === "paragraph",
  )) {
    if (item.locator?.selector) {
      tag(item, scope.querySelector(item.locator.selector));
      continue;
    }
    const candidates = (paragraphsBySection.get(item.sectionId) ?? []).filter(
      (candidate) => !usedParagraphs.has(candidate.element),
    );
    const hint = item.locator?.textHint || item.text;
    const ranked = candidates
      .map((candidate) => ({
        element: candidate.element,
        score: similarity(hint, candidate.text),
      }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    if (best && best.score >= 0.3) {
      usedParagraphs.add(best.element);
      tag(item, best.element);
    }
  }
  for (const item of index.items.filter(
    (entry) => entry.kind === "equation" || entry.kind === "widgetEquation",
  )) {
    let container = item.locator?.figureId
      ? scope.querySelector(`#visual-${item.locator.figureId}`)
      : item.parentId
        ? byId.get(item.parentId)
        : articles.get(item.chapterId);
    if (!container) continue;
    const article = articles.get(item.chapterId);
    const matches = [
      ...container.querySelectorAll('annotation[encoding="application/x-tex"]'),
    ].filter(
      (annotation) =>
        !usedMath.has(annotation) &&
        sameText(annotation.textContent, item.latex) &&
        (item.locator?.figureId ||
          item.parentId ||
          owningSection(annotation, article) === item.sectionId),
    );
    const annotation = matches[0];
    if (!annotation) continue;
    usedMath.add(annotation);
    const math = annotation.closest(".katex") ?? annotation.parentElement;
    tag(item, math);
  }
  return byId;
}

// Interactive figures replace their .visual-body markup after a control moves.
// A previously bound KaTeX node can therefore remain in the map while no
// longer belonging to the page. Rebind only when the same formula is present
// unambiguously in the live figure; a changed numeric expression must not be
// mistaken for the equation captured by the source-derived index.
export function resolveBoundVoiceItem(index, bound, id, scope = document) {
  const item = index.items.find((entry) => entry.id === id);
  if (!item) return null;
  const cached = bound.get(id);
  if (cached?.isConnected) return cached;
  if (item.kind !== "widgetEquation" || !item.locator?.figureId || !item.latex)
    return null;

  const figure = scope.getElementById?.(`visual-${item.locator.figureId}`)
    ?? scope.querySelector?.(`#visual-${item.locator.figureId}`);
  if (!figure?.isConnected) return null;
  const normalizedLatex = (value) => String(value ?? "").replace(/\s+/g, "");
  const targetLatex = normalizedLatex(item.latex);
  const matches = [...figure.querySelectorAll('annotation[encoding="application/x-tex"]')]
    .filter((annotation) => normalizedLatex(annotation.textContent) === targetLatex);
  if (matches.length !== 1) return null;

  const node = matches[0].closest(".katex");
  if (!node?.isConnected) return null;
  node.dataset.voiceId = id;
  bound.set(id, node);
  return node;
}

export function closestVoiceItem(element) {
  return element?.closest?.("[data-voice-id]")?.dataset.voiceId ?? null;
}
