// A Label whose `text` names a string key is supposed to become a lookup in the
// generated component. When the generator does not recognise the key it emits the
// key NAME as literal text instead, and the page publishes
// `section_collection_basic_bullet_scrollEnabled` where a sentence belongs.
//
// That happened twice and was found by a live check, not by a gate: `jui build`
// printed zero warnings, `lint-strings` and `validate:strings` were green, and the
// two pages carried a raw key for as long as nobody looked. Both keys contained an
// uppercase letter, which is the only shape measured to trigger it (2 of 2 broken,
// 0 of ~4000 lowercase keys) — but this check does not test for that cause. It tests
// for the defect itself: a string key rendered as its own name. A different cause
// with the same symptom is caught the same way.
//
// Scans the GENERATED components, so it speaks only for what the pinned toolchain
// actually emitted, and refuses an empty scan rather than reporting success for a
// tree it never read.

import fs from "node:fs";
import path from "node:path";

const CWD = process.cwd();
const STRINGS = path.resolve(CWD, "..", "docs/screens/layouts/Resources/strings.json");
const GENERATED = path.resolve(CWD, "src/generated/components");

type Lang2 = { en?: string; ja?: string };

function bareKeys(file: string): Set<string> {
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
  const keys = new Set<string>();
  for (const ns of Object.values(data)) {
    if (!ns || typeof ns !== "object") continue;
    for (const [key, value] of Object.entries(ns as Record<string, unknown>)) {
      const v = value as Lang2;
      if (v && typeof v === "object" && typeof v.en === "string") keys.add(key);
    }
  }
  return keys;
}

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".tsx")) out.push(p);
    }
  };
  walk(dir);
  return out;
}

function main(): number {
  if (!fs.existsSync(GENERATED)) {
    console.error(
      "check-raw-string-keys: no generated components at src/generated/components — " +
        "run `jui build --web-only` first. Refusing to read an empty scan as a pass.",
    );
    return 1;
  }
  const keys = bareKeys(STRINGS);
  const files = tsxFiles(GENERATED);
  if (keys.size === 0 || files.length === 0) {
    console.error(
      `check-raw-string-keys: nothing to compare (${keys.size} key(s), ${files.length} component(s)). ` +
        "Refusing to read an empty comparison as a pass.",
    );
    return 1;
  }

  // The defect's shape: the key sits as a JSX text node, `>key<`, where a
  // `{$s.someAccessor}` expression belongs.
  const findings: string[] = [];
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    for (const match of src.matchAll(/>([A-Za-z0-9_]{4,})</g)) {
      const text = match[1];
      if (!keys.has(text)) continue;
      const line = src.slice(0, match.index).split("\n").length;
      findings.push(`${path.relative(CWD, file)}:${line}: renders the string key '${text}' as literal text`);
    }
  }

  if (findings.length > 0) {
    console.error(
      `check-raw-string-keys: ${findings.length} place(s) publish a string key instead of its text:`,
    );
    for (const f of findings) console.error(`  ${f}`);
    console.error(
      "  The generator did not recognise the key. Both measured cases were keys containing an " +
        "uppercase letter; renaming the key (and its layout reference) to lowercase restored the lookup.",
    );
    return 1;
  }

  console.log(
    `check-raw-string-keys: OK — ${files.length} generated component(s) scanned against ` +
      `${keys.size} string key(s); none is rendered as its own name.`,
  );
  return 0;
}

process.exit(main());
