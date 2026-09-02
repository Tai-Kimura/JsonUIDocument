// Checks that the CLI reference documents exactly the subcommands the binaries
// have — in both directions.
//
//   reference: ../docs/data/cli-commands.json  (hand-authored SSoT, en + ja)
//   binaries:  $JSONUI_CLI_PATH                (the toolchain the deploy pins)
//
// The reference's own lead promises "every subcommand ... hand-maintained
// against each binary's --help". Nothing enforced that, and on 2026-09-02 the
// page carried a card for `jsonui-test run` — which argparse rejects with
// exit 2 — since the initial commit four months earlier, while `report`,
// `artifacts pull`, `artifacts status`, `pregrant` and 13 leaf subcommands of
// jui / jsonui-doc had no card at all. A promise is not a gate.
//
// Run via `npm run check:cli-coverage`. It is a gate in .github/workflows/
// deploy.yml rather than part of `prebuild`, because it must measure the
// PINNED toolchain: JSONUI_CLI_PATH is the checkout the gates job made at
// JSONUI_CLI_REF, whereas a local `~/.jsonui-cli` install can be any version.
//
// Scope, stated because the success line must not be read as more than it is:
// only the three argparse binaries are checked. sjui / kjui / rjui each print
// a different hand-rolled help format, and a parser that read a partial list
// from one of them would satisfy a non-empty guard while hiding the entries it
// missed — a silently-passing check is worse than a declared gap.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CWD = process.cwd();
const SOURCE = path.resolve(CWD, "..", "docs/data/cli-commands.json");

interface Binary { name: string; rel: string; control: string }

// `control` is a subcommand the binary certainly has. If the parse comes back
// without it, the help format moved and the empty or short list must not be
// read as "the binary has no subcommands" — the same trap as a grep that finds
// nothing because it was pointed at the wrong file.
const BINARIES: Binary[] = [
  { name: "jui", rel: "jui_tools/bin/jui", control: "build" },
  { name: "jsonui-test", rel: "test_tools/jsonui-test", control: "validate" },
  { name: "jsonui-doc", rel: "document_tools/jsonui-doc", control: "validate" },
];

const NOT_CHECKED = ["sjui", "kjui", "rjui"];

const MAX_DEPTH = 3;      // `jui conformance baseline update` is the deepest today
const MAX_NODES = 400;    // a help that echoes its parent would otherwise not terminate

interface Node { leaf: boolean; kids: Map<string, Node>; alias: Map<string, string> }

const CHOICES = /^\s+\{([^}]*)\}(?:\s|$)/;
const ENTRY = /^ {4}(\S+)\s+\(([^)]*)\)/;

function parseHelp(text: string): { choices: string[]; aliases: Map<string, string[]> } {
  let choices: string[] | null = null;
  const aliases = new Map<string, string[]>();
  let inPositional = false;
  for (const line of text.split("\n")) {
    if (line.startsWith("positional arguments:")) { inPositional = true; continue; }
    if (line.startsWith("options:") || line.startsWith("optional arguments:")) inPositional = false;
    if (!inPositional) continue;
    const c = CHOICES.exec(line);
    if (c && choices === null) choices = c[1].split(",").filter((t) => t !== "");
    const e = ENTRY.exec(line);
    if (e) aliases.set(e[1], e[2].split(",").map((a) => a.trim()));
  }
  return { choices: choices ?? [], aliases };
}

let nodesVisited = 0;

