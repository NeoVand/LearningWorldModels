// All assistant page mutations pass through this controller. Transcripts are
// captions, not commands. A verified focus is pinned for its request, and late
// work can never acquire permission from a newer request.
export class NavigationController {
  constructor() {
    this.sequence = 0;
    this.active = null;
    this.events = [];
    this.queue = Promise.resolve();
  }
  record(type, detail = {}) {
    this.events.push({ type, ...detail });
    if (this.events.length > 160) this.events.shift();
  }
  begin(source = "reader", { blocked = false } = {}) {
    const id = `request-${++this.sequence}`;
    this.active = { id, source, targetId: null, blocked, result: null };
    this.record("request", { requestId: id, source, blocked });
    return id;
  }
  cancel(reason = "reader took control") {
    if (this.active) this.active.blocked = true;
    this.record("cancel", { requestId: this.active?.id, reason });
  }
  permits(id) { return Boolean(id && this.active?.id === id && !this.active.blocked); }
  rejection(id) {
    this.record("rejected", { requestId: id });
    return { ok: false, visible: false, error: "This page action is no longer active. The reader or a newer request took control. Do not move the page or claim it moved." };
  }
  focus(requestId, targetId, apply, visible) {
    const job = async () => {
      if (!this.permits(requestId)) return this.rejection(requestId);
      const request = this.active;
      if (request.targetId) {
        if (request.targetId !== targetId) {
          this.record("pinned", { requestId, targetId, retainedId: request.targetId });
          return { ok: false, visible: false, retainedId: request.targetId, error: "This answer already has a destination. Read other entries without moving the page; wait for a new learner request to change focus." };
        }
        // An idempotent repeat never scrolls, including after the reader scrolls.
        const shown = visible();
        return { ...request.result, ok: shown && request.result.ok, visible: shown, reused: true, ...(shown ? {} : { error: "The reader has moved away from this passage. Do not claim it is still on screen." }) };
      }
      const result = await apply(() => this.permits(requestId));
      if (!this.permits(requestId)) return this.rejection(requestId);
      if (result.visible) {
        request.targetId = targetId;
        request.result = result;
        this.record("focused", { requestId, targetId, exact: result.ok });
      } else this.record("not-found", { requestId, targetId });
      return result;
    };
    const promise = this.queue.then(job, job);
    this.queue = promise.catch(() => {});
    return promise;
  }
  snapshot() {
    return { active: this.active && { id: this.active.id, source: this.active.source, targetId: this.active.targetId, blocked: this.active.blocked }, events: this.events.map((event) => ({ ...event })) };
  }
}
