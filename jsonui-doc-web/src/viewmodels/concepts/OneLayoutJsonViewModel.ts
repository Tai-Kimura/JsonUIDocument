// ViewModel for Concepts > One Layout JSON per screen.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { OneLayoutJsonData } from "@/generated/data/OneLayoutJsonData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class OneLayoutJsonViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => OneLayoutJsonData;
  protected _setData: (
    data: OneLayoutJsonData | ((prev: OneLayoutJsonData) => OneLayoutJsonData),
  ) => void;

  get data(): OneLayoutJsonData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => OneLayoutJsonData,
    setData: (
      data: OneLayoutJsonData | ((prev: OneLayoutJsonData) => OneLayoutJsonData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<OneLayoutJsonData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<OneLayoutJsonData>) => {
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
    StringManager.getString(`concepts_one_layout_json_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
