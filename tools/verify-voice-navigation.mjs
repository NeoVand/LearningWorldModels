import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { once } from "node:events";
import { chromium } from "playwright";
import { NavigationController } from "../book/voice/navigation-controller.mjs";
import { locateCourseTopic } from "../book/voice/query.mjs";
import { navigationTopics } from "../book/voice/navigation-topics.mjs";

const index = JSON.parse(fs.readFileSync(new URL("../book/voice/course-index.json", import.meta.url)));
let retrievalCases = 0;
for (const [id, aliases] of navigationTopics) for (const alias of aliases) {
  const found = locateCourseTopic(index, `Show me ${alias}`);
  assert.equal(found?.id, id, alias);
  assert.notEqual(found.chapterId, "reference");
  retrievalCases++;
}
for (const query of ["Find quantum gravity", "Show LeWorldModel equation 77", "What is this thing?", "Find the law of large numbers"]) {
  assert.equal(locateCourseTopic(index, query), null, `unavailable material: ${query}`);
  retrievalCases++;
}
assert.equal(locateCourseTopic(index, "regularization in the book; locate the main teaching passage on regularization")?.id, "learning-heading-994404f3bd");
retrievalCases++;
// Race an in-flight action against a new request, including its delayed retry.
const control = new NavigationController();
let release;
const old = control.begin("spoken");
const delayed = control.focus(old, "A", async (active) => {
  await new Promise((resolve) => { release = resolve; });
  return { ok: active(), visible: active() };
}, () => true);
await Promise.resolve();
const fresh = control.begin("typed");
release();
assert.equal((await delayed).ok, false);
assert.equal(control.active.targetId, null);
assert.equal((await control.focus(fresh, "B", async () => ({ ok: true, visible: true }), () => true)).ok, true);
let repeated = false;
assert.equal((await control.focus(fresh, "B", () => { repeated = true; }, () => true)).reused, true);
assert.equal(repeated, false);
assert.equal((await control.focus(fresh, "C", () => { throw Error("must not run"); }, () => true)).ok, false);

