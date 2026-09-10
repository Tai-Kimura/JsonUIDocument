// `check:cli-coverage` compares the SUBCOMMAND list against `--help` in both
// directions, and says in its own output that "Flags are not compared either —
// the page records a selection of them on purpose." That sentence was accurate
// and the gap behind it was 206 flags wide: every `options[].name` on every
// card for the three argparse binaries was published without anything ever
// asking the binary whether it accepts them.
//
// This gate closes one direction of that gap: a flag the page DOCUMENTS must be
// one the binary DECLARES. The other direction stays open on purpose — a flag
// that exists and is not on the page is an editorial choice, and enforcing it
// would turn every upstream flag addition into a red deploy for a page that is
// deliberately a selection.
//
// How a flag is looked up, and why it is not just the card's own node:
// a card may document a PARENT whose flags live on its children —
// `jsonui-doc rules` is exactly that, with a synopsis of
// `rules init [-o DIR] [--flutter] | rules show [-d DIR]` and per-flag
// descriptions saying "`init` only:". Reading only the parent's help reports
// three false defects. So the help of the node AND everything under it is what
// a card is checked against, which is also how a reader uses the page.
//
// Flags are read from argparse's declaration lines (an indented line whose
// first token starts with `-`), NOT from anywhere in the help text. A flag
// named only inside a description would otherwise satisfy the check without the
// binary accepting it.
//
// ⚠️ What this does NOT check:
//   - sjui / kjui / rjui. They print hand-rolled help that argparse's walker
//     cannot parse, so their cards' flags — 23 of the 229 in the reference —
//     are not reached here, the same exclusion `check:cli-coverage` makes.
//   - that a documented flag still MEANS what the card says, or that its
//     default, type or argument count are right. Only that the binary declares
//     the spelling.
//   - options entries that are not flag-shaped (`names`, `name`): those
//     document positional arguments and are counted and skipped, not compared.
//
// A SECOND surface is checked here, with its own denominator: the `--flag`
// spellings that appear in the site's PROSE, outside the reference cards. An
// article saying "`--allow-partial` does not cover it" goes stale in silence
// when a flag is renamed, and nothing watched those 28 mentions.
//
// It is a second verdict rather than a second gate because the expensive part —
// walking three binaries and rendering every node's help — is identical, and
// running it twice per deploy buys nothing. The two verdicts print separately
// with separate counts, so neither claim is widened by the other; only the
// process is shared. The prose surface uses a WIDER universe than the cards do:
// a card is checked against its own command's help, while prose may name a
// global flag like `--version`, which argparse declares on the ROOT parser only
// — and `nodesUnder()` deletes the root, which is what made a first measurement
// report `--version` as undeclared.

import fs from "node:fs";
import path from "node:path";
import {
  BINARIES,
  HELP_PYTHON_VERSION,
  Node,
  helpPython,
  nodesUnder,
  normalize,
  walk,
} from "./lib/cli-help";

const CWD = process.cwd();
const SOURCE = path.resolve(CWD, "..", "docs/data/cli-commands.json");

type Card = {
  binary?: string;
  command: string;
  options?: { name: string }[];
};

/** Flags argparse DECLARES: an indented line whose first token is an option. */
function declaredFlags(help: string): Set<string> {
  const out = new Set<string>();
  for (const line of help.split("\n")) {
    // argparse lays an option spec at 2-space indent and separates it from the
    // description by 2+ spaces; a metavar can sit between the short and long
    // spellings (`-o OUTPUT, --output OUTPUT`) and the spec can occupy the whole
    // line when it is long. Descriptions are indented far deeper, which keeps a
    // `--flag` mentioned in prose from being read as a declaration.
    const m = /^ {2,6}(-\S.*?)(?:\s{2,}|$)/.exec(line);
    if (!m) continue;
    for (const tok of m[1].match(/-{1,2}[A-Za-z][A-Za-z0-9-]*/g) ?? []) out.add(tok);
  }
  return out;
}

