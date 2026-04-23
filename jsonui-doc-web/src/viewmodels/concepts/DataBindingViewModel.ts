// ViewModel for Concepts > Data binding as contract.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DataBindingData } from "@/generated/data/DataBindingData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class DataBindingViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => DataBindingData;
  protected _setData: (
    data: DataBindingData | ((prev: DataBindingData) => DataBindingData),
  ) => void;

  get data(): DataBindingData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => DataBindingData,
    setData: (
      data: DataBindingData | ((prev: DataBindingData) => DataBindingData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<DataBindingData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<DataBindingData>) => {
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
        id: "next_why_spec_first",
        titleKey: this.s("next_why_spec_first_title"),
        descriptionKey: this.s("next_why_spec_first_description"),
        url: "/concepts/why-spec-first",
        onNavigate: () => this.navigate("/concepts/why-spec-first"),
      },
      {
        id: "next_viewmodel",
        titleKey: this.s("next_viewmodel_title"),
        descriptionKey: this.s("next_viewmodel_description"),
        url: "/concepts/viewmodel-owned-state",
        onNavigate: () => this.navigate("/concepts/viewmodel-owned-state"),
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
    StringManager.getString(`concepts_data_binding_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
