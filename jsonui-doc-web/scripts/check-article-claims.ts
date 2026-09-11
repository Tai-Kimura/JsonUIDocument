// The articles make claims about how the library BEHAVES — which destination
// strings classify as which kind, whether a word list is case-sensitive, how
// two ids collapse onto one. Until this check, nothing compared any of them to
// the library. The gates read flags, invocations and output shapes; a sentence
// asserting that `external browser` in lower case does not match was verified
// once, by hand, on the day it was written.
//
// Upstream put the problem better than a gate description usually can: the
// vocabulary exists in exactly ONE place in the implementation, and the article
// is a SECOND copy of it, made by hand. Second copies diverge. This check makes
// the second copy answerable to the first on every deploy, against the pinned
// toolchain rather than against whatever is installed.
//
// A red here is not "the library broke". It is "a published sentence is now
// false, and here is the sentence" — so every claim carries an ANCHOR: a
// fragment of the published text it backs. If the anchor is gone the paragraph
// was rewritten, and the claim must be re-derived from the new wording rather
// than silently guarding text nobody publishes any more.
//
// ⚠️ What this does NOT do:
//   - it does not find claims. It checks the ones written down here. A
//     behavioural sentence nobody encoded still rots in silence, which is the
//     honest limit of the whole approach.
//   - it does not check that a claim is well WORDED, only that the behaviour it
//     asserts is the behaviour the pinned classifier has.
//   - it says nothing about the platform libraries, only about the classifier
//     reachable from the pinned jui_tools.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { HELP_PYTHON_VERSION, helpPython } from "./lib/cli-help";

const CWD = process.cwd();
const ROOT = path.resolve(CWD, "..");
const STRINGS = path.join(ROOT, "docs/screens/layouts/Resources/strings.json");
const LAYOUTS = path.join(ROOT, "docs/screens/layouts");

type Case = { raw: string; knownIds: string[]; expect: string };
type Claim = {
  where: string; // named in the red message, so an editor knows what to rewrite
  anchor: string; // published text this claim backs
  cases?: Case[];
  normalizeAlike?: [string, string][];
};

const k = (raw: string, expect: string, knownIds: string[] = []): Case => ({ raw, knownIds, expect });

const CLAIMS: Claim[] = [
  {
    where: "section 2 — the five kinds, in the transitions code block",
    anchor: '"destination": "遷移なし（タブ切替）"',
    cases: [
      k("ItemDetail", "screen", ["itemdetail"]),
      k("External Browser", "external"),
      k("遷移なし（タブ切替）", "none"),
      k("dismiss", "back"),
      k("/help", "route"),
    ],
  },
  {
    // The paragraph NAMES the release this site pins ("In 1.8.71, the release
    // this site pins, …"), so a pin bump to a tree whose vocabulary differs reds
    // here BY DESIGN: the sentence would be naming a release the site no longer
    // ships against. That is what happened at the 1.8.70 -> 1.8.71 bump, and it
    // is what forced this paragraph to be rewritten rather than carried over.
    where: "section 8 (en) — what `none` recognises in the release this page names as pinned",
    anchor: "In 1.8.71, the release this site pins",
    cases: [
      k("遷移なし", "none"),
      k("画面内", "none"),
      k("タブ切替", "none"),
      k("そのまま", "none"),
      k("なし（タブ切替）", "none"),
      k("none", "none"),
      k("NONE", "none"), // the English half ignores case; the page says so
      k("stays on this screen", "none"),
      k("no transition", "none"),
      k("tab switch", "none"),
    ],
  },
  {
    where: "section 8 (ja) — 同じ主張の日本語側（pin している版について述べている）",
    anchor: "このサイトが pin している 1.8.71 では",
    cases: [k("遷移なし", "none"), k("none", "none"), k("NONE", "none")],
  },
  {
    // The page does not only say what matches — it says where the vocabulary
    // STOPS, and names three near misses to show it. A rule stated without its
    // negative side is the half a reader cannot check, and these are the cases
    // that would quietly start matching if an alternative were ever unanchored.
    where: "section 8 — the near misses the vocabulary must NOT swallow",
    anchor: "Every English alternative is multi-word or anchored to the whole value",
    cases: [
      k("Target screen or tab", "unknown"), // carries `tab`, not `tab switch`
      k("Login none required", "unknown"), // carries `none`, unanchored
      k("state change", "unknown"),
      k("stay", "unknown"), // `stays on` is the alternative, not a bare `stay`
    ],
  },
  {
    where: "section 8 (en) — `external` matches case-sensitively",
    anchor: "`external browser` in lower case does not match",
    cases: [
      k("External Browser", "external"),
      k("external browser", "unknown"),
      k("https://example.com", "external"),
      k("tel:0000", "external"),
    ],
  },
  {
    where: "section 3 — the comparison key drops whitespace, `_` and `-` and lower-cases",
    anchor: "the key drops whitespace",
    normalizeAlike: [["forgot_password", "forgotpassword"]],
  },
];

