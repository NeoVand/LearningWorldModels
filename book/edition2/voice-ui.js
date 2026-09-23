import { icon } from "../../tools/icons.mjs";
import { NarrationPlayer, listElevenLabsVoices, clearNarrationCache } from "./voice-narration.js";
import { BACKEND_MODELS, DEFAULT_BACKEND_MODEL, LiveCourseAssistant } from "./live-assistant.js";
import { attachVoiceIndex, findEquationForQuery, locateCourseTopic, resolveBoundVoiceItem, searchCourseIndex } from "./voice-index-runtime.js";

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
const memory = { openai: "", elevenlabs: "", voice: DEFAULT_VOICE, model: DEFAULT_BACKEND_MODEL, remember: false };
try {
  Object.assign(memory, JSON.parse(sessionStorage.getItem("world-voice-settings") || localStorage.getItem("world-voice-settings") || "{}"));
} catch {}
if (!BACKEND_MODELS.some(({ id }) => id === memory.model)) memory.model = DEFAULT_BACKEND_MODEL;
const settingsStore = () => {
  const saved = JSON.stringify(memory);
  sessionStorage.setItem("world-voice-settings", saved);
  if (memory.remember) localStorage.setItem("world-voice-settings", saved);
  else localStorage.removeItem("world-voice-settings");
};

// The reading controls live in the reader header, alongside the page controls.
const printButton = $("#print");
const readerHeader = $("header");
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
settings.innerHTML = `<div class="voice-modal-head"><div><span class="voice-eyebrow">YOUR LISTENING SPACE</span><h2 id="voice-settings-title">Listening &amp; learning</h2></div><button type="button" class="voice-icon-button" data-close-settings aria-label="Close settings">${icon("close")}</button></div><p class="voice-modal-intro">ElevenLabs narrates the course. GPT-Live 1 handles your conversation, with a separate model to reason about the book. Your keys go directly from this browser to their providers.</p><div class="voice-key-grid"><label>ElevenLabs API key<input id="voice-eleven-key" type="password" autocomplete="off" spellcheck="false" placeholder="Paste your ElevenLabs key"></label><label>OpenAI API key<input id="voice-openai-key" type="password" autocomplete="off" spellcheck="false" placeholder="Paste your OpenAI key"></label></div><div class="voice-key-actions"><label class="voice-check"><input id="voice-remember" type="checkbox"><span>Remember keys on this device</span></label><button type="button" id="voice-check-keys">Check connections</button><button type="button" id="voice-clear-keys">Clear keys</button></div><p id="voice-connection-status" class="voice-small" role="status">Keys are kept for this tab unless you choose to remember them.</p><div class="voice-model-settings"><div class="voice-model-heading"><span class="voice-eyebrow">ASSISTANT</span><h3>Choose a teaching model</h3><p>GPT-Live 1 remains the voice; this model works through your questions and locates course material.</p></div><div id="voice-model-choices" class="voice-model-choices" role="radiogroup" aria-label="Teaching model"></div><p id="voice-model-status" class="voice-small" role="status"></p><p class="voice-billing-note">Narration mutes the assistant’s microphone and sound without sending it the recording. Muting or pausing leaves the Live session open and may still accrue time charges; End closes it.</p></div><div class="voice-voice-heading"><div><span class="voice-eyebrow">NARRATOR</span><h3>Choose a voice</h3></div><button type="button" id="voice-load-voices">Browse your voices</button></div><input id="voice-search" type="search" placeholder="Find a voice" aria-label="Find a voice" hidden><div id="voice-choices" class="voice-choices" role="group" aria-label="Narrator voices"></div><div class="voice-modal-foot"><button type="button" id="voice-clear-cache">Clear saved audio</button><span>Generated audio is cached on this device to avoid repeated synthesis.</span></div>`;
document.body.append(settings);

