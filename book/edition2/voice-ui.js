import { icon } from "../../tools/icons.mjs";
import { NarrationPlayer, listElevenLabsVoices, clearNarrationCache } from "./voice-narration.js";
import { LiveCourseAssistant } from "./live-assistant.js";
import { attachVoiceIndex } from "./voice-index-runtime.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const index = JSON.parse($("#course-voice-index").textContent);
const tutorNotes = JSON.parse($("#course-tutor-notes").textContent).notes;
const noteById = new Map(tutorNotes.map((note) => [`note:${note.id}`, note]));
const itemById = new Map(index.items.map((item) => [item.id, item]));
const sectionById = new Map(index.sections.map((section) => [section.id, section]));
const chapterById = new Map(index.chapters.map((chapter) => [chapter.id, chapter]));
const bound = attachVoiceIndex(index, document);
const playback = index.items.filter((item) => item.playback !== false && bound.get(item.id));
const DEFAULT_VOICE = { id: "hpp4J3VqNfWAUOO0d1Us", name: "Bella" };
const memory = { openai: "", elevenlabs: "", voice: DEFAULT_VOICE, remember: false };
try {
  Object.assign(memory, JSON.parse(sessionStorage.getItem("world-voice-settings") || localStorage.getItem("world-voice-settings") || "{}"));
} catch {}
const settingsStore = () => {
  const saved = JSON.stringify(memory);
  sessionStorage.setItem("world-voice-settings", saved);
  if (memory.remember) localStorage.setItem("world-voice-settings", saved);
  else localStorage.removeItem("world-voice-settings");
};

// The controls are an unobtrusive extension of the existing reader header.
const printButton = $("#print");
const settingsButton = document.createElement("button");
settingsButton.id = "voice-settings-button";
settingsButton.type = "button";
settingsButton.setAttribute("aria-label", "Listening and assistant settings");
settingsButton.title = "Listening and assistant settings";
settingsButton.innerHTML = icon("settings");
printButton.before(settingsButton);
const listenButton = document.createElement("button");
listenButton.id = "course-listen-button";
listenButton.type = "button";
listenButton.innerHTML = `${icon("headphones")}<span>Listen</span>`;
listenButton.setAttribute("aria-label", "Listen from this part of the course");
settingsButton.before(listenButton);
const assistantButton = document.createElement("button");
assistantButton.id = "course-assistant-button";
assistantButton.type = "button";
assistantButton.innerHTML = `${icon("mic")}<span>Assistant</span>`;
assistantButton.setAttribute("aria-label", "Open the voice assistant");
settingsButton.before(assistantButton);

const settings = document.createElement("dialog");
settings.id = "voice-settings";
settings.setAttribute("aria-labelledby", "voice-settings-title");
settings.innerHTML = `<div class="voice-modal-head"><div><span class="voice-eyebrow">YOUR LISTENING SPACE</span><h2 id="voice-settings-title">Voices &amp; keys</h2></div><button type="button" class="voice-icon-button" data-close-settings aria-label="Close settings">${icon("close")}</button></div><p class="voice-modal-intro">Listen with ElevenLabs. Discuss the course with GPT-Live 1. Your keys go directly from this browser to their providers; the course never includes a shared key.</p><div class="voice-key-grid"><label>ElevenLabs API key<input id="voice-eleven-key" type="password" autocomplete="off" spellcheck="false" placeholder="Paste your ElevenLabs key"></label><label>OpenAI API key<input id="voice-openai-key" type="password" autocomplete="off" spellcheck="false" placeholder="Paste your OpenAI key"></label></div><div class="voice-key-actions"><label class="voice-check"><input id="voice-remember" type="checkbox"><span>Remember keys on this device</span></label><button type="button" id="voice-check-keys">Check connections</button><button type="button" id="voice-clear-keys">Clear keys</button></div><p id="voice-connection-status" class="voice-small" role="status">Keys are kept for this tab unless you choose to remember them.</p><div class="voice-voice-heading"><div><span class="voice-eyebrow">NARRATOR</span><h3>Choose a voice</h3></div><button type="button" id="voice-load-voices">Browse your voices</button></div><input id="voice-search" type="search" placeholder="Find a voice" aria-label="Find a voice" hidden><div id="voice-choices" class="voice-choices" role="group" aria-label="Narrator voices"></div><div class="voice-modal-foot"><button type="button" id="voice-clear-cache">Clear saved audio</button><span>Generated audio is cached on this device to avoid repeated synthesis.</span></div>`;
document.body.append(settings);

