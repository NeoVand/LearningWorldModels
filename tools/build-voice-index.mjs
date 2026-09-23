import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { marked } from "marked";
import { chapters } from "../book/edition2/curriculum.mjs";
import { registry, stateFor } from "../book/edition2/visuals/core.js";
import "../book/edition2/visuals/arm.js";
import "../book/edition2/visuals/foundations.js";
import "../book/edition2/visuals/learning.js";
import "../book/edition2/visuals/statistics.js";
import "../book/edition2/visuals/pipeline.js";
import "../book/edition2/visuals/evidence.js";
import "../book/edition2/visuals/research.js";
import "../book/edition2/visuals/plates.js";
import { diagram } from "./figures.mjs";
import { armPlate } from "./arm-plates.mjs";
import {
  authoredMath,
  explainEquation,
  mathToSpeech,
} from "../book/voice/math-speech.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const figurePlan = JSON.parse(read("book/figure-plan.json"));
const plannedFigures = new Map(figurePlan.items.map((item) => [item.id, item]));
const authoredWidgets = JSON.parse(
  read("book/voice/widget-narration.json"),
).widgets;
const authoredTables = JSON.parse(
  read("book/voice/table-narration.json"),
).widgets;
const reviewedEquations = fs.existsSync(
  path.join(root, "book/voice/equation-speech.json"),
)
  ? JSON.parse(read("book/voice/equation-speech.json")).items
  : {};

