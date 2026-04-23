// ViewModel for Concepts > ViewModel-owned state.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ViewmodelOwnedStateData } from "@/generated/data/ViewmodelOwnedStateData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ViewmodelOwnedStateViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ViewmodelOwnedStateData;
  protected _setData: (
    data: ViewmodelOwnedStateData | ((prev: ViewmodelOwnedStateData) => ViewmodelOwnedStateData),
  ) => void;

  get data(): ViewmodelOwnedStateData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => ViewmodelOwnedStateData,
    setData: (
      data: ViewmodelOwnedStateData | ((prev: ViewmodelOwnedStateData) => ViewmodelOwnedStateData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ViewmodelOwnedStateData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ViewmodelOwnedStateData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateConcepts: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const nextReads: NextReadCell[] = [
      {
        id: "next_data_binding",
        titleKey: this.s("next_data_binding_title"),
        descriptionKey: this.s("next_data_binding_description"),
        url: "/concepts/data-binding",
        onNavigate: () => this.navigate("/concepts/data-binding"),
      },
      {
        id: "next_hot_reload",
        titleKey: this.s("next_hot_reload_title"),
        descriptionKey: this.s("next_hot_reload_description"),
        url: "/concepts/hot-reload",
        onNavigate: () => this.navigate("/concepts/hot-reload"),
      },
    ];

    this.updateData({
      nextReadLinks: this.asCollection(nextReads),
    });
  };

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`concepts_viewmodel_owned_state_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