function main(): void {
  const root = process.env.JSONUI_CLI_PATH;
  if (!root) {
    console.error("check-cli-flags: JSONUI_CLI_PATH is not set — refusing to report");
    console.error("  agreement without having asked a binary.");
    process.exit(2);
  }
  const py = helpPython();
  if (!py) {
    console.error(`check-cli-flags: python${HELP_PYTHON_VERSION} not found. Help renders`);
    console.error("  differently across interpreters, so a comparison under another one");
    console.error("  would not be the comparison this gate claims to make.");
    process.exit(2);
  }

  const parsed = JSON.parse(fs.readFileSync(SOURCE, "utf8")) as { commands: Card[] };
  const problems: string[] = [];
  const universe = new Set<string>(); // every flag any binary declares anywhere
  let checked = 0;
  let positional = 0;
  let cards = 0;

  for (const bin of BINARIES) {
    const binPath = path.join(root, bin.rel);
    if (!fs.existsSync(binPath)) {
      console.error(`check-cli-flags: ${bin.name} not found at ${bin.rel} under the toolchain`);
      process.exit(1);
    }
    const tree: Node = walk(binPath, [], null, 0, { n: 0 });
    const all = nodesUnder(tree);
    // The root parser's own help, which nodesUnder() deletes. Global flags
    // (`--version`) live only there, and prose may legitimately name them.
    for (const f of declaredFlags(tree.help)) universe.add(f);
    for (const help of all.values()) for (const f of declaredFlags(help)) universe.add(f);
    // The control the coverage gate uses: a binary whose help did not parse
    // yields an empty tree, and every card under it would then "agree".
    if (!all.has(bin.control)) {
      console.error(
        `check-cli-flags: ${bin.name}: parsed ${all.size} node(s) and the control ` +
          `'${bin.control}' is missing — the help did not parse, so no comparison is possible.`,
      );
      process.exit(1);
    }

    for (const card of parsed.commands.filter((c) => c.binary === bin.name)) {
      const canon = normalize(tree, card.command.split(/\s+/)).join(" ");
      if (!all.has(canon)) {
        problems.push(`${bin.name} ${card.command}: no such command under --help`);
        continue;
      }
      cards += 1;
      // The card's own node plus everything beneath it: a parent card documents
      // its children's flags, and the page presents them together.
      let help = "";
      for (const [k, v] of all) if (k === canon || k.startsWith(canon + " ")) help += v + "\n";
      const declared = declaredFlags(help);

      for (const opt of card.options ?? []) {
        const tokens = opt.name
          .split(",")
          .map((x) => x.trim())
          .filter((x) => /^-{1,2}[A-Za-z]/.test(x));
        if (tokens.length === 0) {
          positional += 1; // documents a positional argument, not a flag
          continue;
        }
        checked += 1;
        if (!tokens.some((t) => declared.has(t))) {
          problems.push(
            `${bin.name} ${card.command}: documents ${opt.name} — not declared by --help`,
          );
        }
      }
    }
  }

  if (checked === 0) {
    console.error("check-cli-flags: compared 0 flags — refusing to read that as agreement.");
    process.exit(1);
  }

  // ---- second surface: --flags named in the site's prose ----
  const STRINGS = path.resolve(CWD, "..", "docs/screens/layouts/Resources/strings.json");
  const strings = JSON.parse(fs.readFileSync(STRINGS, "utf8")) as Record<
    string,
    Record<string, { en?: string; ja?: string }>
  >;
  const prose = new Map<string, string[]>();
  for (const [ns, body] of Object.entries(strings)) {
    if (!body || typeof body !== "object") continue;
    for (const [key, value] of Object.entries(body)) {
      if (!value || typeof value !== "object") continue;
      for (const lang of ["en", "ja"] as const) {
        for (const m of (value[lang] ?? "").matchAll(/`(--[A-Za-z][A-Za-z0-9-]*)`/g)) {
          const at = prose.get(m[1]) ?? [];
          at.push(`${ns}.${key}`);
          prose.set(m[1], at);
        }
      }
    }
  }
  if (prose.size === 0) {
    console.error("check-cli-flags: found 0 --flags in prose — the reader is broken, not the");
    console.error("  site. Refusing to read that as agreement.");
    process.exit(1);
  }
  const proseBad = [...prose].filter(([f]) => !universe.has(f));
  if (proseBad.length > 0) {
    console.error(
      `check-cli-flags(prose): ${proseBad.length} flag(s) named in prose that no binary declares:`,
    );
    for (const [f, at] of proseBad) {
      console.error(`    ${f}  (${at.length} mention(s), e.g. ${at[0]})`);
    }
    console.error("  A renamed or removed flag leaves the sentence around it wrong. Read the");
    console.error("  command's --help, then fix the sentence — not only the spelling.");
    process.exit(1);
  }

  if (problems.length > 0) {
    console.error(`check-cli-flags: ${problems.length} problem(s) across ${checked} flag(s):`);
    for (const p of problems) console.error(`    ${p}`);
    console.error("  Either the binary dropped the flag and the card must follow, or the card");
    console.error("  invented it. Read the command's --help before editing the page.");
    process.exit(1);
  }

  console.log(
    `check-cli-flags: OK — ${checked} documented flag(s) across ${cards} card(s) are declared`,
  );
  console.log(`  by their binary's --help (read under python${HELP_PYTHON_VERSION}).`);
  console.log(
    `  ${positional} options entr(ies) document positional arguments and were skipped.`,
  );
  console.log("  One direction only: a flag that exists and is NOT on the page is allowed —");
  console.log("  the reference records a selection on purpose. sjui/kjui/rjui are not read.");
  console.log(
    `check-cli-flags(prose): OK — ${prose.size} distinct --flag(s) named in site prose are` +
      ` declared somewhere by a binary (universe: ${universe.size} flags).`,
  );
}

main();