function decodeHtml(text) {
  return String(text)
    .replace(
      /&(?:nbsp|amp|lt|gt|quot|apos|#39|#x27|#8217|#8212|#8211);/g,
      (entity) =>
        ({
          "&nbsp;": " ",
          "&amp;": "&",
          "&lt;": "<",
          "&gt;": ">",
          "&quot;": '"',
          "&apos;": "'",
          "&#39;": "'",
          "&#x27;": "'",
          "&#8217;": "’",
          "&#8212;": "—",
          "&#8211;": "–",
        })[entity] ?? entity,
    )
    .replace(/&#(\d+);/g, (_, decimal) =>
      String.fromCodePoint(Number(decimal)),
    );
}

function stripTags(html) {
  return decodeHtml(
    String(html)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeProse(markdown) {
  return String(markdown)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\\([*_])/g, "$1");
}

function speechText(source) {
  return decodeHtml(
    normalizeProse(source)
      .replace(/\$\$([\s\S]*?)\$\$|\$([^\n$]+)\$/g, (_, display, inline) =>
        mathToSpeech(display ?? inline),
      )
      .replace(/\bJEPA\b/g, "J E P A")
      .replace(/\bSIGReg\b/g, "sig reg")
      .replace(/\bLeWM\b/g, "L E W M")
      .replace(/\bMPC\b/g, "M P C")
      .replace(/\bCEM\b/g, "C E M")
      .replace(/\bCDF\b/g, "C D F")
      .replace(/\bKL\b/g, "K L")
      .replace(/\bCF\b/g, "characteristic function")
      .replace(/→|⇒/g, " leads to ")
      .replace(/≤/g, " is at most ")
      .replace(/≥/g, " is at least ")
      .replace(/×/g, " by ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function sentenceContaining(source, start, end) {
  const previous = source.slice(0, start);
  const next = source.slice(end);
  const begin = Math.max(
    previous.lastIndexOf(". "),
    previous.lastIndexOf("? "),
    previous.lastIndexOf("! "),
  );
  const stops = [
    next.indexOf(". "),
    next.indexOf("? "),
    next.indexOf("! "),
  ].filter((i) => i >= 0);
  const finish = stops.length ? Math.min(...stops) + 1 : next.length;
  return source.slice(begin < 0 ? 0 : begin + 2, end + finish).trim();
}

function firstSentence(text, max = 360) {
  const cleaned = speechText(text).trim();
  if (!cleaned) return "";
  const sentence =
    cleaned.match(/^.{8,}?[.!?](?:\s|$)/)?.[0]?.trim() ?? cleaned;
  return sentence.length <= max
    ? sentence
    : sentence.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function mathMatches(text) {
  const matches = [];
  for (const match of text.matchAll(/\$\$([\s\S]*?)\$\$|\$([^\n$]+)\$/g)) {
    matches.push({
      latex: match[1] ?? match[2],
      display: match[1] !== undefined,
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return matches;
}

function renderedMath(html) {
  const formulas = [];
  const unique = new Set();
  for (const [, encoded] of html.matchAll(
    /<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/g,
  )) {
    const latex = decodeHtml(encoded);
    if (unique.has(latex)) continue;
    unique.add(latex);
    formulas.push(latex);
  }
  return formulas;
}

function visibleTextIn(html, tag, className) {
  const classPart = className ? `[^>]*class="[^"]*${className}[^"]*"` : "[^>]*";
  const match = html.match(
    new RegExp(`<${tag}${classPart}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  );
  return match ? stripTags(match[1]) : "";
}

function htmlAttribute(html, name) {
  return decodeHtml(html.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? "");
}

function itemOf(kind, metadata) {
  return { kind, ...metadata };
}

export function buildVoiceIndex() {
  const items = [];
  const sections = [];
  const chapterRecords = [];
  const counts = {};
  const duplicateIds = new Map();
  const add = (kind, fields) => {
    const baseId =
      kind === "widget"
        ? `visual-${fields.figureId}`
        : `${fields.chapterId}-${kind}-${createHash("sha1")
            .update(
              [
                kind,
                fields.chapterId,
                fields.title ?? "",
                fields.latex ?? fields.text ?? "",
              ].join("|"),
            )
            .digest("hex")
            .slice(0, 10)}`;
    const repetition = duplicateIds.get(baseId) ?? 0;
    duplicateIds.set(baseId, repetition + 1);
    const id = repetition ? `${baseId}-${repetition + 1}` : baseId;
    const item = itemOf(kind, { id, ...fields });
    if (kind === "equation" && reviewedEquations[id]) {
      item.speech = reviewedEquations[id];
      item.speechSource = "reviewed";
    }
    items.push(item);
    counts[kind] = (counts[kind] ?? 0) + 1;
    return item;
  };
  for (const [
    chapterId,
    chapterTitle,
    stage,
    prerequisites,
    outcome,
  ] of chapters) {
    const file = `book/edition2/${chapterId}.md`;
    const source = read(file);
    const tokens = marked.lexer(source);
    const chapter = {
      id: chapterId,
      title: chapterTitle,
      stage,
      prerequisites,
      outcome,
      sectionIds: [],
      itemIds: [],
    };
    chapterRecords.push(chapter);
    let section = {
      id: chapterId,
      chapterId,
      title: chapterTitle,
      itemIds: [],
      summary: "",
    };
    sections.push(section);
    chapter.sectionIds.push(section.id);
    let headingNumber = 0;
    let tableNumber = 0;
    let diagramNumber = 0;
    let plateNumber = 0;
    let codeNumber = 0;
    let sourceCursor = 0;
    let latestProse = "";
    let detailsTitle = "";
    const push = (kind, fields) => {
      const item = add(kind, { chapterId, sectionId: section.id, ...fields });
      section.itemIds.push(item.id);
      chapter.itemIds.push(item.id);
      return item;
    };
    for (const token of tokens) {
      const pos = source.indexOf(token.raw, sourceCursor);
      const line =
        pos < 0 ? undefined : source.slice(0, pos).split("\n").length;
      if (pos >= 0) sourceCursor = pos + token.raw.length;
      if (token.type === "heading") {
        if (token.depth === 1) {
          push("heading", {
            title: stripTags(token.text),
            text: stripTags(token.text),
            speech: speechText(token.text),
            headingLevel: 1,
            playback: true,
            locator: { selector: `#${chapterId} h1` },
            sourceLine: line,
          });
          continue;
        }
        if (token.depth === 2) {
          section = {
            id: `${chapterId}-${++headingNumber}`,
            chapterId,
            title: stripTags(token.text),
            itemIds: [],
            summary: "",
          };
          sections.push(section);
          chapter.sectionIds.push(section.id);
          latestProse = "";
        }
        push("heading", {
          title: stripTags(token.text),
          text: stripTags(token.text),
          speech: speechText(token.text),
          locator: { selector: `#${section.id}` },
          playback: true,
          sourceLine: line,
        });
        continue;
      }
      if (token.type === "space") continue;
      if (token.type === "paragraph") {
        const raw = token.text.trim();
        if (!raw) continue;
        const matches = mathMatches(raw);
        const displayOnly =
          matches.length === 1 &&
          matches[0].display &&
          raw.replace(/\$\$[\s\S]*?\$\$/g, "").trim().length < 2;
        if (!displayOnly) {
          const text = speechText(raw);
          const plainHint = normalizeProse(raw)
            .replace(/\$\$[\s\S]*?\$\$|\$[^\n$]+\$/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          const paragraph = push("paragraph", {
            text: normalizeProse(raw),
            speech: text,
            playback: true,
            sourceLine: line,
            locator: {
              sectionId: section.id,
              textHint: (plainHint || text).slice(0, 180),
            },
            detailsTitle: detailsTitle || undefined,
          });
          if (!section.summary) section.summary = firstSentence(raw);
          latestProse = raw;
          paragraph.formulaCount = matches.length || undefined;
        }
        for (const formula of matches) {
          const sentence = displayOnly
            ? ""
            : sentenceContaining(raw, formula.start, formula.end);
          const interpretation = sentence || firstSentence(latestProse);
          const isDisplay = formula.display;
          const isAuthored = authoredMath.some(([pattern]) =>
            pattern.test(formula.latex),
          );
          const speech =
            isDisplay || isAuthored
              ? explainEquation(
                  formula.latex,
                  interpretation ? speechText(interpretation) : "",
                )
              : speechText(sentence || raw);
          push("equation", {
            text: formula.latex,
            latex: formula.latex,
            speech,
            display: isDisplay,
            speechSource: isAuthored ? "authored" : "heuristic",
            playback: isDisplay,
            sourceLine: line,
            locator: { sectionId: section.id, latex: formula.latex },
            detailsTitle: detailsTitle || undefined,
          });
        }
        continue;
      }
      if (token.type === "table") {
        const headers = token.header.map((cell) => speechText(cell.text));
        const rows = token.rows.map((row) =>
          row.map((cell) => speechText(cell.text)),
        );
        const rowSpeech = rows.map((row) =>
          row
            .map((cell, i) => (i === 0 ? cell : `${headers[i]}: ${cell}`))
            .join("; "),
        );
        const speech = `This table compares ${headers.join(", ")}. ${rowSpeech.join(". ")}.`;
        const tableIndex = tableNumber++;
        const table = push("table", {
          title: `Table in ${section.title}`,
          text: rows.map((row) => row.join(" | ")).join("\n"),
          speech,
          headers,
          rows,
          playback: true,
          sourceLine: line,
          locator: { chapterId, tableIndex },
        });
        rowSpeech.forEach((sentence, i) =>
          push("tableRow", {
            title: rows[i][0],
            text: rows[i].join(" | "),
            speech: sentence,
            parentId: table.id,
            playback: false,
            sourceLine: line,
            locator: { parentId: table.id, row: i },
          }),
        );
        for (const [rowIndex, row] of token.rows.entries())
          for (const [cellIndex, cell] of row.entries())
            for (const formula of mathMatches(cell.text))
              push("equation", {
                title: `Equation in ${section.title} table`,
                text: formula.latex,
                latex: formula.latex,
                speech: explainEquation(
                  formula.latex,
                  `${headers[cellIndex]}: ${rows[rowIndex][cellIndex]}`,
                ),
                speechSource: authoredMath.some(([pattern]) =>
                  pattern.test(formula.latex),
                )
                  ? "authored"
                  : "heuristic",
                display: formula.display,
                playback: false,
                parentId: table.id,
                sourceLine: line,
                locator: {
                  parentId: table.id,
                  row: rowIndex,
                  cell: cellIndex,
                  latex: formula.latex,
                },
              });
        for (const [cellIndex, cell] of token.header.entries())
          for (const formula of mathMatches(cell.text))
            push("equation", {
              title: `Equation in ${section.title} table header`,
              text: formula.latex,
              latex: formula.latex,
              speech: explainEquation(formula.latex, headers[cellIndex]),
              speechSource: authoredMath.some(([pattern]) =>
                pattern.test(formula.latex),
              )
                ? "authored"
                : "heuristic",
              display: formula.display,
              playback: false,
              parentId: table.id,
              sourceLine: line,
              locator: {
                parentId: table.id,
                headerCell: cellIndex,
                latex: formula.latex,
              },
            });
        continue;
      }
      if (token.type === "list") {
        const listText = token.items.map((part) => speechText(part.text));
        const list = push("list", {
          text: listText.join("\n"),
          speech: listText.join(". "),
          playback: true,
          sourceLine: line,
          locator: { sectionId: section.id },
        });
        for (const part of token.items)
          for (const formula of mathMatches(part.text))
            push("equation", {
              text: formula.latex,
              latex: formula.latex,
              speech: explainEquation(
                formula.latex,
                sentenceContaining(part.text, formula.start, formula.end),
              ),
              speechSource: authoredMath.some(([pattern]) =>
                pattern.test(formula.latex),
              )
                ? "authored"
                : "heuristic",
              display: formula.display,
              playback: false,
              parentId: list.id,
              sourceLine: line,
              locator: { parentId: list.id, latex: formula.latex },
            });
        continue;
      }
      if (token.type !== "html") continue;
      const html = token.text.trim();
      if (/^<p class="course-kicker"/.test(html)) continue;
      if (html === "<!-- LEARNING_ROUTE -->") {
        // The HTML build expands this source marker into a table. Mirror that
        // source-derived expansion here so its 19 rows are addressable by voice.
        const route = chapters.filter(([id]) => id !== "reference");
        const table = push("table", {
          title: "The learning route",
          text: route.map(([, title, stage, , outcome]) =>
            `${stage} | ${title} | ${outcome}`,
          ).join("\n"),
          speech:
            "This route connects each chapter to the reason for reading it and a check you can use before moving on. Begin with the missing world behind an observation, then build the mathematical and learning tools, study joint-embedding prediction, and finish by examining the paper and the browser laboratory. Select a row to hear its chapter and learning check. The table is a map, not a requirement to memorize every chapter before starting.",
          speechSource: "authored",
          headers: ["Stage", "Read", "Check before moving on"],
          playback: true,
          sourceLine: line,
          locator: { selector: "#reference .table-wrap", index: 1 },
        });
        for (const [row, [, title, stage, , outcome]] of route.entries())
          push("tableRow", {
            title,
            text: `${stage} | ${title} | ${outcome}`,
            speech: `${title}, in the ${stage} stage. Before moving on: ${speechText(outcome)}`,
            speechSource: "authored",
            parentId: table.id,
            playback: false,
            sourceLine: line,
            locator: { parentId: table.id, row },
          });
        continue;
      }
      if (/^<div class="course-banner"/.test(html)) {
        const alt = html.match(/<img\b[^>]*\balt="([^"]*)"/)?.[1] ?? "";
        push("image", {
          title: "Course banner",
          text: alt,
          speech: speechText(alt),
          playback: false,
          sourceLine: line,
          locator: { selector: `#${chapterId} .course-banner` },
        });
        continue;
      }
      if (/^<div class="course-promise"/.test(html)) {
        const editorialSpeech =
          "You can begin with basic algebra, an introduction to vectors and probability, and the idea of a derivative. The course then builds the missing tools: embeddings, covariance, gradients, neurons, regularization, normality tests, characteristic functions, and attention. Finally, you will derive SIGReg, train a small world model in your browser, plan with its predictions, and read LeWorldModel's equations and experiments critically.";
        const content = stripTags(html);
        push("paragraph", {
          text: content,
          speech: editorialSpeech,
          speechSource: "authored",
          playback: true,
          sourceLine: line,
          locator: { selector: `#${chapterId} .course-promise` },
        });
        continue;
      }
      const visualId = html.match(/<!-- VISUAL: (\w+) -->/)?.[1];
      if (visualId) {
        const spec = registry[visualId];
        if (!spec)
          throw new Error(`Unregistered visual ${visualId} in ${file}:${line}`);
        const state = stateFor(spec);
        const initialHtml = spec.draw(state);
        const plan = plannedFigures.get(visualId);
        const authored = authoredWidgets[visualId];
        const controls =
          authored?.controls ??
          (spec.controls ?? []).map((control) => ({
            key: control.key,
            label: control.label,
            type: control.type,
            defaultValue: control.value,
            options: control.options ?? undefined,
          }));
        const caption = speechText(spec.caption);
        const question = speechText(spec.question);
        const panelTitles = [
          ...initialHtml.matchAll(/<h4>([\s\S]*?)<\/h4>/g),
        ].map((match) => stripTags(match[1]));
        const speech = [
          spec.title + ".",
          question,
          panelTitles.length
            ? `The display has ${panelTitles.join(", and ")}.`
            : "",
          caption,
          controls.length
            ? `Explore it with ${controls.map((control) => control.label).join(", ")}.`
            : "",
        ]
          .filter(Boolean)
          .join(" ");
        const widget = push("widget", {
          title: spec.title,
          figureId: visualId,
          text: `${spec.title}. ${spec.question} ${spec.caption}`,
          speech: authored?.speech ?? speech,
          speechSource: authored ? "authored" : "generated",
          question,
          caption,
          controls,
          panelTitles,
          agentNote: plan?.brief,
          playback: true,
          sourceLine: line,
          locator: { selector: `#visual-${visualId}` },
        });
        const tableCount = [...initialHtml.matchAll(/<table\b/g)].length;
        const tableScripts = authoredTables[visualId] ?? [];
        if (tableCount !== tableScripts.length)
          throw new Error(
            `Visual ${visualId} renders ${tableCount} tables but has ${tableScripts.length} table narrations`,
          );
        tableScripts.forEach((script, index) =>
          push("table", {
            title: script.title,
            text: `${spec.title}. ${script.headers.join(" | ")}`,
            speech: script.speech,
            speechSource: "authored",
            headers: script.headers,
            parentId: widget.id,
            playback: true,
            sourceLine: line,
            locator: {
              selector: `#visual-${visualId} .table-wrap`,
              index: index + 1,
            },
            agentNote: spec.controls?.length
              ? "The cells are recomputed when the widget controls change. The narration explains their meaning and may not quote the current numbers."
              : undefined,
          }),
        );
        for (const latex of renderedMath(initialHtml)) {
          push("widgetEquation", {
            title: `Equation in ${spec.title}`,
            text: latex,
            latex,
            speech: explainEquation(latex, `${spec.title}. ${question}`),
            parentId: widget.id,
            speechSource: authoredMath.some(([pattern]) => pattern.test(latex))
              ? "authored"
              : "heuristic",
            playback: false,
            sourceLine: line,
            locator: { figureId: visualId, latex },
          });
        }
        continue;
      }
      const diagramId = html.match(
        /<figure class="diagram" data-diagram="([^"]+)"/,
      )?.[1];
      if (diagramId) {
        const rendered = diagram(diagramId);
        const title = visibleTextIn(rendered, "title");
        const caption = visibleTextIn(rendered, "figcaption");
        push("diagram", {
          title,
          text: caption,
          speech: `${title}. ${speechText(caption)}`,
          playback: true,
          sourceLine: line,
          locator: {
            selector: `#${chapterId} figure.diagram`,
            index: ++diagramNumber,
          },
        });
        continue;
      }
      const armId = html.match(
        /<figure class="arm-plate" data-arm="([^"]+)"/,
      )?.[1];
      if (armId) {
        const rendered = armPlate(armId);
        const caption = visibleTextIn(rendered, "figcaption");
        push("plate", {
          title: `Robotic arm illustration: ${armId}`,
          text: caption,
          speech: speechText(caption),
          playback: true,
          sourceLine: line,
          locator: {
            selector: `#${chapterId} figure.arm-plate`,
            index: ++plateNumber,
          },
        });
        continue;
      }
      if (/<figure\b/.test(html)) {
        const artId = html.match(/data-art="([^"]+)"/)?.[1];
        const alt = html.match(/<img\b[^>]*\balt="([^"]*)"/)?.[1] ?? "";
        const caption = visibleTextIn(html, "figcaption");
        const figure = push("image", {
          title: alt || artId || "Course illustration",
          figureId: artId,
          text: `${alt} ${caption}`,
          speech: speechText(`${alt}. ${caption}`),
          playback: true,
          sourceLine: line,
          locator: artId
            ? { selector: `#${chapterId} figure[data-art="${artId}"]` }
            : { selector: `#${chapterId} figure.plate`, index: ++plateNumber },
        });
        if (artId && plannedFigures.has(artId))
          figure.agentNote = plannedFigures.get(artId).brief;
        continue;
      }
      const openingDiv = html.match(/^<div\b[^>]*>/)?.[0] ?? "";
      const labId = /\bclass="[^"]*\blab\b[^"]*"/.test(openingDiv)
        ? htmlAttribute(openingDiv, "id")
        : "";
      if (labId) {
        const title = visibleTextIn(html, "h3") || labId.replaceAll("-", " ");
        const instruction =
          visibleTextIn(html, "p", "instruction") || visibleTextIn(html, "p");
        const notes = [
          ...html.matchAll(/<p class="lab-note"[^>]*>([\s\S]*?)<\/p>/g),
        ]
          .map((match) => stripTags(match[1]))
          .filter(Boolean);
        const canvases = [
          ...html.matchAll(/<canvas\b[^>]*\baria-label="([^"]+)"/g),
        ].map((match) => decodeHtml(match[1]));
        const controls = [
          ...html.matchAll(/<label\b[^>]*>([\s\S]*?)<(?:input|select)/g),
        ]
          .map((match) => stripTags(match[1]))
          .filter(Boolean);
        push("lab", {
          title,
          text: [instruction, ...notes].join(" "),
          speech: speechText(
            [
              title,
              instruction,
              canvases.length
                ? `The views show ${canvases.join(", and ")}.`
                : "",
              ...notes,
            ]
              .filter(Boolean)
              .join(". "),
          ),
          controls,
          canvases,
          playback: true,
          sourceLine: line,
          locator: { selector: `#${labId}` },
        });
        continue;
      }
      const codePath = html.match(/<!-- CODE: ([^ ]+) -->/)?.[1];
      if (codePath) {
        push("code", {
          title: path.basename(codePath),
          text: codePath,
          speech: `The reference implementation here is ${path.basename(codePath)}. The nearby prose explains how its steps match the equations.`,
          playback: true,
          sourceLine: line,
          locator: {
            sectionId: section.id,
            file: codePath,
            codeIndex: codeNumber++,
          },
        });
        continue;
      }
      if (html.startsWith("<details")) {
        detailsTitle = visibleTextIn(html, "summary");
        if (detailsTitle)
          push("detailHeading", {
            title: detailsTitle,
            text: detailsTitle,
            speech: speechText(detailsTitle),
            playback: true,
            sourceLine: line,
            locator: { sectionId: section.id, detailsTitle },
          });
        continue;
      }
      if (html.startsWith("</details")) {
        detailsTitle = "";
        continue;
      }
      // Lead copy and editorial boxes are still part of the listening path.
      if (/<p\b/.test(html) && !/<(?:script|style)\b/.test(html)) {
        const text = stripTags(html);
        if (text) {
          push("paragraph", {
            text,
            speech: speechText(text),
            playback: true,
            sourceLine: line,
            locator: { sectionId: section.id, textHint: text.slice(0, 90) },
          });
          if (!section.summary) section.summary = firstSentence(text);
          latestProse = text;
        }
      }
    }
    chapter.summary =
      sections.find((entry) => entry.chapterId === chapterId && entry.summary)
        ?.summary ?? outcome;
  }
  const index = {
    version: 1,
    chapters: chapterRecords,
    sections,
    items,
    counts,
  };
  index.sourceHash = createHash("sha256")
    .update(JSON.stringify(index))
    .digest("hex");
  const expectedVisuals = [...sourceVisualIds()];
  const indexedVisuals = new Set(
    items.filter((item) => item.kind === "widget").map((item) => item.figureId),
  );
  const missingVisuals = expectedVisuals.filter(
    (id) => !indexedVisuals.has(id),
  );
  if (missingVisuals.length)
    throw new Error(`Voice index misses visuals: ${missingVisuals.join(", ")}`);
  return index;
}

function* sourceVisualIds() {
  for (const [id] of chapters) {
    const source = read(`book/edition2/${id}.md`);
    for (const [, visualId] of source.matchAll(/<!-- VISUAL: (\w+) -->/g))
      yield visualId;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const index = buildVoiceIndex();
  const output = path.join(root, "book/voice/course-index.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(index));
  console.log(
    `Voice index: ${index.chapters.length} chapters, ${index.sections.length} sections, ${index.items.length} items (${Object.entries(
      index.counts,
    )
      .map(([kind, count]) => `${count} ${kind}`)
      .join(", ")}), ${(fs.statSync(output).size / 1e6).toFixed(2)} MB`,
  );
}
