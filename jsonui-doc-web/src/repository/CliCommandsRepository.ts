// Hand-written repository. Not regenerated.
//
// Reads the CLI command reference staged by scripts/build-cli-commands.ts from
// ../docs/data/cli-commands.json. The dataset carries en + ja for every piece
// of prose, so the caller passes the language it wants rather than going
// through StringManager — the copy lives in the dataset, not in strings.json.
//
// The import is static, so the catalogue is part of the bundle and renders
// during the static export instead of arriving after a fetch.

import dataset from "@/data/cli-commands.json";

export type CliLang = "en" | "ja";

export interface CliLocalized {
  en: string;
  ja: string;
}

export interface CliOption {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: CliLocalized;
}

export interface CliExample {
  language: string;
  code: string;
}

export interface CliCommand {
  binary: string;
  command: string;
  synopsis: string;
  aliases?: string[];
  purpose: CliLocalized;
  options: CliOption[];
  examples: CliExample[];
  seeAlso: string[];
}

export interface CliBinary {
  name: string;
  language: string;
  purpose: CliLocalized;
  platforms: string[];
}

interface CliDataset {
  binaries: CliBinary[];
  commands: CliCommand[];
}

const data = dataset as unknown as CliDataset;

export function pickCli(value: CliLocalized, lang: CliLang): string {
  return value[lang] ?? value.en;
}

export class CliCommandsRepository {
  binaries(): CliBinary[] {
    return data.binaries;
  }

  /** Every command, ordered by the binary order declared in the dataset. */
  commands(): CliCommand[] {
    const order = new Map(data.binaries.map((b, i) => [b.name, i]));
    return [...data.commands].sort(
      (a, b) => (order.get(a.binary) ?? 0) - (order.get(b.binary) ?? 0),
    );
  }

  commandCount(): number {
    return data.commands.length;
  }

  /** Commands per binary, keyed by binary name, in dataset order. */
  countsByBinary(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const b of data.binaries) counts[b.name] = 0;
    for (const c of data.commands) counts[c.binary] = (counts[c.binary] ?? 0) + 1;
    return counts;
  }
}
