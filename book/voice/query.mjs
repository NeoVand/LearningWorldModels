const preparedCache = new WeakMap();
const stopWords = new Set([
  "a", "an", "and", "are", "at", "can", "does", "for", "from", "how", "i",
  "in", "is", "it", "me", "of", "on", "or", "our", "the", "this", "to",
  "we", "what", "when", "where", "which", "why", "with", "you",
]);

const normalize = (text) =>
  String(text ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

function termsOf(text) {
  return [...new Set(normalize(text)
    .split(" ")
    .filter((term) => (term.length > 2 || /^\d+$/.test(term)) && !stopWords.has(term))
    .map((term) => term.length > 4 && term.endsWith("s") ? term.slice(0, -1) : term))];
}

function preparedFor(index) {
  if (preparedCache.has(index)) return preparedCache.get(index);
  const sections = new Map(index.sections.map((section) => [section.id, section]));
  const records = index.items.map((item) => {
    const guide = item.teachingGuide;
    const text = [item.text, item.speech, item.agentNote].filter(Boolean).join(" ");
    const context = [item.equationContext?.setup, item.equationContext?.nextStep].filter(Boolean).join(" ");
    return {
      item,
      title: normalize(item.title),
      section: normalize(sections.get(item.sectionId)?.title),
      aliases: (item.searchAliases ?? []).map(normalize),
      text: normalize(text),
      guide: normalize(guide && [guide.idea, guide.reason, guide.caution, guide.example, ...(guide.steps ?? [])].filter(Boolean).join(" ")),
      context: normalize(context),
    };
  });
  const prepared = { records, sections, byId: new Map(index.items.map((item) => [item.id, item])) };
  preparedCache.set(index, prepared);
  return prepared;
}

function score(query, terms, record, options) {
  const fields = [record.title, record.section, ...record.aliases, record.text, record.guide, record.context];
  let matches = 0;
  let points = 0;
  for (const term of terms) {
    if (!fields.some((field) => field.includes(term))) continue;
    matches++;
    points += record.aliases.some((alias) => alias.includes(term)) ? 8 :
      record.title.includes(term) ? 6 :
      record.section.includes(term) ? 3 :
      record.guide.includes(term) ? 3 :
      record.text.includes(term) ? 2 : 0.5;
  }
  if (!matches) return 0;
  points *= 0.35 + 0.65 * matches / terms.length;
  if (record.aliases.some((alias) => alias === query)) points += 40;
  else if (record.aliases.some((alias) => alias.includes(query) || query.includes(alias))) points += 22;
  if (record.title === query) points += 15;
  else if (record.title.includes(query)) points += 8;
  if (record.section.includes(query)) points += 5;
  if (record.item.kind === "equation" && /\b(?:equation|eq|formula|derive|derivation|gradient)\b/.test(query)) points += 3;
  if (options?.focusId === record.item.id) points += 5;
  else if (options?.sectionId && options.sectionId === record.item.sectionId) points += 1.5;
  else if (options?.chapterId && options.chapterId === record.item.chapterId) points += 0.75;
  return points;
}

export function searchCourseIndex(
  index,
  query,
  { chapterId, sectionId, focusId, kinds, limit = 8 } = {},
) {
  const normalized = normalize(query);
  const paperNumber = normalized.match(/\b(?:equation|eq)\s*(\d+)\b/)?.[1];
  if (paperNumber) {
    const exact = index.items.find((item) =>
      item.kind === "equation" &&
      item.chapterId === "paper" &&
      item.searchAliases?.some((alias) => normalize(alias) === `leworldmodel equation ${paperNumber}`)
    );
    return exact && (!chapterId || chapterId === "paper") && (!kinds || kinds.includes("equation"))
      ? [{ ...exact, relevance: 100 }]
      : [];
  }
  const terms = termsOf(query);
  if (!terms.length) return [];
  return preparedFor(index).records
    .filter(
      ({ item }) =>
        (!chapterId || item.chapterId === chapterId) &&
        (!kinds || kinds.includes(item.kind)),
    )
    .map((record) => ({
      item: record.item,
      relevance: score(normalized, terms, record, { chapterId, sectionId, focusId }),
    }))
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || a.item.sourceLine - b.item.sourceLine)
    .slice(0, limit)
    .map(({ item, relevance }) => ({ ...item, relevance }));
}

