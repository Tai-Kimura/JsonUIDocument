// Two checks over the CLI reference, both reading the binaries' `--help` at the
// PINNED toolchain ($JSONUI_CLI_PATH — a local install can be any version):
//
//   1. COVERAGE — does the catalogue document exactly the subcommands that
//      exist, in both directions? A card for a command the binary does not
//      accept, or a subcommand with no card, fails the deploy.
//
//   2. READ-STAMPS — has a human read this card against this version's help?
//      This judges "was it read", never "is it right": set agreement says a
//      card exists, and nothing mechanical can say its prose is true.
//
// Why both exist: the page's lead promised "every subcommand, hand-maintained
// against each binary's --help", and nothing enforced it. On 2026-09-02 the
// catalogue carried a card for `jsonui-test run` — which argparse rejects with
// exit 2 — published since the initial commit four months earlier, while 13
// leaf subcommands had no card at all. Coverage closed that class. It cannot
// close the next one: `jsonui-test generate` documented a command line that
// does not run, with a set that agreed perfectly. Hence the stamps.
//
// Run via `npm run check:cli-coverage`. It is a gate in .github/workflows/
// deploy.yml rather than part of `prebuild` because it must measure the pinned
// toolchain, which only that job has.
//
// Scope, printed in the success line so the numbers cannot be read as more than
// they are: only the three argparse binaries are checked. sjui / kjui / rjui
// each print a different hand-rolled help format, and a parser that read a
// partial list from one of them would satisfy a non-empty guard while hiding
// what it missed — a silently-passing check is worse than a declared gap.
// Flags are not compared either; the page records a selection on purpose.

import fs from "node:fs";
import path from "node:path";
import {
  BINARIES,
  HELP_COLUMNS,
  cardHashFor,
  helpHashFor,
  leavesOf,
  Node,
  nodesUnder,
  normalize,
  walk,
} from "./lib/cli-help";

const CWD = process.cwd();
const SOURCE = path.resolve(CWD, "..", "docs/data/cli-commands.json");
const STAMPABILITY = path.resolve(CWD, "..", "docs/data/cli-help-stampability.json");

const NOT_CHECKED = ["sjui", "kjui", "rjui"];

interface Stamp {
  version: string;
  columns: number;
  helpHash: string;
  cardHash: string;
  fieldHashes?: Record<string, string>;
}

interface Card {
  binary: string;
  command: string;
  verifiedAgainst?: Stamp;
  [k: string]: unknown;
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
  if (!fs.existsSync(STAMPABILITY)) {
    console.error(`check-cli-coverage: cannot compare — ${path.basename(STAMPABILITY)} is missing.`);
    console.error("  Produce it with `npm run classify:help-stampability -- <treeA> <treeB>`.");
    process.exit(1);
  }

  const parsed = JSON.parse(fs.readFileSync(SOURCE, "utf8")) as { commands: Card[] };
  const classification = JSON.parse(fs.readFileSync(STAMPABILITY, "utf8")) as {
    measuredAt: string;
    columns: number;
    nodes: Record<string, { stampable: boolean; reason?: string }>;
  };

  const problems: string[] = [];
  const notes: string[] = [];
  const counts: string[] = [];
  let totalLeaves = 0;
  let stampableCards = 0;
  let stamped = 0;
  let matched = 0;
  const unstamped: { id: string; why: string }[] = [];
  let unstampableCards = 0;

