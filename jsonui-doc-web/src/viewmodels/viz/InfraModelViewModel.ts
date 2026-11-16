// ViewModel for jui viz > Infra model.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { InfraModelData } from "@/generated/data/InfraModelData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class InfraModelViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => InfraModelData;
  protected _setData: (
    data: InfraModelData | ((prev: InfraModelData) => InfraModelData),
  ) => void;

  get data(): InfraModelData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => InfraModelData,
    setData: (
      data: InfraModelData | ((prev: InfraModelData) => InfraModelData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<InfraModelData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<InfraModelData>) => { this.updateData(vars); };

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
        id: "next_server_room",
        titleKey: lookup("next_server_room_title"),
        descriptionKey: lookup("next_server_room_description"),
        url: "/viz/server-room",
        onNavigate: () => this.navigate("/viz/server-room"),
      },
      {
        id: "next_cost",
        titleKey: lookup("next_cost_title"),
        descriptionKey: lookup("next_cost_description"),
        url: "/viz/cost",
        onNavigate: () => this.navigate("/viz/cost"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`viz_infra_model_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_infra_model_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
