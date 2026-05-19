// ViewModel for Spec > Collection cell classes (Pattern 5 detail).

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CellClassesData } from "@/generated/data/CellClassesData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class CellClassesViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => CellClassesData;
  protected _setData: (
    data: CellClassesData | ((prev: CellClassesData) => CellClassesData),
  ) => void;

  get data(): CellClassesData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => CellClassesData,
    setData: (data: CellClassesData | ((prev: CellClassesData) => CellClassesData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<CellClassesData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<CellClassesData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateSpec: () => this.navigate("/spec/split-overview"),
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
        id: "next_custom_types",
        titleKey: lookup("next_custom_types_title"),
        descriptionKey: lookup("next_custom_types_description"),
        url: "/spec/custom-types",
        onNavigate: () => this.navigate("/spec/custom-types"),
      },
      {
        id: "next_split_overview",
        titleKey: lookup("next_split_overview_title"),
        descriptionKey: lookup("next_split_overview_description"),
        url: "/spec/split-overview",
        onNavigate: () => this.navigate("/spec/split-overview"),
      },
    ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`spec_cell_classes_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`spec_cell_classes_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
