// The plots and the reading surface share the same semantic color roles.
export const palette = {};
export function refreshPalette() {
  const css = getComputedStyle(document.documentElement);
  for (const [key, token] of Object.entries({
    obs: "blue",
    lat: "violet",
    pred: "teal",
    act: "amber",
    loss: "red",
    ink: "ink",
    muted: "muted",
    line: "plot-line",
  })) {
    palette[key] = css.getPropertyValue("--" + token).trim();
  }
}
refreshPalette();
// Refresh before canvas listeners repaint, including programmatic theme changes.
addEventListener("book-theme-change", refreshPalette);