const player = document.createElement("section");
player.id = "course-player";
player.className = "voice-player";
player.hidden = true;
player.setAttribute("aria-label", "Course narration");
player.innerHTML = `<div class="voice-player-main"><span class="voice-player-mark">${icon("headphones")}</span><div class="voice-player-copy"><span id="voice-player-kicker">NOW LISTENING</span><strong id="voice-player-title">Course narration</strong><span id="voice-player-caption" aria-live="off"></span></div><div class="voice-player-actions"><button type="button" data-voice-action="previous" aria-label="Previous passage">${icon("previous")}</button><button type="button" data-voice-action="toggle" aria-label="Pause narration">${icon("pause")}</button><button type="button" data-voice-action="next" aria-label="Next passage">${icon("next")}</button><button type="button" data-voice-action="stop" aria-label="Stop narration">${icon("close")}</button></div></div><div class="voice-player-bottom"><input id="voice-seek" type="range" min="0" max="1000" value="0" aria-label="Narration position"><span id="voice-time">0:00 / 0:00</span><button type="button" id="voice-follow" aria-pressed="true">Follow</button></div>`;
document.body.append(player);

const assistantPanel = document.createElement("aside");
assistantPanel.id = "course-assistant";
assistantPanel.className = "voice-assistant";
assistantPanel.hidden = true;
assistantPanel.setAttribute("aria-label", "World models assistant");
assistantPanel.innerHTML = `<div class="voice-assistant-head"><span class="voice-assistant-orb" aria-hidden="true"></span><div><span class="voice-eyebrow">COURSE COMPANION</span><h2>Talk it through</h2></div><button type="button" id="assistant-close" class="voice-icon-button" aria-label="Close assistant panel">${icon("close")}</button></div><p class="voice-assistant-intro">Ask about what is on this page. I can find a lesson, point to an equation, change a widget, or read a passage aloud.</p><div id="assistant-context" class="voice-context"></div><div id="assistant-captions" class="voice-captions" role="log" aria-live="polite"><p>Start a conversation, or type a question below.</p></div><p id="assistant-status" class="voice-small" role="status">Ready to connect</p><div class="voice-assistant-controls"><button type="button" id="assistant-start" class="primary">${icon("mic")}<span>Start talking</span></button><button type="button" id="assistant-mute" hidden>${icon("micOff")}<span>Mute mic</span></button><button type="button" id="assistant-end" hidden>End</button></div><form id="assistant-form"><label class="voice-sr-only" for="assistant-input">Ask the assistant</label><input id="assistant-input" type="text" autocomplete="off" placeholder="Ask about this lesson…"><button type="submit" aria-label="Send question">${icon("next")}</button></form>`;
document.body.append(assistantPanel);

const selectionMenu = document.createElement("div");
selectionMenu.id = "voice-selection-menu";
selectionMenu.className = "voice-selection-menu";
selectionMenu.hidden = true;
selectionMenu.innerHTML = `<button type="button" data-selection-action="listen">${icon("headphones")}Listen</button><button type="button" data-selection-action="explain">${icon("science")}Explain</button>`;
document.body.append(selectionMenu);

let assistant = null;
let selected = null;
let currentElement = null;
let narratorOwnedByAssistant = false;
let assistantAudioBeforeNarration = null;
let lastContext = "";
let contextTimer = 0;
let availableVoices = [DEFAULT_VOICE];
let pendingAction = null;
let lastCaption = { role: "", at: 0, endMs: 0 };
let speakingTimer = 0;

function quietAssistantForNarration() {
  if (!assistant?.isConnected) return;
  if (!narratorOwnedByAssistant) {
    assistantAudioBeforeNarration = { input: assistant.muted, output: assistant.outputMuted };
  }
  assistant.setMuted(true);
  assistant.setOutputMuted(true);
  narratorOwnedByAssistant = true;
}

