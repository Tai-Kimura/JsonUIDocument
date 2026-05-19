// ViewModel for Reference > CLI command reference.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CliCommandsData } from "@/generated/data/CliCommandsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class CliCommandsViewModel {
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
      onNavigateReference: () => this.navigate("/"),
    });
  };

  onAppear = () => {
    this.updateData({ nextReadLinks: this.asCollection(this.buildNextReads(this.sDefault)) });
  };

  mountLanguage = (): void => {
    this.updateData({ nextReadLinks: this.asCollection(this.buildNextReads(this.s)) });
  };

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