const player = document.createElement("section");
player.id = "course-player";
player.className = "voice-player";
player.hidden = true;
player.setAttribute("aria-label", "Course narration");
player.innerHTML = `<span class="voice-player-mark" aria-hidden="true">${icon("headphones")}</span><button type="button" id="voice-player-jump" class="voice-player-copy" aria-label="Show narrated passage"><span id="voice-player-kicker">LISTENING</span><strong id="voice-player-title">Course narration</strong></button><input id="voice-seek" type="range" min="0" max="1000" value="0" aria-label="Narration position"><span id="voice-time">0:00 / 0:00</span><div class="voice-player-actions"><button type="button" data-voice-action="previous" aria-label="Previous passage">${icon("previous")}</button><button type="button" data-voice-action="toggle" aria-label="Pause narration">${icon("pause")}</button><button type="button" data-voice-action="next" aria-label="Next passage">${icon("next")}</button><button type="button" data-voice-action="stop" aria-label="Stop narration">${icon("stop")}</button></div><button type="button" id="voice-follow" aria-pressed="true" aria-label="Follow narration on the page">Follow</button>`;
const assistantTransport = document.createElement("div");
assistantTransport.id = "assistant-transport";
assistantTransport.className = "assistant-transport";
assistantTransport.hidden = true;
assistantTransport.setAttribute("aria-label", "Assistant controls");
assistantTransport.innerHTML = `<span class="assistant-transport-dot" aria-hidden="true"></span><button type="button" id="assistant-transport-open" class="assistant-transport-open" aria-label="Open assistant conversation"><strong id="assistant-transport-focus">Assistant</strong><span id="assistant-transport-state">Listening</span></button><button type="button" id="assistant-transport-mic" aria-label="Mute microphone" title="Mute microphone">${icon("mic")}</button><button type="button" id="assistant-transport-audio" aria-label="Mute assistant sound" title="Mute assistant sound">${icon("volume")}</button><button type="button" id="assistant-transport-hold" aria-label="Pause assistant" title="Pause assistant">${icon("pause")}</button><button type="button" id="assistant-transport-end" aria-label="End assistant conversation" title="End assistant conversation">${icon("stop")}</button>`;
const voiceRail = document.createElement("div");
voiceRail.id = "course-voice-rail";
voiceRail.className = "voice-rail";
voiceRail.hidden = true;
voiceRail.append(player, assistantTransport);
readerHeader.insertBefore(voiceRail, $(".header-right"));

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
let assistantHeld = false;
let assistantBeforeHold = null;
let lastContext = "";
let contextTimer = 0;
let availableVoices = [DEFAULT_VOICE];
let pendingAction = null;
let lastCaption = { role: "", at: 0, endMs: 0 };
let speakingTimer = 0;
let assistantState = "closed";
let spokenLookup = { text: "", lastAt: 0, endMs: 0, focusedId: "", timer: 0 };
let navigationLock = null;

function syncVoiceRail() {
  const active = !["closed", "disconnected", "error"].includes(assistantState);
  assistantTransport.hidden = !active;
  voiceRail.hidden = player.hidden && !active;
  listenButton.setAttribute("aria-pressed", String(!player.hidden));
}

function assistantPreferences() {
  if (assistantHeld) return assistantBeforeHold || { input: true, output: true };
  return narratorOwnedByAssistant
    ? assistantAudioBeforeNarration || { input: false, output: false }
    : { input: assistant?.muted || false, output: assistant?.outputMuted || false };
}

function syncAssistantControls() {
  const { input, output } = assistantPreferences();
  const mic = $("#assistant-transport-mic");
  const audio = $("#assistant-transport-audio");
  const hold = $("#assistant-transport-hold");
  mic.disabled = audio.disabled = assistantHeld;
  mic.innerHTML = icon(input ? "micOff" : "mic");
  mic.setAttribute("aria-pressed", String(input));
  mic.setAttribute("aria-label", input ? "Unmute microphone" : "Mute microphone");
  mic.title = mic.getAttribute("aria-label");
  audio.innerHTML = icon(output ? "volumeOff" : "volume");
  audio.setAttribute("aria-pressed", String(output));
  audio.setAttribute("aria-label", output ? "Unmute assistant sound" : "Mute assistant sound");
  audio.title = audio.getAttribute("aria-label");
  hold.innerHTML = icon(assistantHeld ? "play" : "pause");
  hold.setAttribute("aria-pressed", String(assistantHeld));
  hold.setAttribute("aria-label", assistantHeld ? "Resume assistant" : "Pause assistant");
  hold.title = hold.getAttribute("aria-label");
  const panelMute = $("#assistant-mute");
  panelMute.setAttribute("aria-pressed", String(input));
  $("#assistant-mute span").textContent = input ? "Unmute mic" : "Mute mic";
  $("#assistant-transport-state").textContent = assistantHeld
    ? "Paused"
    : narratorOwnedByAssistant
    ? "Paused for narration"
    : assistantState === "connecting" ? "Connecting"
    : assistantState === "closing" ? "Ending"
    : input && output ? "Paused"
    : input ? "Mic muted"
    : output ? "Audio paused"
    : "Listening";
}

function setAssistantMicMuted(muted) {
  if (!assistant || assistantHeld) return;
  if (narratorOwnedByAssistant) assistantAudioBeforeNarration.input = muted;
  else assistant.setMuted(muted);
  syncAssistantControls();
}

function setAssistantOutputMuted(muted) {
  if (!assistant || assistantHeld) return;
  if (narratorOwnedByAssistant) assistantAudioBeforeNarration.output = muted;
  else assistant.setOutputMuted(muted);
  syncAssistantControls();
}

