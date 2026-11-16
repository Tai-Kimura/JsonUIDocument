// ViewModel for Reference > jui.config.json.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { JuiConfigData } from "@/generated/data/JuiConfigData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class JuiConfigViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => JuiConfigData;
  protected _setData: (
    data: JuiConfigData | ((prev: JuiConfigData) => JuiConfigData),
  ) => void;

  get data(): JuiConfigData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => JuiConfigData,
    setData: (data: JuiConfigData | ((prev: JuiConfigData) => JuiConfigData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<JuiConfigData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<JuiConfigData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateReference: () => this.navigate("/reference"),
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
        url: "/reference/cli-commands",
        onNavigate: () => this.navigate("/reference/cli-commands"),
      },
      {
        id: "next_db_check",
        titleKey: lookup("next_db_check_title"),
        descriptionKey: lookup("next_db_check_description"),
        url: "/concepts/db-schema-check",
        onNavigate: () => this.navigate("/concepts/db-schema-check"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`reference_jui_config_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`reference_jui_config_${key}`);

  private asCollection<T>(data: T[]) {
    return new CollectionDataSource([{ cells: { data } }]);
  }
}
