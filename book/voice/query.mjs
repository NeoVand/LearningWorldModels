import { navigationTopics } from "./navigation-topics.mjs";
const preparedCache = new WeakMap();
const stopWords = new Set([
  "a", "an", "and", "are", "at", "can", "does", "for", "from", "how", "i",
  "in", "is", "it", "me", "of", "on", "or", "our", "the", "this", "to",
  "we", "what", "when", "where", "which", "why", "with", "you",
  // These words describe the reader's request, rather than the course topic.
  "about", "book", "course", "explain", "find", "first", "go", "highlight",
  "introduce", "introduced", "introduces", "introduction", "locate", "open",
  "page", "please", "scroll", "see", "show", "take", "teach", "tell",
  "topic", "definition", "defined", "equation", "formula", "figure",
  "section", "chapter", "diagram", "paragraph", "widget", "lesson",
  // Deictic words need the current on-screen selection, not a global search.
  "main", "teaching", "passage", "relevant", "material", "discuss", "discusses", "introduction", "could", "would", "want", "need", "just", "into", "then", "yet", "only", "current", "here", "now", "one", "something", "stuff", "that", "there",
  "these", "thing", "those",
]);

const normalize = (text) =>
  String(text ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

function termsOf(text) {
  return [...new Set(normalize(text)
    .split(" ")
    .filter((term) => (term.length > 2 || /^[pz]$/.test(term) || /^\d+$/.test(term)) && !stopWords.has(term))
    .map((term) => term.length > 4 && term.endsWith("s") ? term.slice(0, -1) : term))];
}

function hasTerm(fieldTerms, term) {
  // A search for “world model” must not match the one-token paper title
  // “LeWorldModel”, nor should an alias for a whole equation win on a single
  // word buried inside it. termsOf handles a light plural stem once per item.
  return fieldTerms.has(term);
}

function hasPhrase(field, phrase) {
  return Boolean(phrase) && (` ${field} `).includes(` ${phrase} `);
}

function preparedFor(index) {
  if (preparedCache.has(index)) return preparedCache.get(index);
  const sections = new Map(index.sections.map((section) => [section.id, section]));
  const records = index.items.map((item) => {
    const guide = item.teachingGuide;
    const text = [item.text, item.speech, item.agentNote].filter(Boolean).join(" ");
    const context = [item.equationContext?.setup, item.equationContext?.nextStep].filter(Boolean).join(" ");
    const title = normalize(item.title);
    const section = normalize(sections.get(item.sectionId)?.title);
    const aliases = (item.searchAliases ?? []).map(normalize);
    const normalizedText = normalize(text);
    const normalizedGuide = normalize(guide && [guide.idea, guide.reason, guide.caution, guide.example, ...(guide.steps ?? [])].filter(Boolean).join(" "));
    const normalizedContext = normalize(context);
    return {
      item,
      title, section, aliases,
      text: normalizedText,
      guide: normalizedGuide,
      context: normalizedContext,
      titleTerms: new Set(termsOf(title)),
      sectionTerms: new Set(termsOf(section)),
      aliasTerms: aliases.map((alias) => new Set(termsOf(alias))),
      textTerms: new Set(termsOf(normalizedText)),
      guideTerms: new Set(termsOf(normalizedGuide)),
      contextTerms: new Set(termsOf(normalizedContext)),
    };
  });
  const prepared = { records, sections, byId: new Map(index.items.map((item) => [item.id, item])) };
  preparedCache.set(index, prepared);
  return prepared;
}

function score(query, terms, record, options) {
  const fields = [record.titleTerms, record.sectionTerms, ...record.aliasTerms, record.textTerms, record.guideTerms, record.contextTerms];
  let matches = 0;
  let points = 0;
  for (const term of terms) {
    if (!fields.some((field) => hasTerm(field, term))) continue;
    matches++;
    points += hasTerm(record.titleTerms, term) ? 7 :
      record.aliasTerms.some((alias) => hasTerm(alias, term)) ? (terms.length > 1 ? 5 : 3) :
      hasTerm(record.sectionTerms, term) ? 2 :
      hasTerm(record.guideTerms, term) ? 2.5 :
      hasTerm(record.textTerms, term) ? 2 : 0.5;
  }
  if (!matches) return 0;
  points *= 0.35 + 0.65 * matches / terms.length;
  if (record.aliases.some((alias) => alias === query)) points += 40;
  else if (terms.length > 1 && record.aliases.some((alias) => hasPhrase(alias, query))) points += 16;
  if (record.title === query) points += 15;
  else if (hasPhrase(record.title, query)) points += 8;
  if (hasPhrase(record.section, query)) points += 5;
  if (record.item.kind === "equation" && /\b(?:equation|eq|formula|derive|derivation|gradient)\b/.test(query)) points += 3;
  if (options?.focusId === record.item.id) points += 5;
  else if (options?.sectionId && options.sectionId === record.item.sectionId) points += 1.5;
  else if (options?.chapterId && options.chapterId === record.item.chapterId) points += 0.75;
  return points;
}

export function isTeachingDestination(item, query = "") {
  if (!item || item.kind === "reference") return false;
  if (item.chapterId === "reference" && !/\b(?:glossary|bibliography|reference|notation table)\b/i.test(query)) return false;
  if (["list", "tableRow"].includes(item.kind) && !/\b(?:list|table|glossary|reference|bibliography)\b/i.test(query)) return false;
  return true;
}

const introductionRequest = /\b(?:what is|what are|define|definition|introduc\w*|first|find|where|locate|show|scroll)\b/;

// Choose an actual teaching passage when the reader asks where a concept is
// introduced. Ordinary search is allowed to return a diagram or equation with
// the term in an alias; those are often poor places to *begin* learning it.
export function locateCourseTopic(index, query, options = {}) {
  const normalized = normalize(query);
  if (/\b(?:equation|eq)\s*\d+\b/.test(normalized)) {
    const exact = findEquationForQuery(index, query, options);
    return exact ? { ...exact, relevance: 100 } : null;
  }
  const terms = termsOf(query);
  if (!terms.length) return null;
  const editorial = navigationTopics.find(([, aliases]) => aliases.some((alias) => {
    const key = termsOf(alias);
    return key.length === terms.length && terms.every((term) => key.includes(term));
  }));
  if (editorial) {
    const target = preparedFor(index).byId.get(editorial[0]);
    if (target && (!options.chapterId || target.chapterId === options.chapterId)) return { ...target, relevance: 100 };
  }
  const concept = terms.join(" ");
  const mathematicalTarget = /\b(?:derive|derivation|formula|gradient|calculation|proof)\b/.test(normalized);
  const introductory = introductionRequest.test(normalized) && !mathematicalTarget;
  const { records } = preparedFor(index);
  const chapterOrder = new Map(index.chapters.map((chapter, position) => [chapter.id, position]));
  const candidates = records
    .filter(({ item }) =>
      isTeachingDestination(item, query) &&
      (!options.chapterId || item.chapterId === options.chapterId) &&
      (!options.kinds || options.kinds.includes(item.kind)))
    .map((record) => {
      const item = record.item;
      let relevance = score(normalized, terms, record, options);
      const fields = [record.titleTerms, record.sectionTerms, ...record.aliasTerms, record.textTerms, record.guideTerms, record.contextTerms];
      const coverage = terms.filter((term) => fields.some((field) => field.has(term))).length / terms.length;
      if (relevance <= 0 || coverage < 0.65) return { item, relevance: 0 };
      if (introductory) {
        if (item.kind === "paragraph") {
          const lead = record.text.slice(0, 230);
          const conceptPattern = terms.map((term) => `${term}(?:s|es)?`).join("\\s+");
          const subject = new RegExp(`\\b(?:a |an |the )?${conceptPattern}\\s+(?:is|are|means|refers|learns|describes|represents)\\b`);
          if (subject.test(lead)) relevance += 32;
          else if (hasPhrase(lead, concept)) relevance += 11;
        }
        if (item.kind === "heading" && hasPhrase(record.title, concept)) relevance += 20;
        if (["equation", "widgetEquation", "tableRow", "table", "reference"].includes(item.kind)) relevance -= 8;
        // Among equally useful introductory passages, prefer the first place
        // the course develops the concept, rather than a later paper recap.
        relevance += 3 * (1 - (chapterOrder.get(item.chapterId) ?? 0) / index.chapters.length);
      }
      if (mathematicalTarget && ["equation", "widgetEquation"].includes(item.kind)) relevance += 10;
      return { item, relevance };
    })
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance ||
      (chapterOrder.get(a.item.chapterId) ?? 0) - (chapterOrder.get(b.item.chapterId) ?? 0) ||
      a.item.sourceLine - b.item.sourceLine);
  return candidates[0] && candidates[0].relevance >= 5
    ? { ...candidates[0].item, relevance: candidates[0].relevance }
    : null;
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
    limit: 8,
  });
  const terms = termsOf(query);
  const target = matches.find((item) => {
    if (!isTeachingDestination(item, query)) return false;
    const record = preparedFor(index).records.find((entry) => entry.item.id === item.id);
    const fields = [record.titleTerms, record.sectionTerms, ...record.aliasTerms, record.textTerms, record.guideTerms, record.contextTerms];
    return terms.length && terms.filter((term) => fields.some((field) => field.has(term))).length / terms.length >= 0.65;
  });
  return target?.relevance >= 8 ? target : null;
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