function setAssistantHeld(held) {
  if (!assistant || held === assistantHeld) return;
  if (held) {
    assistantBeforeHold = narratorOwnedByAssistant
      ? { ...assistantAudioBeforeNarration }
      : { input: assistant.muted, output: assistant.outputMuted };
    assistantHeld = true;
    if (narratorOwnedByAssistant) assistantAudioBeforeNarration = { input: true, output: true };
    assistant.setMuted(true);
    assistant.setOutputMuted(true);
  } else {
    const saved = assistantBeforeHold || { input: false, output: false };
    assistantHeld = false;
    if (narratorOwnedByAssistant) assistantAudioBeforeNarration = saved;
    else {
      assistant.setMuted(saved.input);
      assistant.setOutputMuted(saved.output);
    }
    assistantBeforeHold = null;
  }
  syncAssistantControls();
  if (!assistantHeld) updateContext();
}

function quietAssistantForNarration() {
  if (!assistant?.isConnected) return;
  if (!narratorOwnedByAssistant) {
    assistantAudioBeforeNarration = { input: assistant.muted, output: assistant.outputMuted };
  }
  assistant.setMuted(true);
  assistant.setOutputMuted(true);
  narratorOwnedByAssistant = true;
  syncAssistantControls();
}

function returnAudioToAssistant() {
  if (!narratorOwnedByAssistant) return;
  assistant?.setMuted(assistantAudioBeforeNarration?.input || false);
  assistant?.setOutputMuted(assistantAudioBeforeNarration?.output || false);
  assistantAudioBeforeNarration = null;
  narratorOwnedByAssistant = false;
  syncAssistantControls();
}