function returnAudioToAssistant() {
  if (!narratorOwnedByAssistant) return;
  assistant?.setMuted(assistantAudioBeforeNarration?.input || false);
  assistant?.setOutputMuted(assistantAudioBeforeNarration?.output || false);
  assistantAudioBeforeNarration = null;
  narratorOwnedByAssistant = false;
}

const narrator = new NarrationPlayer({
  getKey: () => memory.elevenlabs,
  getVoice: () => memory.voice.id,
  onState: ({ state, error }) => {
    if (state === "loading" || state === "playing") quietAssistantForNarration();
    player.hidden = state === "stopped" || state === "finished";
    player.dataset.state = state;
    const toggle = $('[data-voice-action="toggle"]', player);
    toggle.innerHTML = icon(state === "playing" ? "pause" : "play");
    toggle.setAttribute("aria-label", state === "playing" ? "Pause narration" : "Resume narration");
    $("#voice-player-kicker").textContent = state === "loading" ? "PREPARING AUDIO" : state === "error" ? "AUDIO UNAVAILABLE" : state === "paused" ? "PAUSED" : "NOW LISTENING";
    if (error) $("#voice-player-caption").textContent = error;
    if (state === "paused") returnAudioToAssistant();
    if (state === "stopped" || state === "finished" || state === "error") {
      currentElement?.classList.remove("voice-current");
      currentElement = null;
      returnAudioToAssistant();
    }
  },
  onItem: (item, place, total) => {
    currentElement?.classList.remove("voice-current");
    currentElement = bound.get(item.id) || null;
    currentElement?.classList.add("voice-current");
    const enclosingDetails = currentElement?.closest("details");
    if (enclosingDetails) enclosingDetails.open = true;
    if (narrator.follow) currentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    $("#voice-player-title").textContent = item.title || item.text?.slice(0, 76) || "Selected passage";
    $("#voice-player-kicker").textContent = `${place + 1} OF ${total} · COURSE AUDIO`;
    $("#voice-player-caption").textContent = item.speech || item.text || "";
  },
  onProgress: ({ time, duration, speech, character }) => {
    $("#voice-seek").value = duration ? String(Math.round((time / duration) * 1000)) : "0";
    $("#voice-time").textContent = `${clock(time)} / ${clock(duration)}`;
    const from = Math.max(0, speech.lastIndexOf(" ", Math.max(0, character - 38)) + 1);
    const to = Math.min(speech.length, speech.indexOf(" ", character + 80) < 0 ? speech.length : speech.indexOf(" ", character + 80));
    $("#voice-player-caption").textContent = speech.slice(from, to);
  },
});

function clock(seconds) {
  const n = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

function itemForElement(element) {
  const host = element?.closest?.("[data-voice-id]");
  return host ? itemById.get(host.dataset.voiceId) : null;
}

function itemInView() {
  const point = document.elementFromPoint(Math.min(innerWidth - 24, Math.max(220, innerWidth * 0.53)), Math.min(innerHeight - 80, Math.max(130, innerHeight * 0.36)));
  const direct = itemForElement(point);
  if (direct && direct.playback !== false) return direct;
  return playback.find((item) => {
    const rect = bound.get(item.id)?.getBoundingClientRect();
    return rect && rect.bottom > 90 && rect.top < innerHeight * 0.7;
  }) || playback[0];
}

function selectedItem() {
  const selection = getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) return null;
  const node = selection.anchorNode?.nodeType === 1 ? selection.anchorNode : selection.anchorNode?.parentElement;
  if (!node?.closest?.("main")) return null;
  const item = itemForElement(node);
  return { item, text: selection.toString().trim().slice(0, 4200), rect: selection.getRangeAt(0).getBoundingClientRect() };
}

function showSelectionMenu() {
  if (settings.open || !assistantPanel.hidden && assistantPanel.contains(document.activeElement)) return;
  selected = selectedItem();
  if (!selected) { selectionMenu.hidden = true; return; }
  const width = 192;
  const x = Math.max(12, Math.min(innerWidth - width - 12, selected.rect.left + selected.rect.width / 2 - width / 2));
  const y = selected.rect.top > 76 ? selected.rect.top - 48 : selected.rect.bottom + 12;
  selectionMenu.style.left = `${x}px`;
  selectionMenu.style.top = `${Math.max(66, Math.min(innerHeight - 52, y))}px`;
  selectionMenu.hidden = false;
}

