// ViewModel for Spec > Custom types (Pattern 4 detail).

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CustomTypesData } from "@/generated/data/CustomTypesData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class CustomTypesViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => CustomTypesData;
  protected _setData: (
    data: CustomTypesData | ((prev: CustomTypesData) => CustomTypesData),
  ) => void;

  get data(): CustomTypesData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => CustomTypesData,
    setData: (data: CustomTypesData | ((prev: CustomTypesData) => CustomTypesData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<CustomTypesData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<CustomTypesData>) => {
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
        id: "next_component_spec",
        titleKey: this.s("next_component_spec_title"),
        descriptionKey: this.s("next_component_spec_description"),
        url: "/spec/component-spec",
        onNavigate: () => this.navigate("/spec/component-spec"),
      },
      {
        id: "next_cell_classes",
        titleKey: this.s("next_cell_classes_title"),
        descriptionKey: this.s("next_cell_classes_description"),
        url: "/spec/cell-classes",
        onNavigate: () => this.navigate("/spec/cell-classes"),
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
    StringManager.getString(`spec_custom_types_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
