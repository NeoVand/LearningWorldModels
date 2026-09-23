// Highlight glyph backgrounds only. Never tint the surface containing a plot,
// image, SVG, canvas, or interactive control (especially in dark mode).
const marks = new Map();
export function clearVoiceMark(name) {
  const prior = marks.get(name);
  prior?.classList.remove(`voice-mark-${name}`);
  globalThis.CSS?.highlights?.delete(`course-${name}`);
  marks.delete(name);
}
export function paintVoiceMark(node, name = "focus", title = "Course figure") {
  clearVoiceMark(name);
  if (!node?.isConnected) return;
  let text = node;
  if (node.matches(".teaching-visual,.lab,.diagram,figure,.code-wrap")) {
    text = node.querySelector(".visual-heading h3, .lab-heading h3, h3, figcaption, .caption, .voice-figure-label");
    if (!text) {
      text = document.createElement("span");
      text.className = "voice-figure-label";
      text.textContent = title;
      node.prepend(text);
    }
  } else if (node.matches(".table-wrap")) text = node.querySelector("table") || node;
  else if (node.matches(".katex")) text = node.querySelector(".katex-html") || node;
  marks.set(name, text);
  if (!node.matches(".katex") && globalThis.CSS?.highlights && globalThis.Highlight) {
    const range = document.createRange();
    range.selectNodeContents(text);
    CSS.highlights.set(`course-${name}`, new Highlight(range));
  } else text.classList.add(`voice-mark-${name}`);
}
