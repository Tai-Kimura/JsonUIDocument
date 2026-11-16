// Decides, BY EXPERIMENT, which subcommand --help outputs are reproducible
// enough to hash — and records the answer so the deploy gate reads a
// measurement instead of re-deriving one.
//
//   output: ../docs/data/cli-help-stampability.json  (tracked)
//
// Why an experiment and not a rule: the first attempt inferred it, by looking
// for the toolchain path inside the help text. That is a proxy for
// "is this output position-dependent", and it would miss a help that embeds
// anything else machine-specific. So this varies the environment and compares
// the bytes:
//
//   checkout  — the same version unpacked at a second path
//   cwd       — run from a different working directory
//   HOME      — run with a different home
//
// A node is stampable only when every arm is byte-identical to the base, with
// COLUMNS pinned. Measured at v1.8.0 and again at v1.8.4: the `jui conformance`
// family is not stampable — it prints the checkout path as the default of
// --dir — and cwd and HOME moved nothing. Those two arms cost one run each and
// their silence is what makes the classification complete rather than lucky;
// do not drop them because they have never fired.
//
// Two fixes that did NOT work, so nobody tries them again: masking the path out
// of the text (argparse wraps long defaults, so the string is not there to
// match), and running the binaries through a fixed symlinked path (the code
// resolves the real path, so the hash is unchanged).
//
// Run: npm run classify:help-stampability -- <toolchainA> <toolchainB>
// where both are checkouts of the SAME version at different paths.

import fs from "node:fs";
import path from "node:path";
import {
  BINARIES,
  HELP_COLUMNS,
  HELP_PYTHON_VERSION,
  Node,
  helpPython,
  nodesUnder,
  walk,
} from "./lib/cli-help";

const CWD = process.cwd();
const OUT = path.resolve(CWD, "..", "docs/data/cli-help-stampability.json");

interface Classification {
  measuredAt: string;
  columns: number;
  python: string;
  axes: string[];
  note: string;
  nodes: Record<string, { stampable: boolean; reason?: string }>;
}

function version(toolchain: string): string {
  const file = path.join(toolchain, "VERSION");
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim() : "unknown";
}

function main(): void {
  const [treeA, treeB] = process.argv.slice(2);
  if (!treeA || !treeB || !fs.existsSync(treeA) || !fs.existsSync(treeB)) {
    console.error("classify-help-stampability: pass two checkouts of the same version at different paths.");
    process.exit(1);
  }
  if (version(treeA) !== version(treeB)) {
    console.error(
      `classify-help-stampability: the two trees are different versions ` +
        `(${version(treeA)} vs ${version(treeB)}) — the experiment varies the PATH, not the code.`,
    );
    process.exit(1);
  }
  if (helpPython() === null) {
    console.error(
      `classify-help-stampability: no Python ${HELP_PYTHON_VERSION} on PATH — a classification is only ` +
        "valid for the renderer that produced it.",
    );
    process.exit(1);
  }
  const altCwd = path.dirname(treeB);
  const altHome = treeB;

  const result: Classification = {
    measuredAt: version(treeA),
    columns: Number(HELP_COLUMNS),
    python: HELP_PYTHON_VERSION,
    axes: ["checkout", "cwd", "home"],
    note:
      "A node is stampable when its --help is byte-identical across all three axes, read under the pinned Python and COLUMNS. " +
      "Produced by scripts/classify-help-stampability.ts; re-run it when the classification goes stale.",
    nodes: {},
  };

  for (const bin of BINARIES) {
    const binA = path.join(treeA, bin.rel);
    const binB = path.join(treeB, bin.rel);
    const base: Node = walk(binA, [], null, 0, { n: 0 }, treeA);
    if (!base.kids.has(bin.control)) {
      console.error(
        `classify-help-stampability: ${bin.name} parsed without its control subcommand ` +
          `'${bin.control}' — that is "could not parse", not "no subcommands".`,
      );
      process.exit(1);
    }
    const arms: Record<string, Node> = {
      checkout: walk(binB, [], null, 0, { n: 0 }, treeA),
      cwd: walk(binA, [], null, 0, { n: 0 }, altCwd),
      home: walk(binA, [], null, 0, { n: 0 }, treeA, altHome),
    };
    const baseNodes = nodesUnder(base);
    const armNodes = Object.fromEntries(
      Object.entries(arms).map(([name, tree]) => [name, nodesUnder(tree)]),
    );
    for (const [nodePath, text] of baseNodes) {
      const moved = Object.entries(armNodes)
        .filter(([, nodes]) => nodes.get(nodePath) !== text)
        .map(([name]) => name);
      result.nodes[`${bin.name} ${nodePath}`] = moved.length
        ? { stampable: false, reason: `--help varies with ${moved.join(", ")}` }
        : { stampable: true };
    }
  }

  const entries = Object.entries(result.nodes);
  const yes = entries.filter(([, v]) => v.stampable).length;
  fs.writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(
    `classify-help-stampability: ${yes}/${entries.length} nodes stampable at ` +
      `${result.measuredAt} (Python ${result.python}, COLUMNS=${result.columns}, axes: ${result.axes.join(", ")})`,
  );
  for (const [name, v] of entries) if (!v.stampable) console.log(`  not stampable: ${name} — ${v.reason}`);
}

main();
