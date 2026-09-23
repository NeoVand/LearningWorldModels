import assert from "node:assert/strict";
import { BACKEND_MODELS, DEFAULT_BACKEND_MODEL, LiveCourseAssistant } from "../book/edition2/live-assistant.js";

assert.equal(DEFAULT_BACKEND_MODEL, "gpt-6-sol");
assert.deepEqual(BACKEND_MODELS.map(({ id }) => id), ["gpt-6-sol", "gpt-6-luna", "gpt-6-astra", "gpt-5.6-terra"]);

const events = [];
const assistant = new LiveCourseAssistant({ apiKey: "test-key" });
assistant.state = "connected";
assistant.channel = { readyState: "open", send: (data) => events.push(JSON.parse(data)) };

const switching = assistant.setBackendModel("gpt-6-luna");
assert.equal(events[0].type, "session.update");
assert.deepEqual(events[0].session.delegation, { type: "responses", responses: { model: "gpt-6-luna" } });
assert.equal(assistant.backendModel, "gpt-6-sol", "the displayed model must wait for provider confirmation");
assistant._handleEvent({
  type: "session.updated",
  client_event_id: events[0].event_id,
  session: { delegation: { type: "responses", responses: { model: "gpt-6-luna" } } },
});
assert.equal(await switching, "gpt-6-luna");
assert.equal(assistant.backendModel, "gpt-6-luna");
await assert.rejects(assistant.setBackendModel("gpt-6-terra"), /supported assistant model/);

const rejected = assistant.setBackendModel("gpt-6-astra");
assistant._handleEvent({
  type: "error",
  client_event_id: events.at(-1).event_id,
  error: { message: "Model unavailable" },
});
await assert.rejects(rejected, /Model unavailable/);
assert.equal(assistant.backendModel, "gpt-6-luna", "a rejected update must keep the previous model");

const transcripts = [];
assistant.onTranscript = (event) => transcripts.push(event);
const microphoneTrack = { enabled: true };
const senderTracks = [];
assistant.microphone = { getAudioTracks: () => [microphoneTrack] };
assistant.microphoneSender = { replaceTrack: async (track) => { senderTracks.push(track); } };
assistant.setMuted(true);
await assistant._microphoneSwitch;
assistant._handleEvent({ type: "session.input_transcript.delta", delta: "phantom speech" });
assert.equal(microphoneTrack.enabled, false);
assert.deepEqual(senderTracks, [null]);
assert.equal(transcripts.length, 0, "muted input must not trigger navigation from a transcript");
assistant.setMuted(false);
await assistant._microphoneSwitch;
assistant._handleEvent({ type: "session.input_transcript.delta", delta: "find SIGReg" });
assert.equal(microphoneTrack.enabled, true);
assert.equal(senderTracks.at(-1), microphoneTrack);
assert.equal(transcripts.at(-1)?.delta, "find SIGReg");

console.log("GPT-Live backend model selection and update acknowledgment passed.");
