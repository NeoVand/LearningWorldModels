import { refreshPalette } from "./palette.js";
const root = document.documentElement;
const nav = document.getElementById("contents");
const menu = document.querySelector(".menu");
const search = document.getElementById("search");
const main = document.querySelector("main");
const narrow = matchMedia("(max-width: 1099px)");
const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};
function contents(open, focus = false) {
  root.dataset.contents = open ? "open" : "closed";
  nav.inert = !open;
  main.inert = open && narrow.matches;
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close contents" : "Open contents");
  if (!narrow.matches) save("world-models-contents", open ? "open" : "closed");
  if (focus) (open ? document.getElementById("close-contents") : menu).focus();
}
contents(!narrow.matches && read("world-models-contents") === "open");
menu.addEventListener("click", () =>
  contents(root.dataset.contents !== "open", true),
);
document
  .getElementById("close-contents")
  .addEventListener("click", () => contents(false, true));
document
  .getElementById("contents-scrim")
  .addEventListener("click", () => contents(false, true));
narrow.addEventListener("change", () => contents(false));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && root.dataset.contents === "open")
    contents(false, true);
  if (e.key === "Tab" && narrow.matches && root.dataset.contents === "open") {
    const candidates = [...nav.querySelectorAll("button,input,a")].filter(
      (x) => x.getClientRects().length && !x.closest("[hidden]"),
    );
    const first = candidates[0],
      last = candidates.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
const chapters = [...nav.querySelectorAll(".nav-chapter")];
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    if (narrow.matches) contents(false);
    const target = document.getElementById(a.hash.slice(1));
    if (target) {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  }),
);
search.addEventListener("input", () => {
  const q = search.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const group of chapters) {
    const title = group
      .querySelector(".chapter-link")
      .textContent.toLocaleLowerCase();
    const links = [...group.querySelectorAll(".section-link")];
    const whole = title.includes(q);
    links.forEach(
      (a) =>
        (a.hidden =
          !!q && !whole && !a.textContent.toLocaleLowerCase().includes(q)),
    );
    group.hidden = !!q && !whole && !links.some((a) => !a.hidden);
    group.classList.toggle("search-match", !!q && !group.hidden);
    if (!group.hidden) count++;
  }
  document.getElementById("search-empty").hidden = count > 0;
});
function setActive(id) {
  const target = document.getElementById(id),
    chapter = target?.closest("article")?.id;
  if (!chapter) return;
  nav.querySelectorAll("[aria-current]").forEach((a) => {
    a.removeAttribute("aria-current");
    a.classList.remove("active");
  });
  const link = nav.querySelector(`a[href="#${id}"]`);
  if (link) {
    link.setAttribute("aria-current", "location");
    link.classList.add("active");
  }
  chapters.forEach((g) =>
    g.classList.toggle("current", g.dataset.chapter === chapter),
  );
}
setActive(location.hash.slice(1) || "opening");
addEventListener("hashchange", () => setActive(location.hash.slice(1)));
const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible.length) setActive(visible[0].target.id);
  },
  { rootMargin: "-70px 0px -65% 0px" },
);
document.querySelectorAll("article,h2").forEach((e) => observer.observe(e));
const themeButton = document.getElementById("theme-toggle");
function themeLabel() {
  const dark = root.dataset.theme === "dark";
  themeButton.setAttribute(
    "aria-label",
    dark ? "Switch to day mode" : "Switch to night mode",
  );
  themeButton.title = dark ? "Day mode" : "Night mode";
}
function repaint() {
  refreshPalette();
  dispatchEvent(new Event("book-theme-change"));
}
themeLabel();
themeButton.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  save("world-models-theme", root.dataset.theme);
  themeLabel();
  repaint();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!read("world-models-theme")) {
    root.dataset.theme = e.matches ? "dark" : "light";
    themeLabel();
    repaint();
  }
});
addEventListener("beforeprint", repaint);
addEventListener("afterprint", repaint);

// A visible edge cue remains useful when a reader zooms beyond tested widths.
// Keep overflowed equations keyboard-scrollable without adding tab stops otherwise.
let mathFrame;
function refreshMathOverflow() {
  cancelAnimationFrame(mathFrame);
  mathFrame = requestAnimationFrame(() => {
    document.querySelectorAll("article .katex-display, article p .katex").forEach((el) => {
      const overflow =
        el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2;
      el.classList.toggle("math-scrollable", overflow);
      el.classList.toggle(
        "math-more",
        overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 3,
      );
      if (overflow) {
        el.tabIndex = 0;
        el.setAttribute(
          "aria-label",
          "Equation; scroll horizontally to read the remaining terms",
        );
      } else {
        el.removeAttribute("tabindex");
        el.removeAttribute("aria-label");
      }
    });
  });
}
document.addEventListener(
  "scroll",
  (e) => {
    if (e.target.classList?.contains("math-scrollable"))
      e.target.classList.toggle(
        "math-more",
        e.target.scrollLeft + e.target.clientWidth < e.target.scrollWidth - 3,
      );
  },
  true,
);
window.addEventListener("resize", refreshMathOverflow);
document.addEventListener("toggle", refreshMathOverflow, true);
document.fonts.ready.then(refreshMathOverflow);
