// ViewModel for Reference > CLI command reference.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CliCommandsData } from "@/generated/data/CliCommandsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";
import {
  CliCommandsRepository,
  pickCli,
  type CliLang,
} from "@/repository/CliCommandsRepository";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

// Mirrors cells/cli_binary_row.json.
interface CliBinaryCell {
  id: string;
  name: string;
  meta: string;
  purpose: string;
}

// Mirrors cells/cli_command_detail.json.
interface CliCommandCell {
  id: string;
  binary: string;
  name: string;
  aliases: string;
  aliasesVisibility: string;
  synopsis: string;
  purpose: string;
  optionsHeading: string;
  optionsText: string;
  optionsVisibility: string;
  exampleHeading: string;
  exampleCode: string;
  exampleVisibility: string;
  seeAlso: string;
  seeAlsoVisibility: string;
}

export class CliCommandsViewModel {
  private repository = new CliCommandsRepository();
  protected router: AppRouterInstance;
  protected _getData: () => CliCommandsData;
  protected _setData: (
    data: CliCommandsData | ((prev: CliCommandsData) => CliCommandsData),
  ) => void;

  get data(): CliCommandsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => CliCommandsData,
    setData: (data: CliCommandsData | ((prev: CliCommandsData) => CliCommandsData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<CliCommandsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<CliCommandsData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateDbSchemaCheck: () => this.navigate("/concepts/db-schema-check"),
      onNavigateContractCheck: () => this.navigate("/concepts/implementation-contract-check"),
      onNavigateReference: () => this.navigate("/"),
    });
  };

  onAppear = () => {
    // SSR / pre-hydration pass: pinned to the default language on both sides
    // so the server and the first client render agree.
    this.updateData({
      nextReadLinks: this.asCollection(this.buildNextReads(this.sDefault)),
      binaries: this.asCollection(this.buildBinaries(this.sDefault, "en")),
      commands: this.asCollection(this.buildCommands(this.sDefault, "en")),
    });
  };

  mountLanguage = (): void => {
    const lang: CliLang = StringManager.language === "ja" ? "ja" : "en";
    this.updateData({
      nextReadLinks: this.asCollection(this.buildNextReads(this.s)),
      binaries: this.asCollection(this.buildBinaries(this.s, lang)),
      commands: this.asCollection(this.buildCommands(this.s, lang)),
    });
  };

  private buildBinaries = (
    lookup: (key: string) => string,
    lang: CliLang,
  ): CliBinaryCell[] => {
    void lookup;
    const counts = this.repository.countsByBinary();
    return this.repository.binaries().map((b) => ({
      id: b.name,
      name: b.name,
      meta: `${b.language} · ${b.platforms.join(" / ")} · ${counts[b.name] ?? 0}`,
      purpose: pickCli(b.purpose, lang),
    }));
  };

  private buildCommands = (
    lookup: (key: string) => string,
    lang: CliLang,
  ): CliCommandCell[] =>
    this.repository.commands().map((c) => {
      const optionsText = c.options
        .map((o) => {
          const bits: string[] = [o.type];
          if (o.required) bits.push(lookup("catalog_required_marker"));
          if (o.default !== undefined) {
            bits.push(`${lookup("catalog_default_prefix")}: ${o.default}`);
          }
          return `${o.name}  (${bits.join(", ")})\n    ${pickCli(o.description, lang)}`;
        })
        .join("\n\n");
      const example = c.examples[0];
      const aliases = c.aliases ?? [];

      return {
        id: `${c.binary} ${c.command}`,
        binary: c.binary,
        name: `${c.binary} ${c.command}`,
        aliases: aliases.length > 0
          ? `${lookup("catalog_aliases_prefix")}${aliases.map((a) => `${c.binary} ${a}`).join(", ")}`
          : "",
        aliasesVisibility: aliases.length > 0 ? "visible" : "gone",
        synopsis: c.synopsis,
        purpose: pickCli(c.purpose, lang),
        optionsHeading: lookup("catalog_options_heading"),
        optionsText,
        optionsVisibility: c.options.length > 0 ? "visible" : "gone",
        exampleHeading: lookup("catalog_example_heading"),
        exampleCode: example ? example.code : "",
        exampleVisibility: example ? "visible" : "gone",
        seeAlso: c.seeAlso.length > 0
          ? `${lookup("catalog_see_also_prefix")}${c.seeAlso.join(" · ")}`
          : "",
        seeAlsoVisibility: c.seeAlso.length > 0 ? "visible" : "gone",
      };
    });

  private buildNextReads = (lookup: (key: string) => string): NextReadCell[] => [
      {
        id: "next_cli",
        titleKey: lookup("next_cli_title"),
        descriptionKey: lookup("next_cli_description"),
        url: "/tools/cli",
        onNavigate: () => this.navigate("/tools/cli"),
      },
      {
        id: "next_first_spec",
        titleKey: lookup("next_first_spec_title"),
        descriptionKey: lookup("next_first_spec_description"),
        url: "/guides/writing-your-first-spec",
        onNavigate: () => this.navigate("/guides/writing-your-first-spec"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`reference_cli_commands_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`reference_cli_commands_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
