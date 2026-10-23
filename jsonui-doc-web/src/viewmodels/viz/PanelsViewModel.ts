// ViewModel for jui viz > Panels, cards and boards.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PanelsData } from "@/generated/data/PanelsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class PanelsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => PanelsData;
  protected _setData: (
    data: PanelsData | ((prev: PanelsData) => PanelsData),
  ) => void;

  get data(): PanelsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => PanelsData,
    setData: (
      data: PanelsData | ((prev: PanelsData) => PanelsData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<PanelsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<PanelsData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateBack: () => this.navigate("/viz"),
    });
  };

  onAppear = () => {
    this.seed(this.sDefault);
  };

  mountLanguage = (): void => {
    this.seed(this.s);
  };

  private seed = (lookup: (key: string) => string): void => {
    this.updateData({
      nextReadLinks: this.asCollection(this.buildNextReads(lookup)),
    });
  };

  private buildNextReads = (lookup: (key: string) => string): NextReadCell[] => [
      {
        id: "next_index",
        titleKey: lookup("next_index_title"),
        descriptionKey: lookup("next_index_description"),
        url: "/viz",
        onNavigate: () => this.navigate("/viz"),
      },
      {
        id: "next_spirits",
        titleKey: lookup("next_spirits_title"),
        descriptionKey: lookup("next_spirits_description"),
        url: "/viz/spirits",
        onNavigate: () => this.navigate("/viz/spirits"),
      },
      {
        id: "next_sessions",
        titleKey: lookup("next_sessions_title"),
        descriptionKey: lookup("next_sessions_description"),
        url: "/viz/sessions",
        onNavigate: () => this.navigate("/viz/sessions"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`viz_panels_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_panels_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
