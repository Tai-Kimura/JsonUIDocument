// The parent/sub-spec page carries a hand-written list of what a sub-spec
// supplies. Since jsonui-cli 1.8.29 that list has a canonical source:
// `shared/core/parent_spec_rules.py`'s MERGER_BUILDS_FROM_SUB_SPECS, which an
// upstream test walks through a real merge — so the set and the merger cannot
// drift apart. The page's prose can still drift from BOTH.
//
// This does not DERIVE the prose from the set: the sentence groups and orders
// sections editorially, and two of the names (`relatedFiles`, `notes`) are read
// from the parent as well, so they belong in a different sentence than the ones
// that must move. It checks COVERAGE instead — every canonical section is named
// somewhere in the page's namespace — which is the shape a hand-written table
// wants: the page keeps its voice, and a section added upstream cannot be
// missing here without the gate saying so.
//
// What it does NOT check, said plainly because a green line is read as more
// than it is: it never checks that the prose is TRUE, never checks the reverse
// direction (names in the prose that are not sections — `viewModel`,
// `rootComponents`, `conditions` are sub-keys and would be false positives),
// and it says nothing about the second list on that page (what the merger keys
// by name), which has no canonical source.

import fs from "node:fs";
import path from "node:path";

const CWD = process.cwd();
const STRINGS = path.resolve(CWD, "..", "docs/screens/layouts/Resources/strings.json");
const NAMESPACE = "spec_parent_sub_spec";

function rulesFile(): string {
  const root = process.env.JSONUI_CLI_PATH;
  if (!root) {
    console.error("check-parent-sub-sections: JSONUI_CLI_PATH is not set — the canonical list lives in the pinned toolchain. Refusing to guess.");
    process.exit(1);
  }
  const p = path.join(root, "shared/core/parent_spec_rules.py");
  if (!fs.existsSync(p)) {
    console.error(`check-parent-sub-sections: ${p} does not exist. The rules module moved, or the toolchain predates it (jsonui-cli 1.8.29). Refusing to pass without reading it.`);
    process.exit(1);
  }
  return p;
}

function canonicalSections(file: string): string[] {
  const src = fs.readFileSync(file, "utf8");
  const block = src.match(/MERGER_BUILDS_FROM_SUB_SPECS\s*=\s*frozenset\(\{([\s\S]*?)\}\)/);
  if (!block) {
    console.error("check-parent-sub-sections: could not find MERGER_BUILDS_FROM_SUB_SPECS in the rules module — refusing to read an unparsed file as an empty list.");
    process.exit(1);
  }
  const names = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  // An empty or implausibly short parse is a broken reader, not a short list.
  if (names.length < 5) {
    console.error(`check-parent-sub-sections: parsed only ${names.length} section name(s) — that is a reader failure, not a small set. Refusing.`);
    process.exit(1);
  }
  return names;
}

function pageProse(): string {
  const data = JSON.parse(fs.readFileSync(STRINGS, "utf8")) as Record<string, Record<string, { en?: string; ja?: string }>>;
  const ns = data[NAMESPACE];
  if (!ns) {
    console.error(`check-parent-sub-sections: namespace ${NAMESPACE} is not in strings.json — refusing.`);
    process.exit(1);
  }
  const parts: string[] = [];
  for (const value of Object.values(ns)) {
    if (value && typeof value === "object") {
      if (typeof value.en === "string") parts.push(value.en);
      if (typeof value.ja === "string") parts.push(value.ja);
    }
  }
  if (parts.length === 0) {
    console.error(`check-parent-sub-sections: ${NAMESPACE} holds no prose — refusing to read an empty comparison as a pass.`);
    process.exit(1);
  }
  return parts.join("\n");
}

const sections = canonicalSections(rulesFile());
const prose = pageProse();
const missing = sections.filter((s) => !prose.includes(s));

if (missing.length > 0) {
  console.error(
    `check-parent-sub-sections: ${missing.length} section(s) the merger builds from sub-specs are named nowhere on /spec/parent-sub-spec:`,
  );
  for (const m of missing) console.error(`  ${m}`);
  console.error("  Upstream added them to MERGER_BUILDS_FROM_SUB_SPECS. A reader looking for where to declare one finds nothing here.");
  process.exit(1);
}

console.log(
  `check-parent-sub-sections: OK — all ${sections.length} section(s) in MERGER_BUILDS_FROM_SUB_SPECS are named on /spec/parent-sub-spec.`,
);
console.log(
  "  Coverage only: it does not check that the prose is right, does not check the reverse direction (sub-keys in the prose are not sections), and says nothing about the merge-keying list, which has no canonical source.",
);
