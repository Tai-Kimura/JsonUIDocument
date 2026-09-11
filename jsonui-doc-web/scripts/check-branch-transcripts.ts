// A code block that opens with `$ jsonui-test generate branch-tests …` is not an
// illustration — it is a TRANSCRIPT, and a reader compares their terminal to it
// line by line. Three of them on the branch-tests guide had drifted while every
// gate stayed green: the tool appends a qualifier to the `routes:` line saying
// the list comes from `dataFlow.repositories[].methods[].endpoint` and NOT from
// the contract's api references, and it closes by naming the toolchain that
// generated the files. Neither line was on the page.
//
// `check:cli-example-shapes` cannot see this. It reads `docs/data/cli-commands.json`
// and only the `Generated|Open ` family, from jsonui-doc generators. A transcript
// in a GUIDE, from jsonui-test, was compared against nothing at all — which is how
// two lines went missing with no release moving underneath them. (Measured at the
// pin, not against a candidate: the drift predates 1.8.71 entirely.)
//
// What it does: parses the `$ …` command out of the block (continuation lines
// joined), builds a fixture that mirrors the page's example — screen
// `profile_screen`, one route `updateProfile`, three declared branches and one
// note-only — runs THAT command, and compares the tool's output with the rest of
// the block.
//
// ⚠️ Two normalizations, both declared on the page itself so a reader is not
// comparing against something the page hides:
//   - paths. The tool prints them absolute; the page shows them relative to the
//     project root, so the fixture root is stripped before comparing.
//   - the closing line's version. The page writes `<version>`, because the number
//     is whichever toolchain the reader ran.
//
// ⚠️ Whitespace is collapsed before comparing, so LINE WRAPPING and indentation
// are not checked — the page wraps two long lines on purpose and would otherwise
// be red for being readable. The words are what this gate defends.
//
// ⚠️ The fixture mirrors the page's example rather than being derived from it.
// Change the example's screen name, route, or branch counts and this gate goes
// red until the fixture follows — loudly, which is the point, but it is a real
// coupling and not an accident.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { HELP_PYTHON_VERSION, helpPython } from "./lib/cli-help";

const CWD = process.cwd();
const ROOT = path.resolve(CWD, "..");
const LAYOUTS = path.join(ROOT, "docs/screens/layouts");
const OPENER = "$ jsonui-test generate branch-tests";

type Found = { where: string; argv: string[]; expected: string };

function write(p: string, o: unknown): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(o, null, 1) + "\n", "utf8");
}

/** The page's example, as a project: one screen, one route, 3 branches + 1 note. */
function buildFixture(dir: string): void {
  write(path.join(dir, "jui.config.json"), { spec_directory: "docs/specs" });
  write(path.join(dir, "docs/specs/profile_screen.spec.json"), {
    type: "screen_spec",
    version: "1.0",
    metadata: {
      name: "ProfileScreen",
      displayName: "Profile",
      description: "d",
      layoutFile: "profile_screen",
    },
    structure: { components: [], layout: {} },
    dataFlow: {
      viewModel: { methods: [{ name: "onTapSave" }], vars: [] },
      repositories: [
        {
          name: "ProfileRepository",
          methods: [{ name: "updateProfile", endpoint: "PUT /api/items" }],
        },
      ],
    },
    stateManagement: {
      uiVariables: [
        { name: "isSaving", type: "Bool" },
        { name: "screenState", type: "String" },
      ],
    },
    branchContracts: {
      conditions: {
        formValid: {
          witness_true: { "data.isSaving": false },
          witness_false: { "data.isSaving": true },
        },
      },
      methods: {
        onTapSave: {
          branches: [
            { when: { "data.isSaving": true }, then: { api: "none" } },
            {
              when: { cond: "formValid", "api.updateProfile": "success" },
              then: { transition: "HomeScreen", "api.updateProfile": "called" },
            },
            {
              when: { "api.updateProfile": "failure" },
              then: { "data.screenState": "save_error" },
            },
            { note: "banner auto-dismisses after 5 s — time-model dependent" },
          ],
        },
      },
    },
  });
  write(path.join(dir, "tests/mocks/profile/put_api-items.mock.json"), {
    source: { method: "PUT", path: "/api/items" },
    activeScenario: "success",
    scenarios: {
      success: { status: 200, body: { profile: { id: "p1" } } },
      failure: { status: 500, body: { error: { code: "boom" } } },
    },
  });
}

/** Split the `$ …` invocation (continuation lines joined) from the output below it. */
function parseBlock(code: string, where: string): Found | null {
  const lines = code.split("\n");
  if (!lines[0].startsWith(OPENER)) return null;
  let cmd = "";
  let i = 0;
  for (; i < lines.length; i += 1) {
    const line = i === 0 ? lines[0].replace(/^\$\s*/, "") : lines[i];
    if (line.trimEnd().endsWith("\\")) {
      cmd += line.trimEnd().slice(0, -1) + " ";
      continue;
    }
    cmd += line;
    break;
  }
  const argv = cmd.trim().split(/\s+/).slice(1); // drop the binary name
  return { where, argv, expected: lines.slice(i + 1).join("\n") };
}