async function listen(item, selectionText = "", continuous = false) {
  selectionMenu.hidden = true;
  if (!memory.elevenlabs) {
    pendingAction = { provider: "elevenlabs", run: () => listen(item, selectionText, continuous) };
    settings.showModal();
    $("#voice-eleven-key").focus();
    return;
  }
  quietAssistantForNarration();
  const source = item || itemInView();
  const math = source?.kind === "equation" || source?.kind === "widgetEquation";
  const widget = source?.kind === "widget";
  let extra = "";
  if (widget) extra = widgetState(source.id).speech;
  const selectedSpeech = selectionText && !math ? selectionText : "";
  const first = selectedSpeech
    ? { id: source?.id || "selection", title: "Your selection", text: selectedSpeech, speech: selectedSpeech }
    : { ...source, speech: (source?.speech || source?.text || "") + (extra ? " " + extra : "") };
  const offset = source ? playback.findIndex((entry) => entry.id === source.id) : -1;
  const queue = continuous && offset >= 0 ? [first, ...playback.slice(offset + 1)] : [first];
  try {
    const started = await narrator.play(queue);
    return started ? { ok: true } : { ok: false, error: narrator.lastError?.message || "Narration did not start." };
  } catch (error) {
    narrator.onState({ state: "error", error: error.message || String(error) });
    player.hidden = false;
    return { ok: false, error: error.message || String(error) };
  }
}

function widgetState(id) {
  const item = itemById.get(id);
  const widgetId = item?.locator?.selector?.match(/visual-([A-Z]\d+)/)?.[1] || id.replace(/^visual-/, "");
  const element = document.getElementById(`visual-${widgetId}`);
  if (!element) return { id: widgetId, controls: [], actions: [], observations: [], speech: "" };
  const controls = [];
  for (const input of $$('input[data-key]', element)) {
    controls.push({ key: input.dataset.key, label: input.getAttribute("aria-label") || input.dataset.key, value: input.value, min: input.min, max: input.max });
  }
  const choices = new Map();
  for (const button of $$('button[data-key][data-value]', element)) {
    const key = button.dataset.key;
    if (!choices.has(key)) choices.set(key, { key, label: button.closest('[role="group"]')?.getAttribute("aria-label") || key, value: "", options: [] });
    const group = choices.get(key);
    group.options.push(button.dataset.value);
    if (button.getAttribute("aria-pressed") === "true") group.value = button.dataset.value;
  }
  controls.push(...choices.values());
  const actions = $$('button[data-action]', element).map((button) => ({
    key: button.dataset.action,
    label: button.textContent.trim() || button.getAttribute("aria-label") || button.dataset.action,
    disabled: button.disabled,
  }));
  const observations = $$('.visual-note, output', element)
    .map((node) => node.textContent.trim().replace(/\s+/g, " "))
    .filter((value) => value && value.length > 3)
    .slice(0, 6);
  return { id: widgetId, controls, actions, observations, speech: controls.length ? "Current controls: " + controls.map((c) => `${c.label} is ${c.value}`).join("; ") + "." : "" };
}

function currentContext() {
  const item = itemInView();
  const section = item && sectionById.get(item.sectionId);
  const chapter = item && chapterById.get(item.chapterId);
  const selection = selectedItem();
  const visibleWidget = item?.kind === "widget" ? item : index.items.find((entry) => {
    if (entry.kind !== "widget") return false;
    const rect = bound.get(entry.id)?.getBoundingClientRect();
    return rect && rect.top < innerHeight * 0.65 && rect.bottom > 100;
  });
  const widget = visibleWidget ? widgetState(visibleWidget.id) : null;
  return {
    chapter: chapter ? { id: chapter.id, title: chapter.title, summary: chapter.summary } : null,
    section: section ? { id: section.id, title: section.title, summary: section.summary } : null,
    focus: item ? { id: item.id, kind: item.kind, text: item.text?.slice(0, 650), speech: item.speech?.slice(0, 550) } : null,
    selection: selection?.text?.slice(0, 500) || "",
    widget,
  };
}

function updateContext() {
  const context = currentContext();
  $("#assistant-context").textContent = context.section && context.section.title !== context.chapter?.title ? `${context.chapter?.title || "Course"} · ${context.section.title}` : context.chapter?.title || "The course";
  if (!assistant) return;
  const short = JSON.stringify(context);
  if (short !== lastContext) {
    lastContext = short;
    assistant.sendContext(short.slice(0, 2200));
  }
}

