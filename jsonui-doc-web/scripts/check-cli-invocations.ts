// Every command a reader can COPY out of this site must be one the binary
// accepts. Two guides told readers to run `jui doc validate spec --file …` for
// as long as they had existed; `jui` has no `doc` subcommand and exits 2 with
// `invalid choice: 'doc'`. The cards in the CLI reference were compared against
// `--help` in both directions, and their flags too — but a command typed inside
// a GUIDE's code block was compared against nothing.
//
// ⚠️ The surface is code blocks, NOT prose, and that is a deliberate limit
// rather than an oversight. The site names commands in prose in order to DENY
// them — "there is no `jui test` command", "There is no standalone `jui
// localize` command" — and those are among its most careful sentences. A check
// demanding that every command named anywhere must exist would redden the
// deploy on exactly them. A command inside a code block is a promise that it
// runs; a command in prose is a subject under discussion.
//
// How a candidate is resolved, which is the whole of the logic:
//   walk the tokens after the binary name. While the current node HAS
//   subcommands, the next token must be one of them (aliases resolved). Once
//   the node is a leaf, whatever remains is positional arguments and the walk
//   stops. A token starting with `-` ends it too.
// That distinction is what separates the real defect from the false ones:
// `jui doc …` fails because the root has subcommands and `doc` is not among
// them, while `jsonui-doc check db` passes because `check` is a leaf and `db`
// is its positional filter, and `jsonui-doc validate spec docs` passes for the
// same reason.
//
// ⚠️ What this does NOT check:
//   - sjui / kjui / rjui invocations, whose help argparse cannot walk. They are
//     counted and skipped, not silently ignored.
//   - that the FLAGS in an invocation exist (check:cli-flags covers the flags
//     the reference documents, not the ones a code block happens to type), that
//     the positional arguments are valid, or that the command would succeed on
//     the reader's project. Only that the command path itself is real.

import fs from "node:fs";
import path from "node:path";
import { BINARIES, HELP_PYTHON_VERSION, Node, helpPython, walk } from "./lib/cli-help";

const CWD = process.cwd();
const ROOT = path.resolve(CWD, "..");
const LAYOUTS = path.join(ROOT, "docs/screens/layouts");
const CARDS = path.join(ROOT, "docs/data/cli-commands.json");

const BIN_NAMES = new Set(BINARIES.map((b) => b.name));
const UNWALKABLE = new Set(["sjui", "kjui", "rjui"]);

// A binary name must end at a word boundary that is not a hyphen: the string
// `jsonui-doc-web/` is a DIRECTORY in a tree listing, and a prefix match reads
// it as a `jsonui-doc` invocation with a subcommand of `-web/`.
const BIN_RE = "(?:jui|jsonui-doc|jsonui-test|sjui|kjui|rjui)(?![-\\w])";
/** With a `$ ` prompt: an invocation in any block, including a transcript. */
const PROMPTED = new RegExp(`^\\s*\\$\\s*(${BIN_RE}(?:\\s+[^\\s]+)*)`);
/** Without one: only inside a shell block, where every line is a command. */
const BARE = new RegExp(`^\\s*(${BIN_RE}(?:\\s+[^\\s]+)*)`);
const SHELL_LANGS = new Set(["bash", "sh", "shell", "zsh", "console"]);

type Found = { cmd: string; where: string };

