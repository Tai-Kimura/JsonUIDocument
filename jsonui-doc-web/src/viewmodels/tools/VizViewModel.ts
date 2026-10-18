// ViewModel for Tools > jui viz.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { VizData } from "@/generated/data/VizData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class VizViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => VizData;
  protected _setData: (
    data: VizData | ((prev: VizData) => VizData),
  ) => void;

  get data(): VizData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => VizData,
    setData: (data: VizData | ((prev: VizData) => VizData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<VizData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<VizData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateTools: () => this.navigate("/tools"),
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
        id: "next_agents",
        titleKey: lookup("next_agents_title"),
        descriptionKey: lookup("next_agents_description"),
        url: "/tools/agents",
        onNavigate: () => this.navigate("/tools/agents"),
      },
    ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`tools_viz_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`tools_viz_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
