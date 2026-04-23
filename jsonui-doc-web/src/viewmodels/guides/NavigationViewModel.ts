// ViewModel for Guides > Navigation between screens.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NavigationData } from "@/generated/data/NavigationData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class NavigationViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => NavigationData;
  protected _setData: (
    data: NavigationData | ((prev: NavigationData) => NavigationData),
  ) => void;

  get data(): NavigationData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => NavigationData,
    setData: (data: NavigationData | ((prev: NavigationData) => NavigationData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<NavigationData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<NavigationData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateGuides: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const nextReads: NextReadCell[] = [
      {
        id: "next_spec_first",
        titleKey: this.s("next_spec_first_title"),
        descriptionKey: this.s("next_spec_first_description"),
        url: "/guides/writing-your-first-spec",
        onNavigate: () => this.navigate("/guides/writing-your-first-spec"),
      },
      {
        id: "next_testing",
        titleKey: this.s("next_testing_title"),
        descriptionKey: this.s("next_testing_description"),
        url: "/guides/testing",
        onNavigate: () => this.navigate("/guides/testing"),
      },
    ];

    this.updateData({ nextReadLinks: this.asCollection(nextReads) });
  };

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_navigation_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