function searchCourse(query, limit = 6) {
  const terms = String(query || "").toLowerCase().split(/\W+/).filter((term) => term.length > 2).slice(0, 8);
  if (!terms.length) return [];
  const passageMatches = index.items.map((item) => {
    const title = (item.title || "").toLowerCase();
    const text = (item.text || "").toLowerCase();
    const speech = (item.speech || "").toLowerCase();
    const score = terms.reduce((sum, term) => sum + (title.includes(term) ? 5 : 0) + (text.includes(term) ? 2 : 0) + (speech.includes(term) ? 1 : 0), 0);
    return { item, score };
  }).filter(({ score }) => score > 0).map(({ item, score }) => ({
    score,
    result: { id: item.id, kind: item.kind, title: item.title || sectionById.get(item.sectionId)?.title, excerpt: (item.text || item.speech || "").slice(0, 420), sectionId: item.sectionId },
  }));
  const noteMatches = tutorNotes.map((note) => {
    const title = note.topic.toLowerCase();
    const keywords = note.keywords.join(" ").toLowerCase();
    const explanation = note.explanation.toLowerCase();
    const score = terms.reduce((sum, term) => sum + (title.includes(term) ? 6 : 0) + (keywords.includes(term) ? 4 : 0) + (explanation.includes(term) ? 1 : 0), 0);
    return { score, result: { id: `note:${note.id}`, kind: "tutorNote", title: note.topic, excerpt: note.explanation.slice(0, 420), chapterId: note.chapterId } };
  }).filter(({ score }) => score > 0);
  return [...passageMatches, ...noteMatches].sort((a, b) => b.score - a.score).slice(0, Math.min(10, Math.max(1, Number(limit) || 6))).map(({ result }) => result);
}

function resolveTarget(id) {
  const item = itemById.get(id);
  if (item) return { node: bound.get(id), item };
  if (sectionById.has(id) || chapterById.has(id)) return { node: document.getElementById(id), item: null };
  if (noteById.has(id)) return { node: document.getElementById(noteById.get(id).chapterId), item: null };
  if (/^[A-Z]\d+$/.test(String(id))) return { node: document.getElementById(`visual-${id}`), item: index.items.find((entry) => entry.locator?.selector === `#visual-${id}`) };
  return { node: null, item: null };
}

let pointed = null;
function pointTo(node) {
  pointed?.classList.remove("voice-pointed");
  pointed = node;
  node.classList.add("voice-pointed");
  node.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => { if (pointed === node) { node.classList.remove("voice-pointed"); pointed = null; } }, 9000);
}

async function performTool(name, args) {
  if (name === "get_page_context") return currentContext();
  if (name === "search_course") return { results: searchCourse(args.query, args.limit) };
  if (name === "get_course_entry") {
    const item = itemById.get(args.id);
    const note = noteById.get(args.id);
    const section = sectionById.get(args.id);
    const chapter = chapterById.get(args.id);
    if (item) return { ...item, widgetState: item.kind === "widget" ? widgetState(item.id) : undefined, section: sectionById.get(item.sectionId)?.summary };
    if (note) return { id: args.id, kind: "tutorNote", ...note };
    if (section || chapter) return section || chapter;
    return { error: "Unknown course entry" };
  }
  if (name === "navigate_to" || name === "highlight_entry") {
    const { node, item } = resolveTarget(args.id);
    if (!node) return { error: "Unknown course target" };
    if (name === "highlight_entry") pointTo(node);
    else node.scrollIntoView({ behavior: "smooth", block: "start" });
    return { ok: true, id: args.id, title: item?.title || node.textContent?.trim().slice(0, 90) };
  }
  if (name === "set_widget_control") {
    const visualId = String(args.id || "").replace(/^visual-/, "");
    const root = document.getElementById(`visual-${visualId}`);
    if (!root) return { error: "Unknown widget" };
    const key = String(args.control || "");
    const control = $$('[data-key], [data-action]', root).find((el) => (el.dataset.key || el.dataset.action) === key && (el.dataset.action || el.type === "range" || el.dataset.value === String(args.value)));
    if (!control) return { error: "Unknown control or choice" };
    if (control.type === "range") {
      const value = Number(args.value);
      if (!Number.isFinite(value) || value < Number(control.min) || value > Number(control.max)) return { error: "Value outside control range" };
      control.value = String(value);
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.dispatchEvent(new Event("change", { bubbles: true }));
    } else control.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    pointTo(root);
    return { ok: true, state: widgetState(visualId) };
  }
  if (name === "listen_to") {
    const { node, item } = resolveTarget(args.id);
    if (!node || !item) return { error: "Unknown narratable entry" };
    if (!memory.elevenlabs) return { error: "ElevenLabs key required in settings" };
    const result = await listen(item, "", false);
    return result.ok ? { ok: true, id: item.id, speech: item.speech } : result;
  }
  return { error: "Unknown tool" };
}

