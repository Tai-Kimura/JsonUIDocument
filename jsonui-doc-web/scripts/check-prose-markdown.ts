// Prose Labels print markdown LITERALLY. A `**bold**` in strings.json reaches the
// reader as two asterisks, a word, two asterisks; a `[text](url)` reaches them as
// brackets and parentheses. Only a bare https URL is linkified by the renderer.
//
// This was guarded by a remembered number: "the literal `**` count is exactly 8,
// and markdown links are 0", re-grepped by hand before each commit. Both halves
// of that habit were wrong in a way worth writing down.
//
//   - The 8 are all legitimate: `Layouts/**/*.json`, `docs/**/.check-report.json`,
//     and a sentence saying globs have no `**`. Every one sits INSIDE BACKTICKS,
//     where the renderer shows it verbatim because that is the point. So the rule
//     was never "there are 8"; it was "a `**` is glob syntax in code voice".
//   - A count cannot see a swap. Delete one glob mention, add one `**bold**`, and
//     the total is still 8. The check passes on the exact edit it exists to catch.
//
// Anchoring a threshold to a MEASURED value also creates pressure to move it: the
// next legitimate glob mention reds the check, and the cheapest fix is to bump the
// number, which is how a guard becomes a formality. Anchored to the declaration —
// code voice is allowed, prose voice is not — a new glob mention passes untouched
// and a bold marker fails, with no number to maintain.

import fs from "node:fs";
import path from "node:path";

const STRINGS = path.resolve(process.cwd(), "..", "docs/screens/layouts/Resources/strings.json");

/** Everything between backticks is code voice: shown verbatim, on purpose. */
function withoutCodeSpans(s: string): string {
  return s.replace(/`[^`]*`/g, (m) => " ".repeat(m.length));
}

type Hit = { where: string; kind: string; sample: string };

function main(): void {
  const raw = JSON.parse(fs.readFileSync(STRINGS, "utf8")) as unknown;
  const hits: Hit[] = [];
  let scanned = 0;
  let inCode = 0;

  const visit = (o: unknown, where: string): void => {
    if (typeof o === "string") {
      scanned += 1;
      inCode += (o.match(/`[^`]*\*\*[^`]*`/g) ?? []).length;
      const prose = withoutCodeSpans(o);
      for (const m of prose.matchAll(/\*\*/g)) {
        hits.push({ where, kind: "bold marker in prose voice", sample: context(o, m.index ?? 0) });
      }
      for (const m of prose.matchAll(/\[[^\]\n]+\]\([^)\n]+\)/g)) {
        hits.push({ where, kind: "markdown link", sample: m[0].slice(0, 60) });
      }
      return;
    }
    if (Array.isArray(o)) {
      o.forEach((v, i) => visit(v, `${where}[${i}]`));
      return;
    }
    if (o && typeof o === "object") {
      for (const [k, v] of Object.entries(o)) visit(v, where ? `${where}.${k}` : k);
    }
  };
  const context = (s: string, at: number): string =>
    s.slice(Math.max(0, at - 30), Math.min(s.length, at + 30)).replace(/\n/g, " ");

  visit(raw, "");

  if (scanned === 0) {
    console.error("check-prose-markdown: scanned 0 strings — the reader is broken, not the");
    console.error("  site. Refusing to read an empty scan as agreement.");
    process.exit(1);
  }

  if (hits.length > 0) {
    console.error(`check-prose-markdown: ${hits.length} markdown construct(s) in prose voice,`);
    console.error("  which the Label renderer prints literally:");
    for (const h of hits) console.error(`    ${h.where}\n      ${h.kind}: …${h.sample}…`);
    console.error("  Drop the markers, or move the text into backticks if it is code voice.");
    process.exit(1);
  }

  console.log(
    `check-prose-markdown: OK — ${scanned} string(s) carry no bold markers and no markdown`,
  );
  console.log(`  links in prose voice. ${inCode} \`**\` occurrence(s) sit inside backticks, where`);
  console.log("  the renderer shows them verbatim because they are glob syntax.");
  console.log("  Anchored to the distinction, not to a count: a count passes a swap.");
}

main();
