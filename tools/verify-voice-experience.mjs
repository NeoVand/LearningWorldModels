import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { once } from "node:events";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const htmlPath = path.join(root, "world-models.html");
const html = fs.readFileSync(htmlPath, "utf8");
assert.match(html, /id="course-voice-index"/, "build the voice edition before browser QA");
assert.ok(
  !/sk-proj-[A-Za-z0-9_-]{20,}|sk_[a-f0-9]{32,}/.test(html),
  "a provider credential appears in the public HTML",
);

const { chromium } = await import(
  process.env.BOOK_PLAYWRIGHT_MODULE || "playwright"
);
const chrome = process.env.BOOK_CHROME_PATH || [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((candidate) => fs.existsSync(candidate));

// Run against HTTP, as the published book does: storage and selection behave
// differently under file:// on some versions of Chromium.
const mime = { ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".json": "application/json" };
const server = http.createServer((request, response) => {
  let name;
  try { name = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch { response.writeHead(400).end(); return; }
  const file = path.resolve(root, `.${name === "/" ? "/world-models.html" : name}`);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const url = `http://127.0.0.1:${server.address().port}/world-models.html`;
const browser = await chromium.launch({
  headless: true,
  ...(chrome ? { executablePath: chrome } : {}),
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const errors = [];
const providerRequests = [];
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
await context.route(/https:\/\/(?:api\.elevenlabs\.io|api\.openai\.com)\//, async (route) => {
  providerRequests.push(route.request().url());
  await route.abort();
});

async function ready(target = page) {
  await target.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await target.waitForFunction(() => Boolean(window.__courseVoice), undefined, { timeout: 60_000 });
  await target.evaluate(() => document.fonts.ready);
}

async function setSelection(target) {
  await target.evaluate(() => {
    const paragraph = [...document.querySelectorAll('main p[data-voice-id]')]
      .find((element) => element.textContent.trim().length > 70);
    if (!paragraph) throw Error("No indexed prose paragraph found");
    paragraph.scrollIntoView({ block: "center" });
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
  await target.locator("#voice-selection-menu").waitFor({ state: "visible" });
}

async function layout(target, label) {
  const result = await target.evaluate(() => {
    const within = (selector) => {
      const element = document.querySelector(selector);
      if (!element || element.hidden || !element.getClientRects().length) return true;
      const rect = element.getBoundingClientRect();
      return rect.left >= -2 && rect.right <= innerWidth + 2;
    };
    return {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      settings: within("#voice-settings"),
      assistant: within("#course-assistant"),
      player: within("#course-player"),
    };
  });
  if (result.documentWidth > result.width + 2) {
    result.offenders = await target.evaluate(() => [...document.querySelectorAll("body .katex, body header *, body .visual-controls")]
      .filter((element) => element instanceof HTMLElement && element.getClientRects().length && element.getBoundingClientRect().right > innerWidth + 2 && element.getBoundingClientRect().right < innerWidth + 35)
      .slice(0, 24)
      .map((element) => ({ tag: element.tagName, id: element.id, className: typeof element.className === "string" ? element.className.slice(0, 100) : "", right: Math.round(element.getBoundingClientRect().right), width: Math.round(element.getBoundingClientRect().width), parent: element.closest("[id]")?.id, text: element.textContent?.slice(0, 45), chain: element.closest("#evaluation") ? [...(function* () { for (let node = element, i = 0; node && i < 8; node = node.parentElement, i++) yield `${node.tagName.toLowerCase()}.${String(node.className || "").slice(0, 40)}[overflow=${getComputedStyle(node).overflowX}]`; })()] : undefined })));
  }
  if (process.env.BOOK_VOICE_QA_ALLOW_EXISTING_OVERFLOW !== "1")
    assert.ok(result.documentWidth <= result.width + 2, `${label}: horizontal page overflow ${JSON.stringify(result)}`);
  else if (result.documentWidth > result.width + 2)
    console.warn(`Existing overflow while inspecting ${label}: ${JSON.stringify(result)}`);
  assert.ok(result.settings && result.assistant && result.player, `${label}: a voice panel leaves the viewport ${JSON.stringify(result)}`);
}

function fakeWav(seconds = 2.5) {
  const sampleRate = 16_000;
  const samples = Math.round(seconds * sampleRate);
  const data = Buffer.alloc(44 + samples * 2);
  data.write("RIFF", 0);
  data.writeUInt32LE(data.length - 8, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(sampleRate, 24);
  data.writeUInt32LE(sampleRate * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(samples * 2, 40);
  return data.toString("base64");
}

try {
  await ready();
  assert.equal(await page.locator("#voice-settings-button").count(), 1);
  assert.equal(await page.locator("#course-listen-button").count(), 1);
  assert.equal(await page.locator("#course-assistant-button").count(), 1);
  assert.equal(
    await page.evaluate(() => document.querySelector("#voice-settings-button").nextElementSibling.id),
    "print",
    "settings must sit beside Print",
  );

  const coverage = await page.evaluate(() => {
    const { index, bound, playback } = window.__courseVoice;
    return {
      count: index.items.length,
      missing: index.items.filter((item) => !bound.has(item.id)).map((item) => item.id),
      playback: playback.length,
      constructs: [...document.querySelectorAll(".voice-construct-actions")].length,
      tables: document.querySelectorAll("main table").length,
      narratedTables: [...document.querySelectorAll("main table")].filter((table) => table.closest(".table-wrap[data-voice-id]")).length,
    };
  });
  assert.deepEqual(coverage.missing, [], `unbound indexed entries: ${coverage.missing.slice(0, 10).join(", ")}`);
  assert.ok(coverage.count > 1000 && coverage.playback > 1000, "the course voice index is unexpectedly small");
  assert.ok(coverage.constructs > 90, "widgets and figures need their own actions");
  assert.equal(coverage.tables, 15);
  assert.equal(coverage.narratedTables, coverage.tables, "every table needs a bound narration entry");

  await page.locator("#course-listen-button").click();
  assert.ok(await page.locator("#voice-settings").evaluate((dialog) => dialog.open));
  assert.equal(await page.evaluate(() => localStorage.getItem("world-voice-settings")), null);
  await page.locator("[data-close-settings]").click();
  await page.locator("#course-assistant-button").click();
  await page.locator("#assistant-start").click();
  assert.ok(await page.locator("#voice-settings").evaluate((dialog) => dialog.open));
  assert.equal(await page.evaluate(() => document.activeElement?.id), "voice-openai-key");
  await page.locator("[data-close-settings]").click();
  await page.locator("#assistant-close").click();

  await setSelection(page);
  assert.equal(await page.locator('#voice-selection-menu [data-selection-action="listen"]').count(), 1);
  assert.equal(await page.locator('#voice-selection-menu [data-selection-action="explain"]').count(), 1);
  await page.locator('#voice-selection-menu [data-selection-action="explain"]').click();
  assert.ok(await page.locator("#voice-settings").evaluate((dialog) => dialog.open));
  await page.locator("[data-close-settings]").click();
  await page.locator("#assistant-close").click();

  // Check both reader themes and the small-screen panels, with snapshots for
  // human visual review. All snapshots stay in the ignored tmp directory.
  const shots = path.join(root, "tmp", "voice-qa");
  fs.mkdirSync(shots, { recursive: true });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 780 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
        localStorage.setItem("world-models-theme", value);
      }, theme);
      await page.locator("#voice-settings-button").click();
      await layout(page, `${width}px ${theme} settings`);
      await page.screenshot({ path: path.join(shots, `settings-${width}-${theme}.png`) });
      await page.locator("[data-close-settings]").click();
      await page.locator("#course-assistant-button").click();
      await layout(page, `${width}px ${theme} assistant`);
      await page.screenshot({ path: path.join(shots, `assistant-${width}-${theme}.png`) });
      await page.locator("#assistant-close").click();
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.locator("#voice-settings-button").click();
  assert.equal(await page.locator("#voice-model-choices [role=radio]").count(), 4);
  assert.equal(await page.locator("#voice-model-choices [aria-checked=true]").textContent().then((value) => value.includes("GPT-6 Sol")), true);
  await page.getByRole("radio", { name: /GPT-6 Luna/ }).click();
  assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem("world-voice-settings")).model), "gpt-6-luna");
  await page.getByRole("radio", { name: /GPT-6 Sol/ }).click();
  await page.locator("[data-close-settings]").click();

  const fakeEleven = "qa-eleven-session-only";
  const fakeOpenAI = "qa-openai-session-only";
  await page.locator("#voice-settings-button").click();
  await page.locator("#voice-eleven-key").fill(fakeEleven);
  await page.locator("#voice-openai-key").fill(fakeOpenAI);
  assert.deepEqual(await page.evaluate(() => {
    const temporary = JSON.parse(sessionStorage.getItem("world-voice-settings"));
    return {
      hasEleven: Boolean(temporary.elevenlabs),
      hasOpenAI: Boolean(temporary.openai),
      remembered: Boolean(localStorage.getItem("world-voice-settings")),
    };
  }), { hasEleven: true, hasOpenAI: true, remembered: false });
  await page.locator("[data-close-settings]").click();
  await ready();
  await page.locator("#voice-settings-button").click();
  assert.equal(await page.locator("#voice-eleven-key").inputValue(), fakeEleven);
  assert.equal(await page.locator("#voice-openai-key").inputValue(), fakeOpenAI);
  await page.locator("[data-close-settings]").click();

  const separateTab = await context.newPage();
  separateTab.on("pageerror", (error) => errors.push(error.message));
  await ready(separateTab);
  await separateTab.locator("#voice-settings-button").click();
  assert.equal(await separateTab.locator("#voice-eleven-key").inputValue(), "");
  assert.equal(await separateTab.locator("#voice-openai-key").inputValue(), "");
  await separateTab.close();

  await page.locator("#voice-settings-button").click();
  await page.locator("#voice-remember").check();
  assert.ok(await page.evaluate(() => Boolean(localStorage.getItem("world-voice-settings"))));
  await page.locator("[data-close-settings]").click();
  const rememberedTab = await context.newPage();
  rememberedTab.on("pageerror", (error) => errors.push(error.message));
  await ready(rememberedTab);
  await rememberedTab.locator("#voice-settings-button").click();
  assert.equal(await rememberedTab.locator("#voice-eleven-key").inputValue(), fakeEleven);
  assert.equal(await rememberedTab.locator("#voice-openai-key").inputValue(), fakeOpenAI);
  await rememberedTab.close();

  const toolResults = await page.evaluate(async () => {
    const { index, bound, performTool } = window.__courseVoice;
    const search = await performTool("search_course", { query: "SIGReg", limit: 4 });
    const target = index.items.find((item) => item.kind === "widget" && item.figureId === "O1");
    const entry = await performTool("get_course_entry", { id: target.id });
    const navigate = await performTool("navigate_to", { id: target.id });
    const highlight = await performTool("highlight_entry", { id: target.id });
    const highlighted = bound.get(target.id).classList.contains("voice-pointed");
    const unknown = await performTool("navigate_to", { id: "__not_a_course_id__" });
    const unknownControl = await performTool("set_widget_control", { id: "O1", control: "__not_a_control__", value: "3" });
    const outsideRange = await performTool("set_widget_control", { id: "O1", control: "time", value: "999999" });
    const valid = await performTool("set_widget_control", { id: "O1", control: "time", value: "20" });
    const choice = await performTool("set_widget_control", { id: "N7", control: "mode", value: "BatchNorm" });
    const invalidListen = await performTool("listen_to", { id: "__not_a_course_id__" });
    return { searchCount: search.results.length, entryId: entry.id, targetId: target.id, navigate, highlight, highlighted, unknown, unknownControl, outsideRange, valid, choice, invalidListen };
  });
  assert.ok(toolResults.searchCount > 0);
  assert.equal(toolResults.entryId, toolResults.targetId);
  assert.equal(toolResults.navigate.ok, true);
  assert.equal(toolResults.highlight.ok, true);
  assert.equal(toolResults.highlighted, true);
  assert.match(toolResults.unknown.error, /Unknown/);
  assert.match(toolResults.unknownControl.error, /Unknown/);
  assert.match(toolResults.outsideRange.error, /range/);
  assert.equal(toolResults.valid.ok, true);
  assert.equal(toolResults.valid.state.controls.find((control) => control.key === "time")?.value, "20");
  assert.equal(toolResults.choice.state.controls.find((control) => control.key === "mode")?.value, "BatchNorm");
  assert.deepEqual(toolResults.choice.state.controls.find((control) => control.key === "mode")?.options, ["LayerNorm", "BatchNorm", "Stored statistics"]);
  assert.match(toolResults.invalidListen.error, /Unknown/);

  const paperFocus = await page.evaluate(async () => {
    getSelection()?.removeAllRanges();
    const api = window.__courseVoice;
    const focused = await api.performTool("focus_course_topic", { query: "Explain LeWorldModel paper Equation 4" });
    const node = api.bound.get(focused.entry?.id);
    const rect = node?.getBoundingClientRect();
    const absent = await api.performTool("focus_course_topic", { query: "Explain paper Equation 77" });
    return {
      id: focused.entry?.id,
      kind: focused.entry?.kind,
      guide: focused.entry?.teachingGuide?.idea,
      highlighted: node?.classList.contains("voice-pointed"),
      visible: rect && rect.top >= 0 && rect.top < innerHeight && rect.bottom > 0,
      header: document.querySelector("#assistant-transport-focus")?.textContent,
      absent,
    };
  });
  assert.equal(paperFocus.id, "paper-equation-19aecf226e");
  assert.equal(paperFocus.kind, "equation");
  assert.match(paperFocus.guide, /candidate plan/);
  assert.equal(paperFocus.highlighted, true);
  assert.equal(paperFocus.visible, true);
  assert.match(paperFocus.header, /Equation 4/);
  assert.equal(paperFocus.absent.ok, false, "an unknown equation must not silently highlight a different one");
  await page.screenshot({ path: path.join(shots, "paper-equation-focus.png") });

  // Intercept synthesis and inspect its request. No test key reaches a provider.
  const syntheticAudio = fakeWav();
  let synthesis;
  let synthesizedResolve;
  const synthesized = new Promise((resolve) => { synthesizedResolve = resolve; });
  await context.unroute(/https:\/\/(?:api\.elevenlabs\.io|api\.openai\.com)\//);
  await context.route("https://api.elevenlabs.io/v1/text-to-speech/**", async (route) => {
    const request = route.request();
    synthesis = {
      key: request.headers()["xi-api-key"],
      body: JSON.parse(request.postData()),
    };
    synthesizedResolve();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ audio_base64: syntheticAudio }) });
  });
  await context.route(/https:\/\/api\.openai\.com\//, (route) => route.abort());
  await page.locator("#visual-O1 .voice-construct-actions button").first().click();
  await Promise.race([synthesized, new Promise((_, reject) => setTimeout(() => reject(new Error("Narration did not request its indexed script")), 10_000))]);
  await page.waitForFunction(() => document.querySelector("#course-player")?.dataset.state === "playing", undefined, { timeout: 10_000 });
  assert.equal(synthesis?.key, fakeEleven);
  assert.equal(synthesis?.body?.model_id, "eleven_multilingual_v2");
  assert.ok(synthesis?.body?.text?.length > 80);
  assert.ok(!synthesis.body.text.includes("\\theta"), "spoken widget narration must not expose raw TeX");
  await page.locator('[data-voice-action="stop"]').click();

  // A failed provider call must not be reported to the tutor as successful narration.
  await context.route("https://api.elevenlabs.io/v1/text-to-speech/**", (route) =>
    route.fulfill({ status: 402, contentType: "application/json", body: JSON.stringify({ detail: { message: "Account limit reached" } }) }),
  );
  const failedListen = await page.evaluate(async () => {
    const other = window.__courseVoice.index.items.find((item) => item.kind === "widget" && item.figureId === "N7");
    return window.__courseVoice.performTool("listen_to", { id: other.id });
  });
  assert.equal(failedListen.ok, false);
  assert.match(failedListen.error, /402/);

  await page.locator("#voice-settings-button").click();
  await page.locator("#voice-clear-keys").click();
  assert.deepEqual(await page.evaluate(() => {
    const settings = JSON.parse(sessionStorage.getItem("world-voice-settings") || "{}");
    return { openai: settings.openai, elevenlabs: settings.elevenlabs, remember: settings.remember, local: localStorage.getItem("world-voice-settings") };
  }), { openai: "", elevenlabs: "", remember: false, local: null });
  await page.locator("[data-close-settings]").click();
  assert.deepEqual(errors, [], `browser errors: ${errors.join("; ")}`);
  console.log(`Voice browser QA passed: ${coverage.count} bound entries, ${coverage.constructs} construct controls, 6 responsive/theme settings and assistant pairs, session and device keys, safe course tools, mocked narration. Screenshots: ${shots}`);
} finally {
  if (process.env.BOOK_VOICE_QA_DEBUG) console.error("Voice QA cleanup: context");
  await context.close();
  if (process.env.BOOK_VOICE_QA_DEBUG) console.error("Voice QA cleanup: browser");
  await browser.close();
  if (process.env.BOOK_VOICE_QA_DEBUG) console.error("Voice QA cleanup: server");
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  if (process.env.BOOK_VOICE_QA_DEBUG) console.error("Voice QA cleanup: complete");
}
