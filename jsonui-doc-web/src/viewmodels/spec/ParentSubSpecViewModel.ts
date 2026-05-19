// ViewModel for Spec > Parent + sub specs (Pattern 2 detail).

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ParentSubSpecData } from "@/generated/data/ParentSubSpecData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ParentSubSpecViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ParentSubSpecData;
  protected _setData: (
    data: ParentSubSpecData | ((prev: ParentSubSpecData) => ParentSubSpecData),
  ) => void;

  get data(): ParentSubSpecData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => ParentSubSpecData,
    setData: (data: ParentSubSpecData | ((prev: ParentSubSpecData) => ParentSubSpecData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ParentSubSpecData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ParentSubSpecData>) => {
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
        id: "next_layout_file",
        titleKey: lookup("next_layout_file_title"),
        descriptionKey: lookup("next_layout_file_description"),
        url: "/spec/layout-file",
        onNavigate: () => this.navigate("/spec/layout-file"),
      },
      {
        id: "next_component_spec",
        titleKey: lookup("next_component_spec_title"),
        descriptionKey: lookup("next_component_spec_description"),
        url: "/spec/component-spec",
        onNavigate: () => this.navigate("/spec/component-spec"),
      },
    ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`spec_parent_sub_spec_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`spec_parent_sub_spec_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
