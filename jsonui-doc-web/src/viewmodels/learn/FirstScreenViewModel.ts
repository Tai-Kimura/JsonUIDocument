// ViewModel for Learn > Your first screen.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { FirstScreenData } from "@/generated/data/FirstScreenData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class FirstScreenViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => FirstScreenData;
  protected _setData: (
    data: FirstScreenData | ((prev: FirstScreenData) => FirstScreenData),
  ) => void;

  get data(): FirstScreenData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => FirstScreenData,
    setData: (data: FirstScreenData | ((prev: FirstScreenData) => FirstScreenData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<FirstScreenData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<FirstScreenData>) => {
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
        id: "next_guides",
        titleKey: this.s("next_guides_title"),
        descriptionKey: this.s("next_guides_description"),
        url: "/guides/writing-your-first-spec",
        onNavigate: () => this.navigate("/guides/writing-your-first-spec"),
      },
      {
        id: "next_data_binding",
        titleKey: this.s("next_data_binding_title"),
        descriptionKey: this.s("next_data_binding_description"),
        url: "/learn/data-binding-basics",
        onNavigate: () => this.navigate("/learn/data-binding-basics"),
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
    StringManager.getString(`learn_first_screen_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
