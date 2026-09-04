// The vendored `jsonui-doc-web/rjui_tools` must BE what the pinned toolchain
// ships. The gate that claimed this compared `git status` after a sync, which
// answers a narrower question: did the sync CHANGE anything the repository is
// tracking. Measured 2026-09-04: `jui sync_tool` copies source → target and never
// deletes, so a file the pin no longer ships stays in the vendored tree, the sync
// does not touch it, git sees no change, and the gate stays green over a tree that
// does not match the pin. Upstream deleting `rjui_tools/spec/examples.txt` is
// exactly that case, and the question came from upstream, who had not measured it.
//
// This compares the two trees directly, both directions:
//   in the pin but not vendored   → the sync did not run, or something removed it
//   vendored but not in the pin   → a leftover the pin no longer ships   ← the hole
//   present in both but different → the sync did not take
//
// Excluded, deliberately:
//   extensions/  — this face's own converters, which sync_tool preserves by design
//   the tool's own skip list (__pycache__, .git, .rspec_status, .DS_Store,
//   *.pyc/.pyo/.gem/.log/.tmp), because sync never copies those and their presence
//   or absence says nothing about the pin.
//
// It does NOT check the OTHER vendored trees (sjui_tools / kjui_tools are not
// vendored on this web-only face), nor that the pinned checkout is itself the
// tagged content — the pin is a SHA and the fetch step is what guarantees that.

import fs from "node:fs";
import path from "node:path";

const CWD = process.cwd();

// Every vendored tool tree, discovered rather than named. This face declares only
// the web platform today, so `rjui_tools` is the only one — but naming it in the
// script would mean that adding an ios or android platform to jui.config.json
// vendors a tree this gate silently does not look at. A gate that covers "the tool
// I happened to write down" is the shape this lane keeps finding elsewhere.
function vendoredTools(): string[] {
  return fs
    .readdirSync(CWD, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /_tools$/.test(e.name))
    .map((e) => e.name)
    .sort();
}

const SKIP_DIRS = new Set([".git", "__pycache__", ".rspec_status", "node_modules", ".pytest_cache"]);
const SKIP_FILES = new Set([".DS_Store"]);
const SKIP_SUFFIXES = [".pyc", ".pyo", ".gem", ".log", ".tmp"];

function pinnedRoot(): string {
  const root = process.env.JSONUI_CLI_PATH;
  if (!root) {
    console.error("check-vendored-tree: JSONUI_CLI_PATH is not set — there is nothing to compare the vendored tree against. Refusing.");
    process.exit(1);
  }
  return root;
}

function relFiles(root: string): Set<string> {
  const out = new Set<string>();
  const walk = (dir: string, rel: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        if (rel === "" && e.name === "extensions") continue; // not expected at root, but harmless
        walk(path.join(dir, e.name), rel ? `${rel}/${e.name}` : e.name);
      } else {
        if (SKIP_FILES.has(e.name)) continue;
        if (SKIP_SUFFIXES.some((s) => e.name.endsWith(s))) continue;
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (r.split("/").includes("extensions")) continue; // face-specific, preserved by sync
        out.add(r);
      }
    }
  };
  walk(root, "");
  return out;
}

// `shared/core/<payload>` in the vendored tree does not come from the tool dir at
// all: sync_tool copies a named list out of the SOURCE ROOT's shared/core into
// <tool>/shared/core. Comparing the tool dirs alone reports those as leftovers,
// which is a reader bug, not a finding — the first run of this check said exactly
// that about font_weight_mapping.json. The list is short and named upstream
// (SHARED_CORE_PAYLOADS); read it from the source rather than restating it, so a
// payload added there does not silently become a false positive here.
function sharedCorePayloads(root: string): Map<string, string> {
  const out = new Map<string, string>(); // vendored-relative path -> absolute source path
  const cmd = path.join(root, "jui_tools/jui_cli/commands/sync_tool_cmd.py");
  if (!fs.existsSync(cmd)) return out;
  const block = fs.readFileSync(cmd, "utf8").match(/SHARED_CORE_PAYLOADS\s*=\s*\(([\s\S]*?)\)/);
  if (!block) return out;
  for (const m of block[1].matchAll(/"([^"]+)"/g)) {
    const abs = path.join(root, "shared/core", m[1]);
    if (fs.existsSync(abs)) out.set(`shared/core/${m[1]}`, abs);
  }
  return out;
}

const root = pinnedRoot();
const payloads = sharedCorePayloads(root);
const tools = vendoredTools();
if (tools.length === 0) {
  console.error("check-vendored-tree: no *_tools directory is vendored here — refusing to read an empty scan as a match.");
  process.exit(1);
}

const show = (tool: string, label: string, list: string[], hint: string) => {
  if (list.length === 0) return;
  console.error(`  ${tool}: ${list.length} ${label}:`);
  for (const f of list.slice(0, 20)) console.error(`    ${f}`);
  if (list.length > 20) console.error(`    … and ${list.length - 20} more`);
  console.error(`    ${hint}`);
};

let failed = false;
let total = 0;
for (const tool of tools) {
  const src = path.join(root, tool);
  if (!fs.existsSync(src)) {
    console.error(`check-vendored-tree: ${tool} is vendored here but the pin has no ${tool}/ — refusing to compare against a source that is not there.`);
    failed = true;
    continue;
  }
  const a = relFiles(src);
  for (const rel of payloads.keys()) a.add(rel);
  const b = relFiles(path.resolve(CWD, tool));
  if (a.size === 0 || b.size === 0) {
    console.error(`check-vendored-tree: ${tool}: ${a.size} file(s) in the pin and ${b.size} vendored — refusing to read an empty comparison as a match.`);
    failed = true;
    continue;
  }
  total += a.size;

  const missing = [...a].filter((f) => !b.has(f)).sort();
  const extra = [...b].filter((f) => !a.has(f)).sort();
  const differ: string[] = [];
  for (const f of [...a].filter((x) => b.has(x)).sort()) {
    const from = payloads.get(f) ?? path.join(src, f);
    if (!fs.existsSync(from)) continue;
    if (!fs.readFileSync(from).equals(fs.readFileSync(path.join(CWD, tool, f)))) differ.push(f);
  }
  if (missing.length || extra.length || differ.length) {
    if (!failed) console.error("check-vendored-tree: a vendored tree is not what the pinned toolchain ships.");
    show(tool, "in the pin but not vendored", missing, "run `JSONUI_CLI_PATH=<pinned checkout> jui sync_tool` and commit the result");
    show(tool, "vendored but not in the pin", extra, "the pin no longer ships these; sync_tool never deletes, so remove them by hand and commit");
    show(tool, "present in both but different", differ, "run sync_tool and commit the result");
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(
  `check-vendored-tree: OK — ${tools.join(", ")} (${total} file(s)), byte for byte, minus extensions/ and the tool's own skip list.`,
);
