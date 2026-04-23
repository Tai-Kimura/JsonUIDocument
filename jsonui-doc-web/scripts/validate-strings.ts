// prebuild: validate docs/screens/layouts/Resources/strings.json.
//
// Rules this version enforces:
//   1. Every namespace is an object.
//   2. Every value is either a string (same for all locales) OR an object
//      with BOTH `en` and `ja` keys. The whole site is committed to
//      bilingual-from-day-one; missing a locale at prebuild time becomes a
//      silent fallback at runtime, which is the wrong default here.
//   3. Object values carry only locale keys (en/ja). Stray fields are flagged
//      so renamed keys leave recognisable residue.
//
// Exits non-zero if any rule fails. Build blocks on non-zero.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ALLOWED_LOCALES = new Set(["en", "ja"]);
const REQUIRED_LOCALES = ["en", "ja"] as const;

type StringValue = string | { [locale: string]: string };
type StringsFile = Record<string, Record<string, StringValue>>;

const stringsPath = resolve(
  __dirname,
  "..",
  "..",
  "docs",
  "screens",
  "layouts",
  "Resources",
  "strings.json",
);

const raw = readFileSync(stringsPath, "utf8");
const data: StringsFile = JSON.parse(raw);

const errors: string[] = [];

for (const [namespace, entries] of Object.entries(data)) {
  if (entries === null || typeof entries !== "object" || Array.isArray(entries)) {
    errors.push(`[${namespace}] namespace is not an object`);
    continue;
  }

  for (const [key, value] of Object.entries(entries)) {
    const loc = `${namespace}.${key}`;

    if (typeof value === "string") {
      // Same copy for every locale. Legal. Nothing to check.
      continue;
    }

    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${loc}: value must be a string or an object, got ${JSON.stringify(value)}`);
      continue;
    }

    for (const locale of REQUIRED_LOCALES) {
      if (!(locale in value) || typeof value[locale] !== "string") {
        errors.push(`${loc}: missing required locale '${locale}'`);
      }
    }

    for (const locale of Object.keys(value)) {
      if (!ALLOWED_LOCALES.has(locale)) {
        errors.push(`${loc}: unknown locale key '${locale}' — allowed: ${[...ALLOWED_LOCALES].join(", ")}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`validate-strings: ${errors.length} issue(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const namespaceCount = Object.keys(data).length;
const keyCount = Object.values(data).reduce((acc, ns) => acc + Object.keys(ns).length, 0);
console.log(`validate-strings: OK (${namespaceCount} namespaces, ${keyCount} keys)`);
