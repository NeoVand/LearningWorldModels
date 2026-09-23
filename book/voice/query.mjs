const normalize = (text) =>
  String(text ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

function score(query, item, section) {
  const q = normalize(query);
  if (!q) return 0;
  const title = normalize(item.title);
  const sectionTitle = normalize(section?.title);
  const body = normalize(`${item.text} ${item.speech} ${item.agentNote ?? ""}`);
  const terms = q.split(" ").filter((term) => term.length > 2);
  if (!terms.length) return 0;
  const matches = terms.filter(
    (term) =>
      title.includes(term) ||
      sectionTitle.includes(term) ||
      body.includes(term),
  ).length;
  if (!matches) return 0;
  return (
    matches / terms.length +
    (title.includes(q) ? 2 : 0) +
    (sectionTitle.includes(q) ? 1 : 0) +
    (body.includes(q) ? 0.5 : 0)
  );
}

export function searchCourseIndex(
  index,
  query,
  { chapterId, kinds, limit = 8 } = {},
) {
  const sections = new Map(
    index.sections.map((section) => [section.id, section]),
  );
  return index.items
    .filter(
      (item) =>
        (!chapterId || item.chapterId === chapterId) &&
        (!kinds || kinds.includes(item.kind)),
    )
    .map((item) => ({
      item,
      relevance: score(query, item, sections.get(item.sectionId)),
    }))
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map(({ item, relevance }) => ({ ...item, relevance }));
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