const narrator = new NarrationPlayer({
  getKey: () => memory.elevenlabs,
  getVoice: () => memory.voice.id,
  onState: ({ state, error }) => {
    if (state === "loading" || state === "playing") quietAssistantForNarration();
    player.hidden = state === "stopped" || state === "finished";
    player.dataset.state = state;
    syncVoiceRail();
    const toggle = $('[data-voice-action="toggle"]', player);
    toggle.innerHTML = icon(state === "playing" ? "pause" : "play");
    toggle.setAttribute("aria-label", state === "playing" ? "Pause narration" : "Resume narration");
    $("#voice-player-kicker").textContent = state === "loading" ? "PREPARING AUDIO" : state === "error" ? "AUDIO UNAVAILABLE" : state === "paused" ? "PAUSED" : "NOW LISTENING";
    if (error) $("#voice-player-title").textContent = error;
    if (state === "paused") {
      returnAudioToAssistant();
      updateContext();
    }
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
    $("#voice-player-title").textContent = item.title || sectionById.get(item.sectionId)?.title || chapterById.get(item.chapterId)?.title || "Selected passage";
    $("#voice-player-kicker").textContent = `${place + 1} OF ${total} · COURSE AUDIO`;
  },
  onProgress: ({ time, duration }) => {
    const progress = duration ? Math.round((time / duration) * 1000) : 0;
    $("#voice-seek").value = String(progress);
    $("#voice-seek").style.setProperty("--voice-progress", `${progress / 10}%`);
    $("#voice-time").textContent = `${clock(time)} / ${clock(duration)}`;
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
    const node = bound.get(item.id);
    const rect = node?.isConnected ? node.getBoundingClientRect() : null;
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
  if (pointed) {
    pointed.classList.remove("voice-pointed");
    pointed = null;
    focusedEquationObserver?.disconnect();
    focusedEquationObserver = null;
    $("#assistant-transport-focus").textContent = selected.item ? displayTitle(selected.item) : "Assistant";
    updateContext();
  }
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
  const visibleItem = itemInView();
  const selection = selectedItem();
  const visibleWidget = visibleItem?.kind === "widget" ? visibleItem : index.items.find((entry) => {
    if (entry.kind !== "widget") return false;
    const rect = bound.get(entry.id)?.getBoundingClientRect();
    return rect && rect.top < innerHeight * 0.65 && rect.bottom > 100;
  });
  const widget = visibleWidget ? widgetState(visibleWidget.id) : null;
  const narrated = narrator.current && itemById.get(narrator.current.id);
  const pointedRect = pointed?.isConnected ? pointed.getBoundingClientRect() : null;
  const pointedItem = pointedRect && pointedRect.bottom > 0 && pointedRect.top < innerHeight ? itemForElement(pointed) : null;
  const reference = selection?.item || pointedItem || narrated || visibleItem;
  const section = reference && sectionById.get(reference.sectionId);
  const chapter = reference && chapterById.get(reference.chapterId);
  return {
    chapter: chapter ? { id: chapter.id, title: chapter.title, summary: chapter.summary } : null,
    section: section ? { id: section.id, title: section.title, summary: section.summary } : null,
    focus: reference ? { id: reference.id, kind: reference.kind, title: displayTitle(reference), text: reference.text?.slice(0, 650), speech: reference.speech?.slice(0, 550) } : null,
    referenceId: reference?.id || null,
    referenceReason: selection?.item ? "selection" : pointedItem ? "highlighted by assistant" : narrated ? "current narration" : "visible passage",
    narrated: narrated ? { id: narrated.id, title: displayTitle(narrated), state: player.dataset.state, time: Math.round(narrator.audio.currentTime || 0) } : null,
    highlighted: pointedItem ? { id: pointedItem.id, title: displayTitle(pointedItem) } : null,
    selection: selection?.text?.slice(0, 500) || "",
    widget,
  };
}

function updateContext() {
  const context = currentContext();
  $("#assistant-context").textContent = context.highlighted ? `Explaining · ${context.highlighted.title}` : context.section && context.section.title !== context.chapter?.title ? `${context.chapter?.title || "Course"} · ${context.section.title}` : context.chapter?.title || "The course";
  if (!assistant) return;
  // The assistant sees the narration position in get_page_context and after
  // Pause. Streaming every advancing passage into Live would waste context.
  if (assistantHeld || player.dataset.state === "loading" || player.dataset.state === "playing") return;
  const short = JSON.stringify(context);
  if (short !== lastContext) {
    lastContext = short;
    assistant.sendContext(short.slice(0, 2200));
  }
}

function searchCourse(query, limit = 6) {
  const context = currentContext();
  return searchCourseIndex(index, query, {
    focusId: context.referenceId,
    sectionId: context.section?.id,
    chapterId: undefined,
    limit: Math.min(10, Math.max(1, Number(limit) || 6)),
  }).map((item) => ({
    id: item.id,
    kind: item.kind,
    title: displayTitle(item),
    excerpt: (item.teachingGuide?.idea || item.speech || item.text || "").slice(0, 420),
    sectionId: item.sectionId,
    relevance: item.relevance,
  }));
}

function displayTitle(item) {
  if (!item) return "Course passage";
  const sectionTitle = sectionById.get(item.sectionId)?.title || chapterById.get(item.chapterId)?.title || "Course passage";
  const numbered = item.kind === "equation" && item.text?.match(/\\tag\{(\d+)\}/)?.[1];
  if (numbered) return `Equation ${numbered} · ${sectionTitle}`;
  if (item.kind === "equation" || item.kind === "widgetEquation") return `Equation · ${sectionTitle}`;
  return item.title || sectionTitle;
}

function courseEntry(item) {
  const section = sectionById.get(item.sectionId);
  const chapter = chapterById.get(item.chapterId);
  return {
    id: item.id,
    kind: item.kind,
    title: displayTitle(item),
    chapter: chapter?.title,
    section: section?.title,
    formula: ["equation", "widgetEquation"].includes(item.kind) ? item.text?.slice(0, 1400) : undefined,
    text: item.kind === "equation" ? undefined : item.text?.slice(0, 1500),
    spokenExplanation: item.speech?.slice(0, 2400),
    teachingGuide: item.teachingGuide,
    equationContext: item.equationContext,
    agentNote: item.agentNote?.slice(0, 900),
    widgetState: item.kind === "widget" ? widgetState(item.id) : undefined,
  };
}

function resolveTarget(id) {
  const item = itemById.get(id);
  if (item) {
    const node = resolveBoundVoiceItem(index, bound, id, document);
    if (node) return { node, item, exact: true };
    // A widget can replace its rendered formulas when a control changes. Its
    // stable wrapper remains a useful destination, but is not the old formula.
    if (item.kind === "widgetEquation" && item.locator?.figureId) {
      const widgetNode = document.getElementById(`visual-${item.locator.figureId}`);
      const widget = index.items.find((entry) => entry.kind === "widget" && entry.figureId === item.locator.figureId);
      if (widgetNode?.isConnected && widget) return { node: widgetNode, item: widget, exact: false, requested: item };
    }
    return { node: null, item, exact: false };
  }
  if (chapterById.has(id)) {
    const chapter = document.getElementById(id);
    return { node: chapter?.querySelector("h1") || chapter, item: null, exact: true };
  }
  if (sectionById.has(id)) return { node: document.getElementById(id), item: null, exact: true };
  // Tutor notes are hidden context, not page targets. A note's chapter root is
  // not the passage the learner asked the assistant to show.
  if (noteById.has(id)) return { node: null, item: null };
  if (/^[A-Z]\d+$/.test(String(id))) return { node: document.getElementById(`visual-${id}`), item: index.items.find((entry) => entry.locator?.selector === `#visual-${id}`), exact: true };
  return { node: null, item: null };
}

let pointed = null;
let focusedEquationObserver = null;
function pointTo(node) {
  if (!node?.isConnected) return false;
  if (innerWidth <= 640 && !assistantPanel.hidden) assistantPanel.hidden = true;
  focusedEquationObserver?.disconnect();
  focusedEquationObserver = null;
  pointed?.classList.remove("voice-pointed");
  pointed = node;
  for (let details = node.closest("details"); details; details = details.parentElement?.closest("details")) details.open = true;
  getSelection()?.removeAllRanges();
  selectionMenu.hidden = true;
  node.classList.add("voice-pointed");
  node.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });
  const item = itemForElement(node);
  $("#assistant-transport-focus").textContent = item ? displayTitle(item) : "Course passage";
  if (item?.kind === "widgetEquation" && item.locator?.figureId) {
    const figure = document.getElementById(`visual-${item.locator.figureId}`);
    if (figure) {
      focusedEquationObserver = new MutationObserver(() => {
        if (pointed?.isConnected) return;
        const replacement = resolveTarget(item.id);
        if (replacement.node?.isConnected) {
          pointed = replacement.node;
          pointed.classList.add("voice-pointed");
          $("#assistant-transport-focus").textContent = displayTitle(replacement.item);
        } else {
          pointed = null;
          $("#assistant-transport-focus").textContent = "Assistant";
        }
        updateContext();
      });
      focusedEquationObserver.observe(figure, { childList: true, subtree: true });
    }
  }
  updateContext();
  return true;
}

