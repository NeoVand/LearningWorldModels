// Spoken course audio. Credentials stay in the caller's memory; only generated
// audio and its non-secret timing metadata are cached on this device.
const MODEL = "eleven_multilingual_v2";
const FORMAT = "mp3_44100_128";
const DB_NAME = "before-the-move-audio-v1";

function openCache() {
  return new Promise((resolve) => {
    if (!globalThis.indexedDB) return resolve(null);
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("speech");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function cacheGet(key) {
  const db = await openCache();
  if (!db) return null;
  return new Promise((resolve) => {
    const request = db.transaction("speech").objectStore("speech").get(key);
    request.onsuccess = () => { const value = request.result || null; db.close(); resolve(value); };
    request.onerror = () => { db.close(); resolve(null); };
  });
}

async function cachePut(key, value) {
  const db = await openCache();
  if (!db) return;
  return new Promise((resolve) => {
    const tx = db.transaction("speech", "readwrite");
    tx.objectStore("speech").put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); resolve(); };
  });
}

export function clearNarrationCache() {
  return new Promise((resolve) => {
    if (!globalThis.indexedDB) return resolve();
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = request.onerror = request.onblocked = () => resolve();
  });
}

function base64Bytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function audioFor(item, key, voiceId, signal) {
  const speech = String(item.speech || item.text || "").trim();
  if (!speech) throw new Error("This passage has no narration script yet.");
  if (speech.length > 4800) throw new Error("This passage is too long for one audio segment.");
  const cacheKey = JSON.stringify([MODEL, FORMAT, voiceId, speech]);
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=${FORMAT}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": key },
      body: JSON.stringify({ text: speech, model_id: MODEL }),
      signal,
    },
  );
  if (!response.ok) {
    let detail = "";
    try {
      const error = await response.json();
      detail = error.detail?.message || error.detail?.status || error.message || "";
    } catch {}
    throw new Error(`ElevenLabs ${response.status}${detail ? ": " + detail : ""}`);
  }
  const data = await response.json();
  if (!data.audio_base64) throw new Error("ElevenLabs returned no audio.");
  const audio = {
    blob: new Blob([base64Bytes(data.audio_base64)], { type: "audio/mpeg" }),
    alignment: data.normalized_alignment || data.alignment || null,
    speech,
  };
  await cachePut(cacheKey, audio);
  return audio;
}

export async function listElevenLabsVoices(key) {
  const response = await fetch("https://api.elevenlabs.io/v2/voices?include_total_count=false&page_size=100", {
    headers: { "xi-api-key": key },
  });
  if (!response.ok) throw new Error(`ElevenLabs ${response.status}: unable to load voices.`);
  const data = await response.json();
  return (data.voices || []).map(({ voice_id, name, category, labels }) => ({
    id: voice_id,
    name,
    category,
    accent: labels?.accent || "",
  }));
}

export class NarrationPlayer {
  constructor({ getKey, getVoice, onState = () => {}, onProgress = () => {}, onItem = () => {} }) {
    this.getKey = getKey;
    this.getVoice = getVoice;
    this.onState = onState;
    this.onProgress = onProgress;
    this.onItem = onItem;
    this.audio = new Audio();
    this.audio.preload = "auto";
    this.audio.addEventListener("timeupdate", () => this.progress());
    this.audio.addEventListener("ended", () => this.next());
    this.audio.addEventListener("pause", () => {
      if (this.current) this.onState({ state: "paused", item: this.current });
    });
    this.audio.addEventListener("play", () => {
      if (this.current) this.onState({ state: "playing", item: this.current });
    });
    this.queue = [];
    this.index = -1;
    this.serial = 0;
    this.objectURL = null;
    this.abort = null;
    this.current = null;
    this.lastError = null;
    this.follow = true;
  }

  async play(items, start = 0) {
    if (!this.getKey()) throw new Error("Add an ElevenLabs key in Listening settings.");
    if (!this.getVoice()) throw new Error("Choose an ElevenLabs voice in Listening settings.");
    this.stop();
    this.queue = items.filter((item) => item && (item.speech || item.text));
    if (!this.queue.length) throw new Error("There is nothing to narrate here.");
    this.index = Math.max(0, Math.min(start, this.queue.length - 1));
    return this.loadCurrent();
  }

  async loadCurrent() {
    const item = this.queue[this.index];
    if (!item) return this.stop();
    const serial = ++this.serial;
    this.abort?.abort();
    this.abort = new AbortController();
    this.audio.pause();
    if (this.objectURL) URL.revokeObjectURL(this.objectURL);
    this.objectURL = null;
    this.current = item;
    this.lastError = null;
    this.onItem(item, this.index, this.queue.length);
    this.onState({ state: "loading", item });
    try {
      const data = await audioFor(item, this.getKey(), this.getVoice(), this.abort.signal);
      if (serial !== this.serial) return;
      this.alignment = data.alignment;
      this.speech = data.speech;
      this.objectURL = URL.createObjectURL(data.blob);
      this.audio.src = this.objectURL;
      await this.audio.play();
      // Preparing one next passage keeps continuous reading smooth without
      // synthesizing an entire chapter before the reader asks for it.
      const next = this.queue[this.index + 1];
      if (next) audioFor(next, this.getKey(), this.getVoice()).catch(() => {});
      return true;
    } catch (error) {
      if (serial === this.serial && error?.name !== "AbortError") {
        this.lastError = error;
        this.onState({ state: "error", item, error: error.message || String(error) });
      }
      return false;
    }
  }

  progress() {
    const a = this.alignment;
    const times = a?.character_start_times_seconds || [];
    let position = 0;
    if (times.length) {
      let lo = 0, hi = times.length;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (times[mid] <= this.audio.currentTime) lo = mid + 1;
        else hi = mid;
      }
      position = Math.max(0, lo - 1);
    }
    this.onProgress({
      time: this.audio.currentTime || 0,
      duration: Number.isFinite(this.audio.duration) ? this.audio.duration : 0,
      speech: this.speech || "",
      character: position,
      item: this.current,
    });
  }

  pause() { this.audio.pause(); }
  resume() { return this.audio.play(); }
  toggle() { return this.audio.paused ? this.resume() : this.pause(); }
  next() {
    if (this.index + 1 >= this.queue.length) return this.stop(true);
    this.index++;
    return this.loadCurrent();
  }
  previous() {
    this.index = Math.max(0, this.index - 1);
    return this.loadCurrent();
  }
  seek(fraction) {
    if (Number.isFinite(this.audio.duration)) this.audio.currentTime = Math.max(0, Math.min(1, fraction)) * this.audio.duration;
  }
  stop(finished = false) {
    this.serial++;
    this.abort?.abort();
    this.abort = null;
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    if (this.objectURL) URL.revokeObjectURL(this.objectURL);
    this.objectURL = null;
    this.current = null;
    this.queue = [];
    this.index = -1;
    this.onState({ state: finished ? "finished" : "stopped" });
  }
}