function caption({ speaker, delta, typed, startMs, endMs }) {
  const role = speaker;
  const text = delta;
  if (!text) return;
  const log = $("#assistant-captions");
  if (log.children.length === 1 && log.firstElementChild?.textContent === "Start a conversation, or type a question below.") log.replaceChildren();
  const last = log.lastElementChild;
  const sameUtterance = !typed && last?.dataset.role === role && last.dataset.partial === "true" && Date.now() - lastCaption.at < 1800 && (startMs == null || !lastCaption.endMs || startMs >= lastCaption.endMs - 300);
  if (sameUtterance) last.textContent += text;
  else {
    const p = document.createElement("p");
    p.dataset.role = role;
    p.dataset.partial = typed ? "false" : "true";
    p.textContent = text;
    log.append(p);
  }
  lastCaption = { role, at: Date.now(), endMs: endMs || 0 };
  while (log.children.length > 16) log.firstElementChild.remove();
  log.scrollTop = log.scrollHeight;
}

async function startAssistant() {
  assistantPanel.hidden = false;
  if (assistant && ["closed", "error"].includes(assistant.state)) assistant = null;
  if (assistant) return;
  if (!memory.openai) {
    pendingAction = { provider: "openai", run: () => startAssistant() };
    settings.showModal();
    $("#voice-openai-key").focus();
    return;
  }
  if (narrator.current) narrator.pause();
  $("#assistant-status").textContent = "Connecting to GPT-Live 1…";
  assistant = new LiveCourseAssistant({
    apiKey: memory.openai,
    context: JSON.stringify(currentContext()),
    onStatus: (event) => {
      const state = typeof event === "string" ? event : event.state || event.type || "connected";
      const labels = { connecting: "Connecting to GPT-Live 1…", connected: event.muted ? "Ready · microphone muted" : "Ready · microphone on", closing: "Ending conversation…", closed: "Conversation ended", error: "Connection ended" };
      $("#assistant-status").textContent = typeof event === "string" ? event : event.message || labels[state] || state;
      const active = !["closed", "disconnected", "error"].includes(state);
      $("#assistant-start").hidden = active;
      $("#assistant-mute").hidden = !active;
      $("#assistant-end").hidden = !active;
      assistantButton.setAttribute("aria-pressed", String(active));
    },
    onTranscript: (event) => {
      caption(event);
      if (event.speaker === "assistant") {
        assistantPanel.dataset.speaking = "true";
        clearTimeout(speakingTimer);
        speakingTimer = setTimeout(() => { assistantPanel.dataset.speaking = "false"; }, 1300);
      }
    },
    onAudio: (event) => {
      if (event.type === "playback-blocked") $("#assistant-status").textContent = "Select your browser's audio control to hear the assistant.";
    },
    onTool: performTool,
    onError: (error) => { $("#assistant-status").textContent = error?.message || String(error); },
  });
  try { await assistant.connect(); updateContext(); }
  catch (error) { $("#assistant-status").textContent = error?.message || String(error); assistant?.disconnect(); assistant = null; }
}

async function explain(item, text = "") {
  selectionMenu.hidden = true;
  assistantPanel.hidden = false;
  if (!memory.openai) {
    pendingAction = { provider: "openai", run: () => explain(item, text) };
    settings.showModal();
    $("#voice-openai-key").focus();
    return;
  }
  await startAssistant();
  if (!assistant) return;
  const focus = item ? `Course entry ${item.id}: ${item.text || item.speech || ""}` : JSON.stringify(currentContext());
  assistant.sendText(`Teach me this carefully. ${text ? `I selected: ${text.slice(0, 900)}. ` : ""}${focus.slice(0, 1400)}`);
}

