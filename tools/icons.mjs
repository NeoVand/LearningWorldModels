import Play from "@hugeicons/core-free-icons/PlayIcon";
import Pause from "@hugeicons/core-free-icons/PauseIcon";
import Print from "@hugeicons/core-free-icons/PrinterIcon";
import Copy from "@hugeicons/core-free-icons/Copy01Icon";
import Menu from "@hugeicons/core-free-icons/Menu01Icon";
import Search from "@hugeicons/core-free-icons/Search01Icon";
import Reset from "@hugeicons/core-free-icons/ReloadIcon";
import Chart from "@hugeicons/core-free-icons/Analytics01Icon";
import Download from "@hugeicons/core-free-icons/Download01Icon";
import Book from "@hugeicons/core-free-icons/BookOpen01Icon";
import Code from "@hugeicons/core-free-icons/CodeIcon";
import Check from "@hugeicons/core-free-icons/Tick02Icon";
import Science from "@hugeicons/core-free-icons/TestTube01Icon";
import Moon from "@hugeicons/core-free-icons/Moon02Icon";
import Sun from "@hugeicons/core-free-icons/Sun03Icon";
import Close from "@hugeicons/core-free-icons/Cancel01Icon";
const icons = {
  play: Play,
  pause: Pause,
  print: Print,
  copy: Copy,
  menu: Menu,
  search: Search,
  reset: Reset,
  chart: Chart,
  download: Download,
  book: Book,
  code: Code,
  check: Check,
  science: Science,
  moon: Moon,
  sun: Sun,
  close: Close,
};
export function icon(name) {
  const nodes = icons[name];
  if (!nodes) throw Error("Unknown icon " + name);
  return `<svg class="icon" data-icon="${name}" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${nodes
    .map(
      ([tag, attrs]) =>
        `<${tag} ${Object.entries(attrs)
          .filter(([k]) => k !== "key")
          .map(
            ([k, v]) =>
              `${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}="${v}"`,
          )
          .join(" ")}/>`,
    )
    .join("")}</svg>`;
}
export function decorateControls(html) {
  const map = {
    "world-init": "science",
    "world-train": "play",
    "world-stop": "pause",
    "world-evaluate": "chart",
    "world-compare": "science",
    "world-export": "download",
    "world-control-reset": "reset",
    "world-control": "play",
  };
  html = html.replace(
    /<button([^>]*id="([^"]+)"[^>]*)>([^<]*)<\/button>/g,
    (whole, attrs, id, label) =>
      map[id]
        ? `<button${attrs}>${icon(map[id])}<span>${label}</span></button>`
        : whole,
  );
  html = html.replace(
    "<button data-gradient>Check the analytic gradient</button>",
    `<button data-gradient>${icon("check")}<span>Check the gradient</span></button>`,
  );
  let count = 0;
  html = html.replace(
    /<label>([^<]*?)<select([^>]*)>([\s\S]*?)<\/select><\/label>/g,
    (_, label, attrs, options) => {
      const existing = attrs.match(/\bid="([^"]+)"/),
        id = existing?.[1] || `choice-${++count}`;
      const parsed = [
        ...options.matchAll(/<option([^>]*)>(.*?)<\/option>/g),
      ].map((m) => ({
        value: m[1].match(/value="([^"]+)"/)?.[1] || m[2],
        label: m[2],
        selected: /\bselected\b/.test(m[1]),
      }));
      const selected = parsed.find((o) => o.selected) || parsed[0];
      const names = {
        "Ring · radius √2": "Ring",
        "Two crossing lines": "Crossing lines",
        "Almost rank one": "Rank one",
        "Shifted Gaussian": "Shifted",
        "Point mass at zero": "Point mass",
        "A · local reach": "Reach",
        "B · local turn": "Turn",
        "C · local curl": "Curl",
        "D · distant stress test": "Distant",
      };
      return `<div class="choice-field"><span class="control-label">${label.trim()}</span><select${attrs}${existing ? "" : ` id="${id}"`} class="select-state" tabindex="-1" aria-hidden="true">${options}</select><div class="segments" role="group" aria-label="${label.trim()}">${parsed.map((o) => `<button type="button" data-select="${id}" data-value="${o.value}" aria-pressed="${o === selected}" title="${o.label}">${names[o.label] || o.label}</button>`).join("")}</div></div>`;
    },
  );
  return html;
}
