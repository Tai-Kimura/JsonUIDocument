// ViewModel for Spec > Component specs (Pattern 3 detail).

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ComponentSpecData } from "@/generated/data/ComponentSpecData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ComponentSpecViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ComponentSpecData;
  protected _setData: (
    data: ComponentSpecData | ((prev: ComponentSpecData) => ComponentSpecData),
  ) => void;

  get data(): ComponentSpecData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => ComponentSpecData,
    setData: (data: ComponentSpecData | ((prev: ComponentSpecData) => ComponentSpecData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ComponentSpecData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ComponentSpecData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateSpec: () => this.navigate("/spec/split-overview"),
    });
  };

  onAppear = () => {
    const nextReads: NextReadCell[] = [
      {
        id: "next_parent_sub_spec",
        titleKey: this.s("next_parent_sub_spec_title"),
        descriptionKey: this.s("next_parent_sub_spec_description"),
        url: "/spec/parent-sub-spec",
        onNavigate: () => this.navigate("/spec/parent-sub-spec"),
      },
      {
        id: "next_custom_types",
        titleKey: this.s("next_custom_types_title"),
        descriptionKey: this.s("next_custom_types_description"),
        url: "/spec/custom-types",
        onNavigate: () => this.navigate("/spec/custom-types"),
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
    StringManager.getString(`spec_component_spec_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