  for (const bin of BINARIES) {
    const binPath = path.join(toolchain, bin.rel);
    if (!fs.existsSync(binPath)) {
      problems.push(`${bin.name}: not found at ${bin.rel} under the toolchain — cannot compare`);
      continue;
    }
    const tree: Node = walk(binPath, [], null, 0, { n: 0 });
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

    // 1. coverage, both directions
    for (const { card, path: cardPath } of normalized) {
      if (!leaves.some((leaf) => isPrefix(cardPath, leaf))) {
        problems.push(
          `${bin.name}: the reference has a card for '${bin.name} ${card.command}', which the binary does not accept`,
        );
      }
    }
    for (const leaf of leaves) {
      if (!normalized.some(({ path: cardPath }) => isPrefix(cardPath, leaf))) {
        problems.push(`${bin.name}: '${bin.name} ${leaf.join(" ")}' is a subcommand with no card`);
      }
    }
    totalLeaves += leaves.length;
    counts.push(
      `  ${bin.name.padEnd(12)} ${String(leaves.length).padStart(3)} subcommands / ` +
        `${String(cards.length).padStart(3)} cards`,
    );

    // 2. read-stamps
    for (const { card, path: cardPath } of normalized) {
      const id = `${bin.name} ${card.command}`;
      const covered = [...nodesUnder(tree, cardPath).keys()];
      const unknown = covered.filter((n) => classification.nodes[`${bin.name} ${n}`] === undefined);
      const unstampableNodes = covered.filter(
        (n) => classification.nodes[`${bin.name} ${n}`]?.stampable === false,
      );
      const stampable = unknown.length === 0 && unstampableNodes.length === 0;
      const stamp = card.verifiedAgainst;

      if (!stampable) {
        unstampableCards += 1;
        if (stamp) {
          problems.push(
            `${id}: carries a stamp, but its --help is not reproducible ` +
              `(${unknown.length ? "unclassified nodes: " + unknown.join(", ") : classification.nodes[`${bin.name} ${unstampableNodes[0]}`]?.reason}) ` +
              `— a stamp that cannot be checked must not read as verified`,
          );
        }
        continue;
      }
      stampableCards += 1;
      if (!stamp) {
        unstamped.push({ id, why: "never stamped" });
        continue;
      }
      if (stamp.columns !== Number(HELP_COLUMNS)) {
        // Not red: the whole set would go red together for a reason that is
        // about the reader's terminal, not about the cards.
        unstamped.push({ id, why: `stamped at COLUMNS=${stamp.columns}, this run reads at ${HELP_COLUMNS}` });
        continue;
      }
      const liveHelp = helpHashFor(tree, cardPath);
      const liveCard = cardHashFor(card as Record<string, unknown>);
      if (stamp.helpHash !== liveHelp) {
        problems.push(
          `${id}: the --help this card was read against has changed since ${stamp.version} — ` +
            `read it again and update the stamp`,
        );
        continue;
      }
      if (stamp.cardHash !== liveCard) {
        // Edited after it was read. Not a defect and not red: it returns to the
        // unverified pool, and the fields say how much re-reading it costs.
        const changed = stamp.fieldHashes
          ? Object.keys(stamp.fieldHashes).filter(
              (f) => stamp.fieldHashes?.[f] !== fieldHash(card, f),
            )
          : [];
        unstamped.push({
          id,
          why: `edited since it was read${changed.length ? " (" + changed.join(", ") + ")" : ""}`,
        });
        stamped += 0;
        continue;
      }
      stamped += 1;
      matched += 1;
    }
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
  console.log(
    `check-cli-read-stamps: ${stampableCards} stampable cards: ${stamped} stamped (${matched} match), ` +
      `${unstamped.length} unstamped`,
  );
  for (const u of unstamped.slice(0, 6)) console.log(`  unstamped: ${u.id} — ${u.why}`);
  if (unstamped.length > 6) console.log(`  ... and ${unstamped.length - 6} more`);
  console.log(
    `  ${unstampableCards} cards are not stampable (--help varies with the checkout); set-checked only.\n` +
      `  An unstamped card is NOT verified: nobody has read it against this binary's --help.\n` +
      `  This check never judges whether a card is RIGHT — only whether a human read it.`,
  );
  for (const n of notes) console.log(`  ${n}`);
}

function fieldHash(card: Card, field: string): string {
  const single: Record<string, unknown> = { [field]: card[field] };
  return cardHashFor(single).slice(0, 12);
}

main();
