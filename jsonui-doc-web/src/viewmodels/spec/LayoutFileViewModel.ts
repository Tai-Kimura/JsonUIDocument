// ViewModel for Spec > Separating the layout file (Pattern 1 detail).

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LayoutFileData } from "@/generated/data/LayoutFileData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class LayoutFileViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => LayoutFileData;
  protected _setData: (
    data: LayoutFileData | ((prev: LayoutFileData) => LayoutFileData),
  ) => void;

  get data(): LayoutFileData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => LayoutFileData,
    setData: (data: LayoutFileData | ((prev: LayoutFileData) => LayoutFileData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<LayoutFileData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<LayoutFileData>) => {
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
        id: "next_split_overview",
        titleKey: this.s("next_split_overview_title"),
        descriptionKey: this.s("next_split_overview_description"),
        url: "/spec/split-overview",
        onNavigate: () => this.navigate("/spec/split-overview"),
      },
      {
        id: "next_parent_sub_spec",
        titleKey: this.s("next_parent_sub_spec_title"),
        descriptionKey: this.s("next_parent_sub_spec_description"),
        url: "/spec/parent-sub-spec",
        onNavigate: () => this.navigate("/spec/parent-sub-spec"),
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
    StringManager.getString(`spec_layout_file_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
