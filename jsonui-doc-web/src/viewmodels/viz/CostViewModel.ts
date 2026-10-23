// ViewModel for jui viz > Cost and migration.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CostData } from "@/generated/data/CostData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class CostViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => CostData;
  protected _setData: (
    data: CostData | ((prev: CostData) => CostData),
  ) => void;

  get data(): CostData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => CostData,
    setData: (
      data: CostData | ((prev: CostData) => CostData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<CostData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<CostData>) => { this.updateData(vars); };

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
        id: "next_infra_model",
        titleKey: lookup("next_infra_model_title"),
        descriptionKey: lookup("next_infra_model_description"),
        url: "/viz/infra-model",
        onNavigate: () => this.navigate("/viz/infra-model"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`viz_cost_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_cost_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
