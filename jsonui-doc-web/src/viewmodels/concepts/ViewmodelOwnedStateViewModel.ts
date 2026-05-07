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

  // SSR-safe initial seed (default-language). mountLanguage re-seeds with
  // persisted locale post-mount. See jsonui-cli/docs/bugs/reports/2026-05-08-
  // rjui-vm-pre-resolve-string-hydration-mismatch.md.
  onAppear = () => {
    this.updateData({
      nextReadLinks: this.asCollection(this.buildNextReads(this.sDefault)),
    });
  };

  mountLanguage = (): void => {
    this.updateData({
      nextReadLinks: this.asCollection(this.buildNextReads(this.s)),
    });
  };

  private buildNextReads = (lookup: (key: string) => string): NextReadCell[] => [
    {
      id: "next_data_binding",
      titleKey: lookup("next_data_binding_title"),
      descriptionKey: lookup("next_data_binding_description"),
      url: "/concepts/data-binding",
      onNavigate: () => this.navigate("/concepts/data-binding"),
    },
    {
      id: "next_hot_reload",
      titleKey: lookup("next_hot_reload_title"),
      descriptionKey: lookup("next_hot_reload_description"),
      url: "/concepts/hot-reload",
      onNavigate: () => this.navigate("/concepts/hot-reload"),
    },
  ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`concepts_viewmodel_owned_state_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`concepts_viewmodel_owned_state_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