function isActuallyVisible(node) {
  if (!node?.isConnected || !node.classList.contains("voice-pointed")) return false;
  const style = getComputedStyle(node);
  const rect = node.getBoundingClientRect();
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 || rect.width < 2 || rect.height < 2) return false;
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, innerHeight);
  const left = Math.max(rect.left, 0);
  const right = Math.min(rect.right, innerWidth);
  if (bottom - top < Math.min(18, rect.height * 0.35) || right - left < Math.min(18, rect.width * 0.35)) return false;
  const y = (top + bottom) / 2;
  return [0.2, 0.5, 0.8].some((fraction) => {
    const x = left + (right - left) * fraction;
    const hit = document.elementFromPoint(x, y);
    return hit === node || node.contains(hit);
  });
}

async function verifyPointTo(node) {
  if (!pointTo(node)) return false;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  if (isActuallyVisible(node)) { updateContext(); return true; }
  // Some browsers defer a scroll when a disclosure has just opened. Retry
  // once after layout, and never tell the tutor that an unseen node is shown.
  node.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });
  await new Promise((resolve) => requestAnimationFrame(resolve));
  if (isActuallyVisible(node)) { updateContext(); return true; }
  node.classList.remove("voice-pointed");
  if (pointed === node) pointed = null;
  focusedEquationObserver?.disconnect();
  focusedEquationObserver = null;
  $("#assistant-transport-focus").textContent = "Assistant";
  updateContext();
  return false;
}

async function focusEntry(id) {
  const { node, item, exact, requested } = resolveTarget(id);
  if (!node || !item) return { ok: false, error: "No visible course entry has that ID." };
  if (!await verifyPointTo(node)) return { ok: false, visible: false, error: "The course could not bring that passage into view." };
  if (!exact) return {
    ok: false,
    visible: true,
    exactEquation: false,
    error: "That exact widget equation changed with the controls. The live widget is now highlighted instead.",
    requestedId: requested.id,
    closestVisibleEntry: courseEntry(item),
  };
  return { ok: true, visible: true, entry: courseEntry(item) };
}

async function focusTopic(query) {
  const context = currentContext();
  const options = { focusId: context.referenceId, sectionId: context.section?.id, chapterId: context.chapter?.id };
  const words = lookupPhrase(query);
  const equationRequest = /\b(?:equation|eq\.?|formula|derive|derivation|gradient)\b/i.test(words);
  const equation = equationRequest ? findEquationForQuery(index, words, { ...options, chapterId: undefined }) : null;
  if (/\b(?:equation|eq\.?)\s*\d+\b/i.test(words) && !equation)
    return { ok: false, error: "That numbered equation is not in the course; I will not point to a different formula." };
  const ranked = searchCourseIndex(index, words, { ...options, chapterId: undefined, limit: 4 });
  const target = equation || locateCourseTopic(index, words, { ...options, chapterId: undefined });
  if (!target || (!equation && target.relevance < 2)) return { ok: false, error: "I could not locate a reliable passage for that question. Try a more specific topic or ask about the current selection." };
  const focused = await focusEntry(target.id);
  if (!focused.ok) return focused;
  return {
    ...focused,
    alternatives: ranked.filter((item) => item.id !== target.id).slice(0, 2).map((item) => ({ id: item.id, title: displayTitle(item), kind: item.kind })),
    teachingNotes: relatedTeachingNotes(words, target.chapterId),
  };
}

function lookupPhrase(text) {
  // Requests often append "Don't explain it yet" or another instruction
  // after the subject. Only the first sentence should drive retrieval.
  return String(text || "").split(/[?.!]\s+(?=[A-Z])/)[0].trim();
}