function renderVoices() {
  const query = $("#voice-search").value.trim().toLowerCase();
  const list = availableVoices.filter((voice) => !query || `${voice.name} ${voice.accent || ""}`.toLowerCase().includes(query)).slice(0, 24);
  const target = $("#voice-choices");
  target.replaceChildren(...list.map((voice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "voice-choice";
    button.setAttribute("aria-pressed", String(memory.voice.id === voice.id));
    const name = document.createElement("strong");
    name.textContent = voice.name;
    const note = document.createElement("small");
    note.textContent = voice.accent || voice.category || "Narrator";
    button.append(name, note);
    button.onclick = () => { memory.voice = { id: voice.id, name: voice.name }; settingsStore(); renderVoices(); };
    return button;
  }));
}

settingsButton.onclick = () => {
  $("#voice-eleven-key").value = memory.elevenlabs;
  $("#voice-openai-key").value = memory.openai;
  $("#voice-remember").checked = memory.remember;
  renderVoices();
  settings.showModal();
};
$('[data-close-settings]', settings).onclick = () => settings.close();
settings.addEventListener("click", (event) => { if (event.target === settings) settings.close(); });
settings.addEventListener("close", () => {
  const action = pendingAction;
  pendingAction = null;
  if (action && memory[action.provider]) action.run();
});
for (const [field, property] of [["#voice-eleven-key", "elevenlabs"], ["#voice-openai-key", "openai"]]) {
  $(field).addEventListener("input", (event) => { memory[property] = event.target.value.trim(); settingsStore(); });
}
$("#voice-remember").onchange = (event) => { memory.remember = event.target.checked; settingsStore(); };
$("#voice-clear-keys").onclick = () => {
  memory.openai = memory.elevenlabs = "";
  memory.remember = false;
  settingsStore();
  $("#voice-openai-key").value = $("#voice-eleven-key").value = "";
  $("#voice-remember").checked = false;
  $("#voice-connection-status").textContent = "Keys cleared from this browser.";
  assistant?.disconnect(); assistant = null; narrator.stop();
};
$("#voice-check-keys").onclick = async () => {
  const status = $("#voice-connection-status");
  status.textContent = "Checking provider connections…";
  const results = [];
  if (memory.elevenlabs) {
    try { availableVoices = await listElevenLabsVoices(memory.elevenlabs); results.push(`ElevenLabs connected · ${availableVoices.length} voices`); renderVoices(); }
    catch (error) { results.push(error.message); }
  }
  if (memory.openai) {
    try {
      const response = await fetch("https://api.openai.com/v1/models/gpt-live-1", { headers: { Authorization: `Bearer ${memory.openai}` } });
      if (!response.ok) throw new Error(`OpenAI ${response.status}`);
      results.push("GPT-Live 1 available");
    } catch (error) { results.push(error.message); }
  }
  status.textContent = results.join(" · ") || "Add at least one key to check a connection.";
};
$("#voice-load-voices").onclick = async () => {
  if (!memory.elevenlabs) { $("#voice-connection-status").textContent = "Add an ElevenLabs key first."; return; }
  $("#voice-connection-status").textContent = "Loading voices…";
  try { availableVoices = await listElevenLabsVoices(memory.elevenlabs); $("#voice-search").hidden = false; renderVoices(); $("#voice-connection-status").textContent = `${availableVoices.length} voices ready.`; }
  catch (error) { $("#voice-connection-status").textContent = error.message; }
};
$("#voice-search").oninput = renderVoices;
$("#voice-clear-cache").onclick = async () => { await clearNarrationCache(); $("#voice-connection-status").textContent = "Saved narration audio cleared."; };

