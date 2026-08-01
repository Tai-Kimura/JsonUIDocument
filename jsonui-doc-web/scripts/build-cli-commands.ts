// Stages the CLI command reference dataset into the web app.
//
//   source: ../docs/data/cli-commands.json   (hand-authored SSoT, en + ja)
//   output: src/data/cli-commands.json       (gitignored; imported by
//                                             src/repository/CliCommandsRepository.ts)
//
// The copy exists because the source lives outside the Next.js app root, which
// cannot be imported directly. Validation runs here rather than at render time
// so a malformed entry fails the build instead of rendering a blank row — the
// same bargain `validate:strings` makes for prose.
//
// Run via `npm run build:cli` (part of `prebuild`).

import fs from "node:fs";
import path from "node:path";

const CWD = process.cwd();
const REPO_ROOT = path.resolve(CWD, "..");
const SOURCE = path.resolve(REPO_ROOT, "docs/data/cli-commands.json");
const OUT_DIR = path.resolve(CWD, "src/data");
const OUT_FILE = path.join(OUT_DIR, "cli-commands.json");

const LANGS = ["en", "ja"] as const;

type Localized = Record<string, string>;

interface RawOption {
  name?: unknown;
  type?: unknown;
  default?: unknown;
  required?: unknown;
  description?: unknown;
}

interface RawExample {
  language?: unknown;
  code?: unknown;
}

interface RawCommand {
  binary?: unknown;
  command?: unknown;
  synopsis?: unknown;
  aliases?: unknown;
  purpose?: unknown;
  options?: unknown;
  examples?: unknown;
  seeAlso?: unknown;
}

interface RawBinary {
  name?: unknown;
  language?: unknown;
  purpose?: unknown;
  platforms?: unknown;
}

const errors: string[] = [];

function fail(where: string, message: string): void {
  errors.push(`${where}: ${message}`);
}

function checkLocalized(value: unknown, where: string): value is Localized {
  if (typeof value !== "object" || value === null) {
    fail(where, "expected an object with en / ja");
    return false;
  }
  let ok = true;
  for (const lang of LANGS) {
    const text = (value as Record<string, unknown>)[lang];
    if (typeof text !== "string" || text.trim() === "") {
      fail(where, `missing or empty '${lang}'`);
      ok = false;
    }
  }
  return ok;
}

function checkStringArray(value: unknown, where: string): void {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    fail(where, "expected an array of strings");
  }
}

function main(): void {
  if (!fs.existsSync(SOURCE)) {
    console.error(`build-cli-commands: source not found: ${SOURCE}`);
    process.exit(1);
  }

  const parsed = JSON.parse(fs.readFileSync(SOURCE, "utf8")) as {
    binaries?: unknown;
    commands?: unknown;
  };

  const binaries = Array.isArray(parsed.binaries) ? (parsed.binaries as RawBinary[]) : [];
  const commands = Array.isArray(parsed.commands) ? (parsed.commands as RawCommand[]) : [];

  if (binaries.length === 0) fail("binaries", "empty or missing");
  if (commands.length === 0) fail("commands", "empty or missing");

  const binaryNames = new Set<string>();
  binaries.forEach((b, i) => {
    const where = `binaries[${i}]`;
    if (typeof b.name !== "string" || b.name === "") {
      fail(where, "missing name");
    } else {
      if (binaryNames.has(b.name)) fail(where, `duplicate binary '${b.name}'`);
      binaryNames.add(b.name);
    }
    if (typeof b.language !== "string" || b.language === "") fail(where, "missing language");
    checkLocalized(b.purpose, `${where}.purpose`);
    checkStringArray(b.platforms, `${where}.platforms`);
  });

  const seen = new Set<string>();
  commands.forEach((c, i) => {
    const label =
      typeof c.binary === "string" && typeof c.command === "string"
        ? `${c.binary} ${c.command}`
        : `commands[${i}]`;
    const where = `commands[${i}] (${label})`;

    if (typeof c.binary !== "string" || c.binary === "") {
      fail(where, "missing binary");
    } else if (!binaryNames.has(c.binary)) {
      fail(where, `binary '${c.binary}' is not declared in binaries[]`);
    }
    if (typeof c.command !== "string" || c.command === "") fail(where, "missing command");
    if (typeof c.synopsis !== "string" || c.synopsis === "") fail(where, "missing synopsis");
    checkLocalized(c.purpose, `${where}.purpose`);
    checkStringArray(c.aliases, `${where}.aliases`);
    // seeAlso is REQUIRED (use [] when none): the web repository types it as
    // string[] and the ViewModel reads .length unguarded — a missing key
    // passes this build and then crashes next build at prerender.
    if (c.seeAlso === undefined) fail(where, "missing seeAlso (use [] when none)");
    checkStringArray(c.seeAlso, `${where}.seeAlso`);

    if (seen.has(label)) fail(where, "duplicate command");
    seen.add(label);

    const options = Array.isArray(c.options) ? (c.options as RawOption[]) : [];
    if (!Array.isArray(c.options)) fail(where, "options must be an array (use [] when none)");
    options.forEach((o, j) => {
      const ow = `${where}.options[${j}]`;
      if (typeof o.name !== "string" || o.name === "") fail(ow, "missing name");
      if (typeof o.type !== "string" || o.type === "") fail(ow, "missing type");
      checkLocalized(o.description, `${ow}.description`);
    });

    const examples = Array.isArray(c.examples) ? (c.examples as RawExample[]) : [];
    if (!Array.isArray(c.examples)) fail(where, "examples must be an array (use [] when none)");
    examples.forEach((e, j) => {
      const ew = `${where}.examples[${j}]`;
      if (typeof e.code !== "string" || e.code === "") fail(ew, "missing code");
      if (typeof e.language !== "string" || e.language === "") fail(ew, "missing language");
    });
  });

  if (errors.length > 0) {
    console.error("build-cli-commands: FAILED");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify({ binaries, commands }, null, 2)}\n`, "utf8");

  const documented = commands.filter(
    (c) => (Array.isArray(c.options) && c.options.length > 0) ||
           (Array.isArray(c.examples) && c.examples.length > 0),
  ).length;
  console.log(
    `build-cli-commands: OK (${binaries.length} binaries, ${commands.length} commands, ` +
      `${documented} with flags or examples) -> src/data/cli-commands.json`,
  );
}

main();
