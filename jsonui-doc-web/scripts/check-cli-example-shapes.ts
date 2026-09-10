// The CLI reference's cards carry `examples[].code` — transcripts of what a
// command prints. Nothing compared them to the tool, and one rotted: the
// `generate html` card showed `Generated 174 HTML files` for several releases
// after the tool started printing a parenthetical breakdown, then a `this run`
// suffix on top of that. Every gate stayed green throughout, and the card's
// read-stamp still matched.
//
// The stamp cannot catch this, and the direction matters. `verifiedAgainst`
// hashes the CARD, so it detects an editor changing the card. Freshness against
// the tool comes from re-rendering, which the coverage gate does for `--help`
// and which nothing does for an example. So the stamp is a seal on the card,
// not a check against the binary — and the failure that occurred is exactly the
// half it does not cover: the tool moved while the card sat still.
//
// This gate re-renders the one part of an example that CAN be re-rendered
// deterministically: the summary lines a generator prints at the end of a run.
// It builds a throwaway fixture, runs the three generators, and collects the
// shapes they emit. Every example line of the same family must match one of
// them, with digits and absolute paths normalised away — the values in an
// example are illustrative on purpose and are not under test.
//
// ⚠️ What this does NOT check, said plainly, because the number is small and
// pretending otherwise would be worse than not having the gate:
//   - only lines beginning `Generated` or `Open ` are covered. Today that is 5
//     of the ~73 quoted-output lines in the reference. The other 68 — prose the
//     tool prints, error paths, per-file listings, flag echoes — have no
//     mechanism here and can still rot silently.
//   - it says nothing about whether an example's VALUES are plausible, whether
//     the invocation above them is right, or whether the command still accepts
//     those flags. `check:cli-coverage` covers subcommand existence; nothing
//     covers flags.
//   - a card documenting a binary this gate does not run (sjui/kjui/rjui, or a
//     command needing inputs a fixture cannot fake) is not reached at all.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CWD = process.cwd();
const ROOT = path.resolve(CWD, "..");
const CARDS = path.join(ROOT, "docs/data/cli-commands.json");

/** Lines a generator prints as its own summary. The narrow, re-renderable family. */
const FAMILY = /^\s*(Generated|Open )/;

/** Values are illustrative by design; shapes are what this gate compares. */
function shapeOf(line: string): string {
  let s = line.trim();
  s = s.replace(/\/\S+\//g, "<path>/"); // absolute or nested paths
  s = s.replace(/^Generated: \S+\.(html|md)$/, "Generated: <file>");
  s = s.replace(/\d+/g, "N");
  return s;
}

function write(p: string, o: unknown): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(o, null, 2) + "\n", "utf8");
}

/** A fixture small enough to be obvious and complete enough that each generator runs. */
function buildFixture(dir: string): void {
  write(path.join(dir, "tests/a.test.json"), {
    type: "screen",
    platform: "ios",
    source: { layout: "s" },
    metadata: { name: "Home", description: "d" },
    cases: [{ name: "c", description: "c", steps: [{ action: "tap", id: "x" }] }],
  });
  write(path.join(dir, "spec/home.spec.json"), {
    type: "screen_spec",
    version: "1.0",
    metadata: { name: "Home", description: "home screen", displayName: "Home" },
    structure: {
      components: [{ type: "View", id: "root", description: "r" }],
      layout: { root: "root", children: [] },
    },
    transitions: [],
  });
  write(path.join(dir, "comp/button.component.json"), {
    type: "component_spec",
    version: "1.0",
    metadata: { name: "Button", description: "a button", displayName: "Button" },
    structure: {
      components: [{ type: "View", id: "root", description: "r" }],
      layout: { root: "root", children: [] },
    },
  });
}

function run(tool: string, cwd: string, args: string[]): string {
  try {
    return execFileSync("python3", [tool, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    // A generator that exits non-zero still prints its summary; the shapes are
    // what we are after, so keep the output rather than dying on the status.
    return (err.stdout ?? "") + (err.stderr ?? "");
  }
}

function main(): void {
  const cliPath = process.env.JSONUI_CLI_PATH;
  if (!cliPath) {
    console.error("check-cli-example-shapes: JSONUI_CLI_PATH is not set — refusing to");
    console.error("  report a match without having run the tool.");
    process.exit(2);
  }
  const tool = path.join(cliPath, "document_tools/jsonui-doc");
  if (!fs.existsSync(tool)) {
    console.error(`check-cli-example-shapes: no jsonui-doc at ${tool}`);
    process.exit(2);
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cli-example-shapes-"));
  buildFixture(tmp);

  // Invoked the way the cards document it — relative output paths, so a printed
  // path compares against the card's printed path rather than against a tmpdir.
  const logs = [
    run(tool, tmp, ["generate", "html", "tests", "-o", "html"]),
    run(tool, tmp, ["generate", "spec", "spec", "-o", "specout", "--format", "html"]),
    run(tool, tmp, ["generate", "component", "comp", "-o", "compout", "--format", "html"]),
  ].join("\n");

  const current = new Set<string>();
  for (const line of logs.split("\n")) if (FAMILY.test(line)) current.add(shapeOf(line));

  if (current.size === 0) {
    console.error("check-cli-example-shapes: the generators printed no summary lines —");
    console.error("  refusing to read an empty harvest as agreement. The fixture or the");
    console.error("  invocations above are wrong, not the reference.");
    process.exit(1);
  }

  const cards = JSON.parse(fs.readFileSync(CARDS, "utf8")) as {
    commands: { name?: string; command?: string; examples?: { code?: string }[] }[];
  };

  const bad: { card: string; line: string; shape: string }[] = [];
  let checked = 0;
  for (const c of cards.commands) {
    const name = c.name ?? c.command ?? "(unnamed card)";
    for (const ex of c.examples ?? []) {
      for (const line of (ex.code ?? "").split("\n")) {
        if (!FAMILY.test(line)) continue;
        checked += 1;
        const shape = shapeOf(line);
        if (!current.has(shape)) bad.push({ card: name, line: line.trim(), shape });
      }
    }
  }

  fs.rmSync(tmp, { recursive: true, force: true });

  if (bad.length > 0) {
    console.error(
      `check-cli-example-shapes: ${bad.length} of ${checked} example line(s) quote a summary`,
    );
    console.error("  the tool no longer prints in that shape:");
    for (const b of bad) {
      console.error(`    ${b.card}:  ${b.line}`);
      console.error(`      reads as: ${b.shape}`);
    }
    console.error("  shapes this toolchain prints today:");
    for (const s of [...current].sort()) console.error(`    ${s}`);
    console.error("  Re-run the command and paste its output — do not hand-edit the line.");
    process.exit(1);
  }

  console.log(
    `check-cli-example-shapes: OK — ${checked} example line(s) match ${current.size} shape(s)`,
  );
  console.log("  harvested from a live run of generate html / spec / component.");
  console.log(
    "  Covers summary lines only (Generated…, Open…). Values are not compared, and the",
  );
  console.log("  other quoted-output lines in the reference have no mechanism here.");
}

main();