const root = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(path.join(root, "world-models.html"));
const server = http.createServer((_request, response) => response.writeHead(200, { "Content-Type": "text/html" }).end(html));
server.listen(0, "127.0.0.1");
await once(server, "listening");
const chrome = process.env.BOOK_CHROME_PATH;
const browser = await chromium.launch({ headless: true, ...(chrome ? { executablePath: chrome } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const shots = path.join(root, "tmp", "navigation-qa");
fs.mkdirSync(shots, { recursive: true });
try {
  // Drive the actual production transport and UI callbacks, with no provider
  // request or microphone. Replay protocol events, not a duplicate UI model.
  await page.addInitScript(() => {
    const sent = [];
    let channel;
    window.__liveReplay = { sent, emit: (event) => channel.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(event) })) };
    const track = { enabled: true, stop() {} };
    navigator.mediaDevices.getUserMedia = async () => ({ getAudioTracks: () => [track], getTracks: () => [track] });
    window.RTCPeerConnection = class extends EventTarget {
      iceGatheringState = "complete";
      addTrack() { return { replaceTrack: async () => {} }; }
      createDataChannel() { channel = Object.assign(new EventTarget(), { readyState: "open", send: (data) => sent.push(JSON.parse(data)), close() {} }); return channel; }
      async createOffer() { return { type: "offer", sdp: "replay-offer" }; }
      async setLocalDescription(value) { this.localDescription = value; }
      async setRemoteDescription() { queueMicrotask(() => window.__liveReplay.emit({ type: "session.started", session: { id: "replay" } })); }
      close() {}
    };
    sessionStorage.setItem("world-voice-settings", JSON.stringify({ openai: "test-only", model: "gpt-6-sol" }));
  });
  await page.route("https://api.openai.com/**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ session: { id: "replay" }, transport: { sdp: "replay-answer" } }) }));
  await page.goto(process.env.BOOK_URL || `http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForFunction(() => window.__courseVoice, undefined, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  const invalid = await page.evaluate(() => [...window.__courseVoice.bound.entries()].filter(([, node]) => !node.closest("main article") || node.closest("nav,header,footer")).map(([id]) => id));
  assert.deepEqual(invalid, [], "all 2,996 anchors must belong to book articles");
  await page.locator("#course-assistant-button").click();
  await page.locator("#assistant-start").click();
  await page.waitForFunction(() => window.__courseVoice.getAssistant()?.isConnected);
  await page.locator("#assistant-close").click();
  await page.evaluate(() => {
    window.__scrolls = [];
    const scroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      window.__scrolls.push(this.dataset.voiceId || this.id);
      return scroll.call(this, options);
    };
  });
  const emit = (event) => page.evaluate((value) => window.__liveReplay.emit(value), event);
  const transcript = (delta, start, end, speaker = "input") => emit({ type: `session.${speaker}_transcript.delta`, delta, start_ms: start, end_ms: end });
  const delegation = (id, responseId, offset) => emit({ type: "session.delegation.created", offset_ms: offset, delegation: { id, response_id: responseId, target: "responses" } });
  async function tool(id, responseId, callId, name, args) {
    for (const event of [
      { type: "response.created", response: { id: responseId } },
      { type: "response.output_item.done", item: { type: "function_call", call_id: callId, name, arguments: JSON.stringify(args) } },
      { type: "response.completed", response: { id: responseId } },
    ]) await emit({ type: "response.event", delegation_id: id, event });
    await page.waitForFunction((callId) => window.__liveReplay.sent.some((event) => event.item?.call_id === callId), callId);
    return page.evaluate((callId) => JSON.parse(window.__liveReplay.sent.find((event) => event.item?.call_id === callId).item.output), callId);
  }
  const focusId = () => page.evaluate(() => document.querySelector(".voice-pointed")?.dataset.voiceId);
  await transcript("Find the", 100, 300);
  await transcript(" Gaussian", 310, 600);
  await transcript(" characteristic function.", 620, 1100);
  assert.deepEqual(await page.evaluate(() => window.__scrolls), [], "partial transcripts must never move the page");
  await delegation("d1", "r1", 1200);
  const first = await tool("d1", "r1", "c1", "focus_course_topic", { query: "Find the Gaussian characteristic function" });
  assert.equal(first.entry?.id, "sigreg-heading-7fe760e073");
  const firstScrolls = await page.evaluate(() => window.__scrolls.length);
  await transcript("Here is the Gaussian characteristic function.", 1250, 3000, "output");
  await transcript(" Its derivation uses integration by parts.", 3010, 7000, "output");
  const repeat = await tool("d1", "r1-next", "c2", "highlight_entry", { id: first.entry.id });
  assert.equal(repeat.reused, true);
  const retarget = await tool("d1", "r1-third", "c3", "focus_course_topic", { query: "Show covariance" });
  assert.equal(retarget.ok, false);
  assert.equal(await page.evaluate(() => window.__scrolls.length), firstScrolls);
  await delegation("duplicate", "r-duplicate", 7100);
  assert.equal((await tool("duplicate", "r-duplicate", "c4", "navigate_to", { id: "clouds" })).ok, false, "duplicate delegation cannot unlock focus");
  assert.equal(await focusId(), first.entry.id);

  // A later user request gets a fresh scope. An old response finishing afterward
  // is denied, even if it has valid IDs and would otherwise be navigable.
  await transcript("Show LeWorldModel Equation 4.", 8000, 9200);
  await delegation("d2", "r2", 9300);
  const second = await tool("d2", "r2", "c5", "focus_course_topic", { query: "Show LeWorldModel Equation 4" });
  assert.equal(second.entry?.id, "paper-equation-19aecf226e");
  const stale = await tool("d1", "r1-late", "c6", "navigate_to", { id: "reference" });
  assert.equal(stale.ok, false);
  assert.equal(await focusId(), second.entry.id);
  await page.screenshot({ path: path.join(shots, "equation-light.png") });
  await page.mouse.wheel(0, 650);
  await page.waitForFunction(() => window.__courseVoice.navigation.active.blocked);
  const afterReaderScroll = await page.evaluate(() => window.__scrolls.length);
  assert.equal((await tool("d2", "r2-late", "c7", "highlight_entry", { id: second.entry.id })).ok, false);
  assert.equal(await page.evaluate(() => window.__scrolls.length), afterReaderScroll);

  // A typed request retains its already-verified destination when the service
  // creates a delegation for it. A late older continuation cannot borrow it.
  await page.evaluate(async () => {
    const api = window.__courseVoice;
    const requestId = api.navigation.begin("typed");
    await api.performTool("focus_course_topic", { query: "Find regularization" }, { requestId });
    await api.getAssistant().sendText("Explain regularization", { requestId });
  });
  const typedRequest = await page.evaluate(() => window.__courseVoice.navigation.active.id);
  await delegation("typed-d", "typed-r", 12000);
  assert.equal(await page.evaluate(() => window.__courseVoice.navigation.active.id), typedRequest);
  assert.equal((await tool("typed-d", "typed-r", "c8", "focus_course_topic", { query: "Show covariance" })).ok, false);
  assert.equal((await tool("d1", "r1-latest", "c9", "focus_course_topic", { query: "Show covariance" })).ok, false);
  assert.equal(await focusId(), "learning-heading-994404f3bd");
  // A delayed pre-delegation transcript must not masquerade as a new question.
  await transcript(" please", 9400, 9500);
  await delegation("same-typed", "same-typed-r", 12500);
  assert.equal(await page.evaluate(() => window.__courseVoice.navigation.active.id), typedRequest);
  assert.equal((await tool("same-typed", "same-typed-r", "c10", "focus_course_entry", { id: "paper-equation-19aecf226e" })).ok, false);

  // Light and dark figures: compare actual rendered SVG pixels before/after.
  // A caption can be marked; no color wash may reach any part of the SVG.
  const diagramId = "jepa-diagram-0cb7a9bd34";
  for (const theme of ["light", "dark"]) {
    await page.evaluate(({ theme, id }) => {
      document.documentElement.dataset.theme = theme;
      const node = window.__courseVoice.bound.get(id);
      node.scrollIntoView({ block: "center" });
    }, { theme, id: diagramId });
    const svg = page.locator(`[data-voice-id="${diagramId}"] svg`).first();
    const before = await svg.screenshot({ animations: "disabled" });
    const result = await page.evaluate((id) => window.__courseVoice.performTool("focus_course_entry", { id }), diagramId);
    assert.equal(result.ok, true);
    const after = await svg.screenshot({ animations: "disabled" });
    assert.equal(Buffer.compare(before, after), 0, `${theme} SVG pixels changed when highlighted`);
    await page.screenshot({ path: path.join(shots, `diagram-${theme}.png`) });
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator(".menu").click();
    const focused = await page.evaluate(() => window.__courseVoice.performTool("focus_course_topic", { query: "Show me normality tests" }));
    assert.equal(focused.entry?.id, "testing-heading-f7e66a2d29");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.contents), "closed");
    assert.equal(await page.evaluate(() => document.querySelector("main").inert), false);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll(".voice-pointed")].every((node) => node.closest("main article"))), true);
    await page.screenshot({ path: path.join(shots, `passage-dark-${width}.png`) });
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(shots, "trace.json"), JSON.stringify(await page.evaluate(() => window.__courseVoice.navigation.snapshot()), null, 2));
  console.log(`Navigation harness passed: ${retrievalCases} retrieval cases; real transport/UI event replay; stale, repeated, conflicting and interrupted actions; byte-identical light/dark SVGs; 390/320px page destinations.`);
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