function walk(binPath: string, argv: string[], parentChoices: string[] | null, depth: number): Node {
  nodesVisited += 1;
  const leaf: Node = { leaf: true, kids: new Map(), alias: new Map() };
  if (nodesVisited > MAX_NODES) return leaf;
  let out = "";
  try {
    out = execFileSync("python3", [binPath, ...argv, "--help"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
  const { choices, aliases } = parseHelp(out);
  const aliasTokens = new Set<string>();
  for (const list of aliases.values()) for (const a of list) aliasTokens.add(a);
  const canonical = choices.filter((c) => !aliasTokens.has(c));
  // A subcommand whose --help repeats its parent's choices did not descend.
  const repeatsParent = parentChoices !== null
    && choices.length === parentChoices.length
    && choices.every((c) => parentChoices.includes(c));
  if (canonical.length === 0 || depth >= MAX_DEPTH || repeatsParent) return leaf;
  const node: Node = { leaf: false, kids: new Map(), alias: new Map() };
  for (const c of canonical) node.kids.set(c, walk(binPath, [...argv, c], choices, depth + 1));
  for (const [canon, list] of aliases) {
    if (!node.kids.has(canon)) continue;
    for (const a of list) node.alias.set(a, canon);
  }
  return node;
}

function leavesOf(node: Node, prefix: string[] = []): string[][] {
  if (node.leaf) return prefix.length > 0 ? [prefix] : [];
  const out: string[][] = [];
  for (const [name, kid] of node.kids) out.push(...leavesOf(kid, [...prefix, name]));
  return out;
}

// Cards spell some paths with the binary's own aliases (`jui g project` is
// `generate project`). Resolve each token against the tree it is read from.
function normalize(root: Node, tokens: string[]): string[] {
  const out: string[] = [];
  let cur = root;
  for (const token of tokens) {
    if (cur.leaf) { out.push(token); continue; }
    const canon = cur.alias.get(token) ?? token;
    out.push(canon);
    cur = cur.kids.get(canon) ?? { leaf: true, kids: new Map(), alias: new Map() };
  }
  return out;
}

const isPrefix = (card: string[], leaf: string[]) =>
  card.length <= leaf.length && card.every((t, i) => leaf[i] === t);

function main(): void {
  const toolchain = process.env.JSONUI_CLI_PATH;
  if (!toolchain || !fs.existsSync(toolchain)) {
    console.error("check-cli-coverage: cannot compare — JSONUI_CLI_PATH is unset or missing.");
    console.error("  Point it at a jsonui-cli checkout (the gates job sets it to the pinned SHA).");
    console.error("  Refusing to pass: a check that could not look must not read as a check that agreed.");
    process.exit(1);
  }

  const parsed = JSON.parse(fs.readFileSync(SOURCE, "utf8")) as {
    commands: { binary: string; command: string }[];
  };

  const problems: string[] = [];
  const counts: string[] = [];
  let totalLeaves = 0;

  for (const bin of BINARIES) {
    const binPath = path.join(toolchain, bin.rel);
    if (!fs.existsSync(binPath)) {
      problems.push(`${bin.name}: not found at ${bin.rel} under the toolchain — cannot compare`);
      continue;
    }
    const tree = walk(binPath, [], null, 0);
    const leaves = leavesOf(tree);
    if (leaves.length === 0 || !tree.kids.has(bin.control)) {
      problems.push(
        `${bin.name}: parsed ${leaves.length} subcommand(s) and the control '${bin.control}' is ` +
        `${tree.kids.has(bin.control) ? "present" : "absent"} — the help format moved, so this is ` +
        `"could not parse", not "no subcommands"`,
      );
      continue;
    }
    const cards = parsed.commands.filter((c) => c.binary === bin.name);
    const normalized = cards.map((c) => ({ card: c, path: normalize(tree, c.command.split(/\s+/)) }));

    for (const { card, path: cardPath } of normalized) {
      if (!leaves.some((leaf) => isPrefix(cardPath, leaf))) {
        problems.push(`${bin.name}: the reference has a card for '${bin.name} ${card.command}', which the binary does not accept`);
      }
    }
    for (const leaf of leaves) {
      if (!normalized.some(({ path: cardPath }) => isPrefix(cardPath, leaf))) {
        problems.push(`${bin.name}: '${bin.name} ${leaf.join(" ")}' is a subcommand with no card`);
      }
    }
    totalLeaves += leaves.length;
    counts.push(`  ${bin.name.padEnd(12)} ${String(leaves.length).padStart(3)} subcommands / ${String(cards.length).padStart(3)} cards`);
  }

  for (const line of counts) console.log(line);

  if (problems.length > 0) {
    console.error("check-cli-coverage: FAILED");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(
    `check-cli-coverage: OK — ${BINARIES.length} binaries / ${totalLeaves} subcommands agree with the reference.\n` +
    `  NOT checked: ${NOT_CHECKED.join(", ")} (each prints its own hand-rolled help format; a partial parse\n` +
    `  would pass a non-empty guard while hiding what it missed). Flags are not compared either — the page\n` +
    `  records a selection of them on purpose.`,
  );
}

main();