function locationIsNegated(text) {
  return /\b(?:do not|don't|dont|without|no need to)\s+(?:find|show|scroll|navigate|open|highlight|point)/i.test(text);
}

function isLocationOnly(text) {
  if (/\b(?:do not|don't|dont)\s+explain\b|\bno explanation\b/i.test(text)) return true;
  return !/\b(?:explain|teach|derive|why|how|walk me through|tell me about)\b/i.test(text) &&
    (/^\s*(?:please\s+)?(?:find|locate|show|scroll|jump|open|highlight|point|take me|go to)\b/i.test(text) ||
      /\bwhere\b.*\b(?:in the (?:book|course)|introduce|section|chapter)\b/i.test(text));
}

function isExplicitFocusRequest(text) {
  return /\b(?:find|locate|show|scroll|jump|open|highlight|point|explain|teach|derive|define|where|what is|what are|why|how|talk about|tell me about|take me|go to)\b/i.test(text);
}

async function groundLearnerRequest(text) {
  if (locationIsNegated(text)) {
    navigationLock = { id: "__no_navigation__", at: Date.now() };
    return null;
  }
  const context = currentContext();
  const options = { focusId: context.referenceId, sectionId: context.section?.id, chapterId: context.chapter?.id };
  const target = locateCourseTopic(index, lookupPhrase(text), { ...options, chapterId: undefined });
  if (target) {
    const result = await focusTopic(lookupPhrase(text));
    navigationLock = result?.ok ? { id: result.entry.id, at: Date.now() } : null;
    return result;
  }
  if (/\b(?:this|here|current)\b/i.test(text) && context.referenceId &&
      /\b(?:find|show|scroll|point|highlight|explain|teach|equation|figure|widget|passage)\b/i.test(text)) {
    const result = await focusEntry(context.referenceId);
    navigationLock = result?.ok ? { id: result.entry.id, at: Date.now() } : null;
    return result;
  }
  navigationLock = null;
  return null;
}

function queueSpokenFocus({ delta, startMs, endMs }) {
  if (!delta || assistantHeld || assistant?.muted) return;
  const now = Date.now();
  if (now - spokenLookup.lastAt > 1800 ||
      (Number.isFinite(startMs) && spokenLookup.endMs && startMs < spokenLookup.endMs - 350)) {
    clearTimeout(spokenLookup.timer);
    spokenLookup = { text: "", lastAt: 0, endMs: 0, focusedId: "", timer: 0 };
  }
  spokenLookup.text += delta;
  spokenLookup.lastAt = now;
  spokenLookup.endMs = Number(endMs) || spokenLookup.endMs;
  clearTimeout(spokenLookup.timer);
  spokenLookup.timer = setTimeout(async () => {
    const words = spokenLookup.text.trim();
    if (!words) return;
    if (locationIsNegated(words)) {
      navigationLock = { id: "__no_navigation__", at: Date.now() };
      return;
    }
    if (!isExplicitFocusRequest(words)) return;
    const context = currentContext();
    const target = locateCourseTopic(index, lookupPhrase(words), { focusId: context.referenceId, sectionId: context.section?.id, chapterId: undefined });
    if (!target || target.id === spokenLookup.focusedId) return;
    const result = await focusTopic(lookupPhrase(words));
    if (result.ok) {
      spokenLookup.focusedId = result.entry.id;
      navigationLock = { id: result.entry.id, at: Date.now() };
      assistant?.sendContext(JSON.stringify(currentContext()).slice(0, 2200), { urgent: true });
    }
  }, 260);
}

function relatedTeachingNotes(query, chapterId) {
  const terms = String(query || "").toLowerCase().match(/[a-z0-9]{3,}/g) || [];
  return tutorNotes.map((note) => {
    const title = `${note.topic} ${note.keywords.join(" ")}`.toLowerCase();
    const matches = terms.filter((term) => title.includes(term)).length;
    return { note, score: matches * 3 + (matches && note.chapterId === chapterId ? 2 : 0) };
  }).filter(({ score }) => score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ note }) => ({ topic: note.topic, explanation: note.explanation, teachingMove: note.teachingMove, source: note.source }));
}

async function performTool(name, args) {
  if (name === "get_page_context") return currentContext();
  if (name === "focus_course_topic") {
    const target = locateCourseTopic(index, lookupPhrase(args.query), { chapterId: undefined });
    if (navigationLock && target?.id !== navigationLock.id) return { ok: false, error: "A newer learner request superseded this navigation. Use the current page context." };
    return focusTopic(args.query);
  }
  if (name === "focus_course_entry") {
    if (navigationLock && args.id !== navigationLock.id) return { ok: false, error: "A newer learner request superseded this navigation. Use the current page context." };
    return focusEntry(args.id);
  }
  if (name === "search_course") return { results: searchCourse(args.query, args.limit) };
  if (name === "get_course_entry") {
    const item = itemById.get(args.id);
    const note = noteById.get(args.id);
    const section = sectionById.get(args.id);
    const chapter = chapterById.get(args.id);
    if (item) return courseEntry(item);
    if (note) return { id: args.id, kind: "tutorNote", ...note };
    if (section || chapter) return section || chapter;
    return { error: "Unknown course entry" };
  }
  if (name === "navigate_to" || name === "highlight_entry") {
    if (navigationLock && args.id !== navigationLock.id) return { ok: false, error: "A newer learner request superseded this navigation. Use the current page context." };
    const { node, item, exact, requested } = resolveTarget(args.id);
    if (!node) return { error: "Unknown course target" };
    if (!await verifyPointTo(node)) return { ok: false, visible: false, error: "The course could not bring that target into view." };
    if (!exact) return { ok: false, visible: true, exactEquation: false, error: "The requested equation changed with the widget controls; the live widget is highlighted instead.", requestedId: requested.id, closestVisibleEntry: courseEntry(item) };
    return { ok: true, visible: true, id: args.id, title: item?.title || node.textContent?.trim().slice(0, 90) };
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
    const visible = await verifyPointTo(root);
    return visible ? { ok: true, visible: true, state: widgetState(visualId) } : { ok: false, visible: false, error: "The control changed, but the widget could not be brought into view.", state: widgetState(visualId) };
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
  if (sameUtterance) last.textContent += /[.!?]$/.test(last.textContent) && /^[A-Z]/.test(text) ? ` ${text}` : text;
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

async function startAssistant({ muted = false } = {}) {
  assistantPanel.hidden = false;
  if (assistant && ["closed", "error"].includes(assistant.state)) assistant = null;
  if (assistant) return;
  if (!memory.openai) {
    pendingAction = { provider: "openai", run: () => startAssistant({ muted }) };
    settings.showModal();
    $("#voice-openai-key").focus();
    return;
  }
  if (narrator.current) narrator.pause();
  $("#assistant-status").textContent = "Connecting to GPT-Live 1…";
  assistantHeld = false;
  assistantBeforeHold = null;
  assistant = new LiveCourseAssistant({
    apiKey: memory.openai,
    backendModel: memory.model,
    context: JSON.stringify(currentContext()),
    onStatus: (event) => {
      const state = typeof event === "string" ? event : event.state || event.type || "connected";
      const labels = { connecting: "Connecting to GPT-Live 1…", connected: event.muted ? "Ready · microphone muted" : "Ready · microphone on", closing: "Ending conversation…", closed: "Conversation ended", error: "Connection ended" };
      $("#assistant-status").textContent = typeof event === "string" ? event : event.message || labels[state] || state;
      assistantState = state;
      const active = !["closed", "disconnected", "error"].includes(state);
      $("#assistant-start").hidden = active;
      $("#assistant-mute").hidden = !active;
      $("#assistant-end").hidden = !active;
      assistantButton.setAttribute("aria-pressed", String(active));
      syncVoiceRail();
      syncAssistantControls();
    },
    onTranscript: (event) => {
      caption(event);
      if (event.speaker === "user" && !event.typed) queueSpokenFocus(event);
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
  if (muted) assistant.setMuted(true);
  try { await assistant.connect(); updateContext(); }
  catch (error) { $("#assistant-status").textContent = error?.message || String(error); assistant?.disconnect(); assistant = null; assistantState = "error"; syncVoiceRail(); }
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
  if (narrator.current && !narrator.audio.paused) narrator.pause();
  if (assistantHeld) setAssistantHeld(false);
  if (item) {
    const focused = await focusEntry(item.id);
    navigationLock = focused.ok ? { id: focused.entry.id, at: Date.now() } : null;
  }
  updateContext();
  const selectedPhrase = item?.kind === "equation" ? "" : text ? ` I selected: ${text.slice(0, 350)}.` : "";
  assistant.sendText(item
    ? `Teach the highlighted ${item.kind} (${item.id}). Explain what it is for, why its steps follow, and give a small example. Do not just read its symbols.${selectedPhrase}`
    : `Teach the current passage carefully.${selectedPhrase}`);
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

function renderModels() {
  const target = $("#voice-model-choices");
  target.replaceChildren(...BACKEND_MODELS.map((model) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "voice-model-choice";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(memory.model === model.id));
    const name = document.createElement("strong");
    name.textContent = model.name;
    const description = document.createElement("small");
    description.textContent = model.description;
    button.append(name, description);
    button.onclick = async () => {
      if (model.id === memory.model || target.dataset.pending === "true") return;
      target.dataset.pending = "true";
      const status = $("#voice-model-status");
      status.textContent = assistant?.isConnected ? `Switching to ${model.name}…` : "";
      try {
        if (assistant) await assistant.setBackendModel(model.id);
        memory.model = model.id;
        settingsStore();
        status.textContent = assistant?.isConnected ? `${model.name} is ready for this conversation.` : `${model.name} will be used when you start the assistant.`;
      } catch (error) {
        status.textContent = error?.message || "The model could not be changed.";
      } finally {
        delete target.dataset.pending;
        renderModels();
      }
    };
    return button;
  }));
}

settingsButton.onclick = () => {
  $("#voice-eleven-key").value = memory.elevenlabs;
  $("#voice-openai-key").value = memory.openai;
  $("#voice-remember").checked = memory.remember;
  renderModels();
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
  endAssistant(); narrator.stop();
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

listenButton.onclick = () => {
  if (narrator.current) {
    if (narrator.audio.paused) quietAssistantForNarration();
    narrator.toggle();
  } else listen(itemInView(), "", true);
};
assistantButton.onclick = () => {
  assistantPanel.hidden = !assistantPanel.hidden;
  if (!assistantPanel.hidden) {
    if (narrator.current && !narrator.audio.paused) narrator.pause();
    updateContext();
  }
};
$("#assistant-transport-open").onclick = () => {
  assistantPanel.hidden = false;
  if (narrator.current && !narrator.audio.paused) narrator.pause();
  updateContext();
};
$("#assistant-close").onclick = () => { assistantPanel.hidden = true; };
$("#assistant-start").onclick = startAssistant;
$("#assistant-mute").onclick = () => setAssistantMicMuted(!assistantPreferences().input);
$("#assistant-transport-mic").onclick = () => setAssistantMicMuted(!assistantPreferences().input);
$("#assistant-transport-audio").onclick = () => setAssistantOutputMuted(!assistantPreferences().output);
$("#assistant-transport-hold").onclick = () => setAssistantHeld(!assistantHeld);
function endAssistant() {
  clearTimeout(spokenLookup.timer);
  spokenLookup = { text: "", lastAt: 0, endMs: 0, focusedId: "", timer: 0 };
  navigationLock = null;
  assistant?.disconnect();
  assistant = null;
  assistantState = "closed";
  narratorOwnedByAssistant = false;
  assistantAudioBeforeNarration = null;
  assistantHeld = false;
  assistantBeforeHold = null;
  $("#assistant-status").textContent = "Conversation ended.";
  $("#assistant-start").hidden = false;
  $("#assistant-mute").hidden = $("#assistant-end").hidden = true;
  assistantButton.setAttribute("aria-pressed", "false");
  pointed?.classList.remove("voice-pointed");
  pointed = null;
  focusedEquationObserver?.disconnect();
  focusedEquationObserver = null;
  $("#assistant-transport-focus").textContent = "Assistant";
  syncVoiceRail();
  syncAssistantControls();
}
$("#assistant-end").onclick = endAssistant;
$("#assistant-transport-end").onclick = endAssistant;
$("#assistant-form").onsubmit = async (event) => {
  event.preventDefault();
  const input = $("#assistant-input");
  const text = input.value.trim();
  if (!text) return;
  // Finding a passage is a page action, not a tutoring turn. Do it locally,
  // show the verified result immediately, and leave Live free for follow-up.
  if (isLocationOnly(text)) {
    const found = await groundLearnerRequest(text);
    if (found?.ok) {
      input.value = "";
      caption({ speaker: "user", delta: text, typed: true });
      caption({ speaker: "assistant", delta: `Showing ${found.entry.title}.`, typed: true });
      assistant?.sendContext(JSON.stringify(currentContext()).slice(0, 2200), { urgent: true });
      return;
    }
  }
  if (!memory.openai) {
    pendingAction = { provider: "openai", run: () => $("#assistant-form").requestSubmit() };
    settings.showModal();
    $("#voice-openai-key").focus();
    return;
  }
  if (!assistant) await startAssistant({ muted: true });
  if (assistant) {
    if (narrator.current && !narrator.audio.paused) narrator.pause();
    if (assistantHeld) setAssistantHeld(false);
    clearTimeout(spokenLookup.timer);
    spokenLookup = { text: "", lastAt: 0, endMs: 0, focusedId: "", timer: 0 };
    const focus = await groundLearnerRequest(text);
    updateContext();
    input.value = "";
    const appNote = focus?.ok
      ? `\n\n[Application page action: verified visible highlight of ${focus.entry.title} (entry ${focus.entry.id}). ${isLocationOnly(text) ? "The learner asked to locate this passage only; briefly identify it without an unsolicited explanation." : "Ground the answer in this exact visible entry."} Do not read this bracketed note aloud.]`
      : focus
        ? `\n\n[Application page action failed: ${focus.error || "the requested passage is not visible"}. Do not claim the page moved or was highlighted. Do not read this bracketed note aloud.]`
        : "";
    assistant.sendText(text + appNote, { displayText: text });
  }
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
$("#voice-player-jump").onclick = () => {
  if (!currentElement) return;
  currentElement.scrollIntoView({ behavior: "smooth", block: "center" });
  pointTo(currentElement);
};
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