function codeBlocksIn(obj: unknown, file: string, out: Found[]): void {
  if (Array.isArray(obj)) {
    for (const v of obj) codeBlocksIn(v, file, out);
    return;
  }
  if (!obj || typeof obj !== "object") return;
  const o = obj as Record<string, unknown>;
  if (o.type === "CodeBlock" && typeof o.code === "string") {
    const shell = SHELL_LANGS.has(String(o.language ?? "").toLowerCase());
    for (const line of o.code.split("\n")) {
      if (/^\s*#/.test(line)) continue; // a comment, not an invocation
      // A `$` prompt marks a command anywhere. Without one, only a shell block
      // is a command; a `text` block holds tables, trees and transcripts, and a
      // table row beginning `jsonui-test CLI  | …` is not something to run.
      const m = PROMPTED.exec(line) ?? (shell ? BARE.exec(line) : null);
      if (m) out.push({ cmd: m[1].trim(), where: file });
    }
  }
  for (const v of Object.values(o)) codeBlocksIn(v, file, out);
}

/** null = resolves; a string = why it does not. */
function resolve(tree: Node, rest: string[]): string | null {
  let node = tree;
  for (const raw of rest) {
    if (raw.startsWith("-")) return null; // flags begin; the path is settled
    if (node.leaf) return null; // positional arguments from here on
    const canon = node.alias.get(raw) ?? raw;
    const kid = node.kids.get(canon);
    if (!kid) {
      const choices = [...node.kids.keys()].join(", ");
      return `no such subcommand '${raw}' (choices: ${choices})`;
    }
    node = kid;
  }
  return null;
}

function main(): void {
  const root = process.env.JSONUI_CLI_PATH;
  if (!root) {
    console.error("check-cli-invocations: JSONUI_CLI_PATH is not set — refusing to report");
    console.error("  agreement without having asked a binary.");
    process.exit(2);
  }
  if (!helpPython()) {
    console.error(`check-cli-invocations: python${HELP_PYTHON_VERSION} not found.`);
    process.exit(2);
  }

  const trees = new Map<string, Node>();
  for (const bin of BINARIES) {
    const p = path.join(root, bin.rel);
    if (!fs.existsSync(p)) {
      console.error(`check-cli-invocations: ${bin.name} not found at ${bin.rel}`);
      process.exit(1);
    }
    const tree = walk(p, [], null, 0, { n: 0 });
    if (tree.leaf || tree.kids.size === 0) {
      console.error(`check-cli-invocations: ${bin.name} parsed no subcommands — its help did`);
      console.error("  not parse, and every invocation would 'agree' against an empty tree.");
      process.exit(1);
    }
    trees.set(bin.name, tree);
  }

  const found: Found[] = [];
  const walkDir = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walkDir(p);
      else if (e.name.endsWith(".json") && e.name !== "strings.json") {
        try {
          codeBlocksIn(JSON.parse(fs.readFileSync(p, "utf8")), path.relative(ROOT, p), found);
        } catch {
          // a layout that does not parse is the tsc/validate gates' business
        }
      }
    }
  };
  walkDir(LAYOUTS);
  const cards = JSON.parse(fs.readFileSync(CARDS, "utf8")) as {
    commands: { examples?: { code?: string }[] }[];
  };
  for (const c of cards.commands) {
    for (const ex of c.examples ?? []) {
      codeBlocksIn({ type: "CodeBlock", code: ex.code ?? "" }, "docs/data/cli-commands.json", found);
    }
  }

  if (found.length === 0) {
    console.error("check-cli-invocations: found no invocations at all — the reader is broken,");
    console.error("  not the site. Refusing to read that as agreement.");
    process.exit(1);
  }

  const problems: string[] = [];
  let checked = 0;
  let skipped = 0;
  const distinct = new Set<string>();
  for (const f of found) {
    const [bin, ...rest] = f.cmd.split(/\s+/);
    if (UNWALKABLE.has(bin)) {
      skipped += 1;
      continue;
    }
    if (!BIN_NAMES.has(bin)) continue;
    checked += 1;
    distinct.add(f.cmd);
    const tree = trees.get(bin)!;
    const why = resolve(tree, rest);
    if (why) problems.push(`${f.where}:  ${f.cmd}\n        ${why}`);
  }

  if (checked === 0) {
    console.error("check-cli-invocations: 0 invocations resolved to a walkable binary —");
    console.error("  refusing to read that as agreement.");
    process.exit(1);
  }

  if (problems.length > 0) {
    console.error(
      `check-cli-invocations: ${problems.length} invocation(s) the binary would reject:`,
    );
    for (const p of problems) console.error(`    ${p}`);
    console.error("  A reader copies these. Run the command before publishing it.");
    process.exit(1);
  }

  console.log(
    `check-cli-invocations: OK — ${checked} invocation(s) in code blocks ` +
      `(${distinct.size} distinct) name a command their binary accepts.`,
  );
  console.log(`  ${skipped} sjui/kjui/rjui invocation(s) skipped: their help is not walkable.`);
  console.log("  Code blocks only — prose may name a command in order to deny it, and does.");
}

main();