listenButton.onclick = () => listen(itemInView(), "", true);
assistantButton.onclick = () => { assistantPanel.hidden = !assistantPanel.hidden; if (!assistantPanel.hidden) updateContext(); };
$("#assistant-close").onclick = () => { assistantPanel.hidden = true; };
$("#assistant-start").onclick = startAssistant;
$("#assistant-mute").onclick = () => {
  const muted = $("#assistant-mute").getAttribute("aria-pressed") !== "true";
  assistant?.setMuted(muted);
  $("#assistant-mute").setAttribute("aria-pressed", String(muted));
  $("#assistant-mute span").textContent = muted ? "Unmute mic" : "Mute mic";
};
$("#assistant-end").onclick = () => { assistant?.disconnect(); assistant = null; $("#assistant-status").textContent = "Conversation ended."; $("#assistant-start").hidden = false; $("#assistant-mute").hidden = $("#assistant-end").hidden = true; assistantButton.setAttribute("aria-pressed", "false"); };
$("#assistant-form").onsubmit = async (event) => {
  event.preventDefault();
  const input = $("#assistant-input");
  const text = input.value.trim();
  if (!text) return;
  if (!memory.openai) {
    pendingAction = { provider: "openai", run: () => $("#assistant-form").requestSubmit() };
    settings.showModal();
    $("#voice-openai-key").focus();
    return;
  }
  if (!assistant) await startAssistant();
  if (assistant) { input.value = ""; assistant.sendText(text); }
};

$$('[data-voice-action]', player).forEach((button) => button.onclick = () => {
  const action = button.dataset.voiceAction;
  if (action === "toggle") {
    if (narrator.audio.paused) quietAssistantForNarration();
    narrator.toggle();
  }
  else narrator[action]();
});
$("#voice-seek").oninput = (event) => narrator.seek(Number(event.target.value) / 1000);
$("#voice-follow").onclick = () => {
  narrator.follow = !narrator.follow;
  $("#voice-follow").setAttribute("aria-pressed", String(narrator.follow));
  if (narrator.follow) currentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
};

selectionMenu.addEventListener("pointerdown", (event) => event.preventDefault());
selectionMenu.addEventListener("click", (event) => {
  const action = event.target.closest('[data-selection-action]')?.dataset.selectionAction;
  if (action === "listen") listen(selected?.item, selected?.text || "", false);
  if (action === "explain") explain(selected?.item, selected?.text || "");
});
document.addEventListener("selectionchange", () => requestAnimationFrame(showSelectionMenu));
document.addEventListener("pointerdown", (event) => {
  if (!selectionMenu.contains(event.target)) selectionMenu.hidden = true;
});
$("main").addEventListener("dblclick", (event) => {
  if (event.target.closest("button,input,select,textarea,a,[contenteditable]")) return;
  const item = itemForElement(event.target) || itemInView();
  if (item) listen(item);
});

// A small, discoverable action pair belongs to a construct, not to every line
// of reading text. Prose keeps its selection actions and global Play control.
for (const item of playback) {
  const node = bound.get(item.id);
  if (!node || !["widget", "diagram", "image", "plate", "table", "lab", "code"].includes(item.kind)) continue;
  if (node.querySelector(':scope > .voice-construct-actions')) continue;
  node.classList.add("voice-construct");
  const nestedTable = item.kind === "table" && Boolean(node.closest(".teaching-visual"));
  const actions = document.createElement("div");
  actions.className = `voice-construct-actions${nestedTable ? " voice-table-actions" : ""}`;
  actions.innerHTML = nestedTable
    ? `<button type="button" aria-label="Listen to this table">${icon("headphones")}<span>Hear this table</span></button>`
    : `<button type="button" aria-label="Listen to ${item.kind}">${icon("headphones")}<span>Listen</span></button><button type="button" aria-label="Explain ${item.kind}">${icon("science")}<span>Explain</span></button>`;
  actions.children[0].onclick = () => listen(item);
  if (!nestedTable) actions.children[1].onclick = () => explain(item);
  if (node.classList.contains("teaching-visual")) node.prepend(actions);
  else node.append(actions);
}

addEventListener("scroll", () => {
  selectionMenu.hidden = true;
  clearTimeout(contextTimer);
  contextTimer = setTimeout(updateContext, 450);
}, { passive: true });
addEventListener("hashchange", updateContext);
addEventListener("beforeprint", () => { narrator.pause(); assistant?.setMuted(true); });
updateContext();

// A narrow debug surface for the automated browser verification suite.
window.__courseVoice = { index, bound, playback, narrator, performTool, currentContext, getAssistant: () => assistant };
