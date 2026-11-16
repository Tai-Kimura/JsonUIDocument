// A `partialAttributes[].range` given as a string is matched against the resolved
// text at runtime. When the pattern is not in that text the partial is SKIPPED —
// not an error, no warning, nothing in the build log. The link or emphasis simply
// is not there.
//
// This site is bilingual and the match happens per locale, so the failure mode that
// matters is asymmetric: a phrase reworded in one language only leaves the link
// working in the other. Nothing else here would catch it. `jui build` is silent by
// design, and the live coverage probe checks that the STRING is on the page — which
// it still is, with the link missing from inside it.
//
// What this does NOT check, said plainly: that the link points anywhere sensible,
// that `onclick` is wired, that array ranges are in bounds, or anything about
// bindings (`@{...}`) and keys, whose text is not known until runtime.

import fs from "node:fs";
import path from "node:path";

const CWD = process.cwd();
const ROOT = path.resolve(CWD, "..");
const LAYOUTS = path.join(ROOT, "docs/screens/layouts");
const STRINGS = path.join(LAYOUTS, "Resources/strings.json");

type Lang2 = { en?: string; ja?: string };

function namespaceFor(file: string): string {
  return path
    .relative(LAYOUTS, file)
    .replace(/\.json$/, "")
    .replace(/\//g, "_")
    .replace(/-/g, "_");
}

function layoutFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (["Resources", "cells", "styles"].includes(e.name)) continue;
        walk(p);
      } else if (e.name.endsWith(".json")) out.push(p);
    }
  };
  walk(dir);
  return out;
}

const strings = JSON.parse(fs.readFileSync(STRINGS, "utf8")) as Record<string, Record<string, Lang2>>;
const files = layoutFiles(LAYOUTS);
if (files.length === 0) {
  console.error("check-partial-ranges: no layouts found — refusing to read an empty scan as a pass.");
  process.exit(1);
}

const findings: string[] = [];
let checked = 0;

for (const file of files) {
  let layout: unknown;
  try {
    layout = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    continue; // malformed layouts are the build's business, not this check's
  }
  const ns = strings[namespaceFor(file)];
  if (!ns) continue;
  const rel = path.relative(ROOT, file);

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const v of node) walk(v);
      return;
    }
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    const partials = obj.partialAttributes;
    const textKey = obj.text;
    if (Array.isArray(partials) && typeof textKey === "string") {
      const entry = ns[textKey];
      for (const pa of partials) {
        if (!pa || typeof pa !== "object") continue;
        const range = (pa as Record<string, unknown>).range;
        // Only literal patterns are checkable here: an array range is positional,
        // and a binding or a strings key resolves to text this script cannot know.
        if (typeof range !== "string") continue;
        if (range.startsWith("@{") || ns[range]) continue;
        checked++;
        if (!entry || typeof entry !== "object") {
          findings.push(`${rel}: text key '${textKey}' is not in that page's namespace`);
          continue;
        }
        for (const lang of ["en", "ja"] as const) {
          const body = entry[lang];
          if (typeof body === "string" && !body.includes(range)) {
            findings.push(`${rel}: range ${JSON.stringify(range)} does not occur in ${textKey}[${lang}] — the partial is skipped in silence`);
          }
        }
      }
    }
    for (const v of Object.values(obj)) walk(v);
  };
  walk(layout);
}

if (checked === 0) {
  console.error(
    `check-partial-ranges: scanned ${files.length} layout(s) and found no literal ranges to check. ` +
      "That is either a site that stopped using them or a broken reader — refusing either way.",
  );
  process.exit(1);
}

if (findings.length > 0) {
  console.error(`check-partial-ranges: ${findings.length} partial range(s) match nothing in their text:`);
  for (const f of findings) console.error(`  ${f}`);
  console.error("  A range absent from the text removes the link or emphasis without any error.");
  process.exit(1);
}

console.log(
  `check-partial-ranges: OK — ${checked} literal range(s) across ${files.length} layout(s) occur in their text, in both languages.`,
);
console.log(
  "  Presence only: it says nothing about where a link points, whether onclick is wired, array ranges, or ranges given as bindings or strings keys.",
);