function collapse(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function findBlocks(): Found[] {
  const out: Found[] = [];
  const visit = (obj: unknown, file: string): void => {
    if (Array.isArray(obj)) {
      for (const v of obj) visit(v, file);
      return;
    }
    if (!obj || typeof obj !== "object") return;
    const o = obj as Record<string, unknown>;
    if (o.type === "CodeBlock" && typeof o.code === "string" && o.code.startsWith(OPENER)) {
      const f = parseBlock(o.code, file);
      if (f) out.push(f);
    }
    for (const v of Object.values(o)) visit(v, file);
  };
  const walkDir = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walkDir(p);
      else if (e.name.endsWith(".json") && e.name !== "strings.json") {
        try {
          visit(JSON.parse(fs.readFileSync(p, "utf8")), path.relative(ROOT, p));
        } catch {
          /* a layout that does not parse is another gate's business */
        }
      }
    }
  };
  walkDir(LAYOUTS);
  return out;
}

function main(): void {
  const cliPath = process.env.JSONUI_CLI_PATH;
  if (!cliPath) {
    console.error("check-branch-transcripts: JSONUI_CLI_PATH is not set — refusing to");
    console.error("  report that a transcript matches a tool nobody ran.");
    process.exit(2);
  }
  const py = helpPython();
  if (!py) {
    console.error(`check-branch-transcripts: python${HELP_PYTHON_VERSION} not found.`);
    process.exit(2);
  }
  const tool = path.join(cliPath, "test_tools/jsonui-test");
  if (!fs.existsSync(tool)) {
    console.error(`check-branch-transcripts: no jsonui-test at ${tool}`);
    process.exit(1);
  }

  const blocks = findBlocks();
  if (blocks.length === 0) {
    console.error("check-branch-transcripts: found 0 branch-tests transcripts — the reader");
    console.error("  is broken, not the site. Refusing to read that as agreement.");
    process.exit(1);
  }

  const bad: { where: string; want: string; got: string }[] = [];
  for (const b of blocks) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "branch-transcript-"));
    buildFixture(dir);
    let printed: string;
    try {
      printed = execFileSync(py, [tool, ...b.argv], {
        cwd: dir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      const err = e as { stdout?: string; stderr?: string };
      console.error(`check-branch-transcripts: ${b.where}: the command the page shows did`);
      console.error("  not succeed, so the transcript under it cannot be true:");
      console.error(`    $ jsonui-test ${b.argv.join(" ")}`);
      console.error(((err.stderr ?? "") + (err.stdout ?? "")).split("\n").slice(0, 8).join("\n"));
      fs.rmSync(dir, { recursive: true, force: true });
      process.exit(1);
    }
    // The tool prints REAL paths, and on macOS os.tmpdir() is itself a symlink
    // (/var/folders -> /private/var/folders). Stripping only the path we created
    // leaves the `/private` prefix behind on every line — which reds the gate for
    // a reason that has nothing to do with the page.
    // LONGEST FIRST, and that ordering is the whole of it: strip `/tmp/x/` first
    // and `/private/tmp/x/...` becomes `/private` + a relative path, with the
    // longer prefix no longer present to strip.
    let stripped = printed;
    const prefixes = [...new Set([dir, fs.realpathSync(dir)])].sort(
      (a, b) => b.length - a.length,
    );
    for (const prefix of prefixes) stripped = stripped.split(prefix + "/").join("");
    const real = collapse(
      stripped.replace(/(generated by jsonui-test )\d+\.\d+\.\d+/g, "$1<version>"),
    );
    fs.rmSync(dir, { recursive: true, force: true });
    const want = collapse(b.expected);
    if (real !== want) bad.push({ where: b.where, want, got: real });
  }

  if (bad.length > 0) {
    console.error(
      `check-branch-transcripts: ${bad.length} of ${blocks.length} transcript(s) do not match`,
    );
    console.error("  what the pinned toolchain prints:");
    for (const b of bad) {
      console.error(`    ${b.where}`);
      // Name the first place they part company; the whole strings are too long to read.
      const w = b.want.split(" ");
      const g = b.got.split(" ");
      let i = 0;
      while (i < w.length && i < g.length && w[i] === g[i]) i += 1;
      console.error(`      page: …${w.slice(Math.max(0, i - 6), i + 12).join(" ")}`);
      console.error(`      tool: …${g.slice(Math.max(0, i - 6), i + 12).join(" ")}`);
    }
    console.error("  Re-run the command and paste its output. Paths are compared relative to");
    console.error("  the project root and the closing line's version as `<version>`, both of");
    console.error("  which the page states; wrapping and indentation are not compared.");
    process.exit(1);
  }

  console.log(
    `check-branch-transcripts: OK — ${blocks.length} transcript(s) of ` +
      `'jsonui-test generate branch-tests' match what the pinned tool prints`,
  );
  console.log(`  for the page's own example (run under python${HELP_PYTHON_VERSION}).`);
  console.log("  Every line is compared, not a chosen family — but wrapping is not, and the");
  console.log("  fixture mirrors the example rather than being derived from it.");
}

main();
