// ViewModel for Learn > Data binding basics.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DataBindingBasicsData } from "@/generated/data/DataBindingBasicsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class DataBindingBasicsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => DataBindingBasicsData;
  protected _setData: (
    data: DataBindingBasicsData | ((prev: DataBindingBasicsData) => DataBindingBasicsData),
  ) => void;

  get data(): DataBindingBasicsData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => DataBindingBasicsData,
    setData: (
      data: DataBindingBasicsData | ((prev: DataBindingBasicsData) => DataBindingBasicsData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<DataBindingBasicsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<DataBindingBasicsData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateLearn: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const nextReads: NextReadCell[] = [
      {
        id: "next_concepts_data_binding",
        titleKey: this.s("next_concepts_data_binding_title"),
        descriptionKey: this.s("next_concepts_data_binding_description"),
        url: "/concepts/data-binding",
        onNavigate: () => this.navigate("/concepts/data-binding"),
      },
      {
        id: "next_first_screen",
        titleKey: this.s("next_first_screen_title"),
        descriptionKey: this.s("next_first_screen_description"),
        url: "/learn/first-screen",
        onNavigate: () => this.navigate("/learn/first-screen"),
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
    StringManager.getString(`learn_data_binding_basics_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