/** Everything the site publishes as text: string values plus code blocks. */
function publishedCorpus(): string {
  const parts: string[] = [];
  const strings = JSON.parse(fs.readFileSync(STRINGS, "utf8")) as Record<string, unknown>;
  const collect = (o: unknown) => {
    if (typeof o === "string") parts.push(o);
    else if (Array.isArray(o)) o.forEach(collect);
    else if (o && typeof o === "object") Object.values(o).forEach(collect);
  };
  collect(strings);
  const walkDir = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walkDir(p);
      else if (e.name.endsWith(".json") && e.name !== "strings.json") {
        try {
          const collectCode = (o: unknown) => {
            if (Array.isArray(o)) o.forEach(collectCode);
            else if (o && typeof o === "object") {
              const r = o as Record<string, unknown>;
              if (r.type === "CodeBlock" && typeof r.code === "string") parts.push(r.code);
              Object.values(r).forEach(collectCode);
            }
          };
          collectCode(JSON.parse(fs.readFileSync(p, "utf8")));
        } catch {
          /* a layout that does not parse is another gate's business */
        }
      }
    }
  };
  walkDir(LAYOUTS);
  return parts.join("\n");
}

const BRIDGE = `
import json, sys
sys.path.insert(0, sys.argv[1])
from jui_cli.core.screen_identity import classify_destination, normalize_id
payload = json.load(sys.stdin)
out = {"kinds": [], "norms": []}
for c in payload["cases"]:
    r = classify_destination(c["raw"], set(c["knownIds"]))
    out["kinds"].append(str(getattr(r, "kind", r)))
for a, b in payload["norms"]:
    out["norms"].append([normalize_id(a), normalize_id(b)])
print(json.dumps(out))
`;

function main(): void {
  const root = process.env.JSONUI_CLI_PATH;
  if (!root) {
    console.error("check-article-claims: JSONUI_CLI_PATH is not set — refusing to report that");
    console.error("  the articles agree with a classifier nobody ran.");
    process.exit(2);
  }
  const py = helpPython() ?? "python3";
  const juiTools = path.join(root, "jui_tools");
  if (!fs.existsSync(path.join(juiTools, "jui_cli/core/screen_identity.py"))) {
    console.error(`check-article-claims: no screen_identity.py under ${juiTools}`);
    process.exit(1);
  }

  const corpus = publishedCorpus();
  const missing = CLAIMS.filter((c) => !corpus.includes(c.anchor));
  if (missing.length > 0) {
    console.error("check-article-claims: the published text behind these claims is gone, so the");
    console.error("  claims are guarding sentences nobody reads. Re-derive them from the new");
    console.error("  wording (or delete them with the paragraph):");
    for (const m of missing) console.error(`    ${m.where}\n      anchor: ${m.anchor}`);
    process.exit(1);
  }

  const cases = CLAIMS.flatMap((c) => (c.cases ?? []).map((x) => ({ claim: c, ...x })));
  const norms = CLAIMS.flatMap((c) => (c.normalizeAlike ?? []).map((p) => ({ claim: c, pair: p })));
  if (cases.length === 0 && norms.length === 0) {
    console.error("check-article-claims: no claims encoded — refusing to read that as agreement.");
    process.exit(1);
  }

  let raw: string;
  try {
    raw = execFileSync(py, ["-c", BRIDGE, juiTools], {
      input: JSON.stringify({
        cases: cases.map(({ raw: r, knownIds }) => ({ raw: r, knownIds })),
        norms: norms.map((n) => n.pair),
      }),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (e) {
    const err = e as { stderr?: string };
    console.error("check-article-claims: could not run the pinned classifier — a failure to ask");
    console.error("  is not an answer:");
    console.error((err.stderr ?? String(e)).split("\n").slice(0, 6).join("\n"));
    process.exit(1);
  }

  const got = JSON.parse(raw) as { kinds: string[]; norms: [string, string][] };
  const broken: string[] = [];
  cases.forEach((c, i) => {
    if (got.kinds[i] !== c.expect) {
      broken.push(
        `${c.claim.where}\n      ${JSON.stringify(c.raw)} classifies as '${got.kinds[i]}', the page says '${c.expect}'`,
      );
    }
  });
  norms.forEach((n, i) => {
    const [a, b] = got.norms[i];
    if (a !== b) {
      broken.push(
        `${n.claim.where}\n      ${JSON.stringify(n.pair[0])} and ${JSON.stringify(n.pair[1])} no longer normalize alike (${a} vs ${b})`,
      );
    }
  });

  if (broken.length > 0) {
    console.error(
      `check-article-claims: ${broken.length} published claim(s) the pinned classifier contradicts:`,
    );
    for (const b of broken) console.error(`    ${b}`);
    console.error("  Rewrite the paragraph from the shipped tool — run the examples, do not");
    console.error("  transcribe a release notice — and move the version the paragraph names.");
    process.exit(1);
  }

  console.log(
    `check-article-claims: OK — ${cases.length} behavioural claim(s) and ${norms.length} ` +
      `normalization claim(s) across ${CLAIMS.length} published passage(s)`,
  );
  console.log(`  agree with the PINNED classifier (python${HELP_PYTHON_VERSION} where available).`);
  console.log("  Each claim is anchored to the text it backs; a rewritten paragraph fails loudly");
  console.log("  rather than leaving the check guarding a sentence nobody publishes.");
}

main();
