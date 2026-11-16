// Records that a human has read a CLI reference card against a version's
// `--help`. Run it AFTER doing the reading, naming the cards you actually read:
//
//   JSONUI_CLI_PATH=<toolchain> npm run stamp:cli-card -- "jui build" "jui g project"
//
// There is deliberately no flag that stamps everything. The stamp's only claim
// is that a person read the card, and a tool that can assert that for 39 cards
// in one command turns the claim into a lie — which is the failure this whole
// mechanism exists to prevent. Stamping is meant to feel like the reading did.
//
// What lands in the card:
//
//   "verifiedAgainst": {
//     "version":     the toolchain's VERSION,
//     "columns":     the terminal width the help was rendered at,
//     "helpHash":    every node at or below the card's path, path + text,
//     "cardHash":    the card's own content with this stamp removed,
//     "fieldHashes": one short hash per field, so a lapsed stamp can say WHICH
//                    field moved without storing the old content — the gate's
//                    decision still rests on the whole-card hash, because
//                    deciding which fields are load-bearing would let changes
//                    to the others ride through with the stamp intact
//   }

import fs from "node:fs";
import path from "node:path";
import {
  BINARIES,
  HELP_COLUMNS,
  HELP_PYTHON_VERSION,
  cardHashFor,
  helpHashFor,
  helpPython,
  normalize,
  walk,
} from "./lib/cli-help";

const CWD = process.cwd();
const SOURCE = path.resolve(CWD, "..", "docs/data/cli-commands.json");
const STAMPABILITY = path.resolve(CWD, "..", "docs/data/cli-help-stampability.json");

interface Card {
  binary: string;
  command: string;
  verifiedAgainst?: unknown;
  [k: string]: unknown;
}

function fieldHashes(card: Card): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(card)) {
    if (k === "verifiedAgainst") continue;
    out[k] = cardHashFor({ [k]: v }).slice(0, 12);
  }
  return out;
}

function main(): void {
  const ids = process.argv.slice(2);
  if (ids.length === 0) {
    console.error('stamp-cli-card: name the cards you read, e.g. "jui build" "jsonui-test validate"');
    process.exit(1);
  }
  const toolchain = process.env.JSONUI_CLI_PATH;
  if (!toolchain || !fs.existsSync(toolchain)) {
    console.error("stamp-cli-card: JSONUI_CLI_PATH must point at the toolchain you read the help from.");
    process.exit(1);
  }
  if (helpPython() === null) {
    console.error(
      `stamp-cli-card: no Python ${HELP_PYTHON_VERSION} on PATH. The help you read is rendered by the ` +
        "interpreter, so a stamp taken under another one would not match the gate's.",
    );
    process.exit(1);
  }
  const version = fs.readFileSync(path.join(toolchain, "VERSION"), "utf8").trim();
  const data = JSON.parse(fs.readFileSync(SOURCE, "utf8")) as { commands: Card[] };
  const classification = JSON.parse(fs.readFileSync(STAMPABILITY, "utf8")) as {
    nodes: Record<string, { stampable: boolean; reason?: string }>;
  };

  const trees = new Map<string, ReturnType<typeof walk>>();
  let wrote = 0;
  for (const id of ids) {
    const [binName, ...rest] = id.split(/\s+/);
    const command = rest.join(" ");
    const bin = BINARIES.find((b) => b.name === binName);
    if (!bin) {
      console.error(`stamp-cli-card: ${binName} is not one of the checked binaries`);
      process.exit(1);
    }
    const card = data.commands.find((c) => c.binary === binName && c.command === command);
    if (!card) {
      console.error(`stamp-cli-card: no card for '${id}'`);
      process.exit(1);
    }
    if (!trees.has(binName)) trees.set(binName, walk(path.join(toolchain, bin.rel), [], null, 0, { n: 0 }));
    const tree = trees.get(binName)!;
    const cardPath = normalize(tree, command.split(/\s+/));

    const nodeKey = `${binName} ${cardPath.join(" ")}`;
    if (classification.nodes[nodeKey]?.stampable === false) {
      console.error(
        `stamp-cli-card: '${id}' is not stampable — ${classification.nodes[nodeKey]?.reason}. ` +
          "Its help is not reproducible, so a hash of it would say nothing.",
      );
      process.exit(1);
    }

    card.verifiedAgainst = {
      version,
      columns: Number(HELP_COLUMNS),
      python: HELP_PYTHON_VERSION,
      helpHash: helpHashFor(tree, cardPath),
      cardHash: cardHashFor(card as Record<string, unknown>),
      fieldHashes: fieldHashes(card),
    };
    console.log(`stamped: ${id} against ${version}`);
    wrote += 1;
  }
  fs.writeFileSync(SOURCE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`stamp-cli-card: wrote ${wrote} stamp(s). They claim a human read those cards — nothing else.`);
}

main();
