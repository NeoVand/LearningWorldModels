import fs from "node:fs";

// Browser snapshots serialize typed pixel arrays as numeric-keyed objects.
// Store those as compact JSON arrays so higher-resolution records remain readable.
export function writeExperiment(path, record) {
  const json = JSON.stringify(
    record,
    (_key, value) => {
      if (ArrayBuffer.isView(value)) return Array.from(value);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const keys = Object.keys(value);
        if (keys.length && keys.every((key, i) => key === String(i)))
          return Object.values(value);
      }
      return value;
    },
    2,
  ).replace(/\[\s*-?[\d.eE+\-]+(?:,\s*-?[\d.eE+\-]+)+\s*\]/g, (array) =>
    array.replace(/\s+/g, ""),
  );
  fs.writeFileSync(path, json + "\n");
}
