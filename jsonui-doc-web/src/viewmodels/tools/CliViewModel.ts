// ViewModel for Tools > CLI.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CliData } from "@/generated/data/CliData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface CliRowCell {
  id: string;
  nameKey: string;
  roleKey: string;
  bodyKey: string;
}

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

const CLI_IDS = [
  "jui", "sjui", "kjui", "rjui", "jsonui_test", "jsonui_doc",
] as const;

export class CliViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => CliData;
  protected _setData: (
    data: CliData | ((prev: CliData) => CliData),
  ) => void;

  get data(): CliData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => CliData,
    setData: (data: CliData | ((prev: CliData) => CliData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<CliData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<CliData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateTools: () => this.navigate("/"),
    });
  };

  onAppear = () => {
    this.updateData({
      cliRows: this.asCollection(this.buildCliRows(this.sDefault)),
      nextReadLinks: this.asCollection(this.buildNextReads(this.sDefault)),
    });
  };

  mountLanguage = (): void => {
    this.updateData({
      cliRows: this.asCollection(this.buildCliRows(this.s)),
      nextReadLinks: this.asCollection(this.buildNextReads(this.s)),
    });
  };

  private buildCliRows = (lookup: (key: string) => string): CliRowCell[] =>
    CLI_IDS.map((id) => ({
      id,
      nameKey: lookup(`cli_${id}_name`),
      roleKey: lookup(`cli_${id}_role`),
      bodyKey: lookup(`cli_${id}_body`),
    }));

  private buildNextReads = (lookup: (key: string) => string): NextReadCell[] => [
    {
      id: "next_agents",
      titleKey: lookup("next_agents_title"),
      descriptionKey: lookup("next_agents_description"),
      url: "/tools/agents",
      onNavigate: () => this.navigate("/tools/agents"),
    },
    {
      id: "next_mcp",
      titleKey: lookup("next_mcp_title"),
      descriptionKey: lookup("next_mcp_description"),
      url: "/tools/mcp",
      onNavigate: () => this.navigate("/tools/mcp"),
    },
  ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`tools_cli_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`tools_cli_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