// A specific numbered paper equation should never fall back to a nearby
// paragraph or to another chapter's unrelated formula. This helper resolves
// exact references first, then uses the ranked search for concept questions.
export function findEquationForQuery(index, query, options = {}) {
  const normalized = normalize(query);
  const number = normalized.match(/\b(?:equation|eq)\s*(\d+)\b/)?.[1];
  if (number) {
    // The course's numbered equations belong to its destination paper. A
    // bare "Equation 4" therefore has one exact source anchor; if a number
    // is absent, do not point at an unrelated formula with lexical overlap.
    return index.items.find((item) =>
      item.kind === "equation" &&
      item.chapterId === "paper" &&
      item.searchAliases?.some((alias) => normalize(alias) === `leworldmodel equation ${number}`)
    ) ?? null;
  }
  if (!number && /^(?:this|the|current|here)\s*(?:equation|formula)$/.test(normalized)) {
    const focused = preparedFor(index).byId.get(options.focusId);
    return focused?.kind === "equation" || focused?.kind === "widgetEquation" ? focused : null;
  }
  const matches = searchCourseIndex(index, query, {
    ...options,
    kinds: ["equation", "widgetEquation"],
    limit: 1,
  });
  return matches[0]?.relevance >= 8 ? matches[0] : null;
}

export function findPassage(index, selectedText, chapterId) {
  const needle = normalize(selectedText);
  if (!needle) return null;
  const candidates = index.items.filter(
    (item) =>
      item.chapterId === chapterId &&
      [
        "paragraph",
        "equation",
        "table",
        "widget",
        "diagram",
        "image",
        "lab",
      ].includes(item.kind),
  );
  const exact = candidates.find(
    (item) =>
      normalize(item.text).includes(needle) ||
      normalize(item.speech).includes(needle),
  );
  return (
    exact ??
    searchCourseIndex(index, selectedText, { chapterId, limit: 1 })[0] ??
    null
  );
}

export function contextFor(
  index,
  { chapterId, sectionId, figureId, query, selectedText, maxChars = 6000 } = {},
) {
  const chapter = index.chapters.find((entry) => entry.id === chapterId);
  const section = index.sections.find((entry) => entry.id === sectionId);
  const priority = [];
  if (figureId)
    priority.push(
      ...index.items.filter(
        (item) =>
          item.figureId === figureId || item.locator?.figureId === figureId,
      ),
    );
  if (selectedText && chapterId) {
    const passage = findPassage(index, selectedText, chapterId);
    if (passage) priority.push(passage);
  }
  if (query)
    priority.push(...searchCourseIndex(index, query, { chapterId, limit: 6 }));
  if (section)
    priority.push(
      ...section.itemIds
        .map((id) => index.items.find((item) => item.id === id))
        .filter(Boolean),
    );
  const seen = new Set();
  const excerpts = [];
  let used = 0;
  for (const item of priority) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const excerpt = {
      id: item.id,
      kind: item.kind,
      title: item.title,
      text: item.text,
      explanation: item.speech,
      sourceLine: item.sourceLine,
      sectionId: item.sectionId,
      figureId: item.figureId,
      controls: item.controls,
      agentNote: item.agentNote,
    };
    const size = JSON.stringify(excerpt).length;
    if (used + size > maxChars && excerpts.length) break;
    used += size;
    excerpts.push(excerpt);
  }
  return {
    chapter: chapter && {
      id: chapter.id,
      title: chapter.title,
      summary: chapter.summary,
      outcome: chapter.outcome,
      prerequisites: chapter.prerequisites,
    },
    section: section && {
      id: section.id,
      title: section.title,
      summary: section.summary,
    },
    excerpts,
  };
}
