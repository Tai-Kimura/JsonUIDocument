// ViewModel for Platforms > Swift.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SwiftData } from "@/generated/data/SwiftData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class SwiftViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => SwiftData;
  protected _setData: (
    data: SwiftData | ((prev: SwiftData) => SwiftData),
  ) => void;

  get data(): SwiftData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => SwiftData,
    setData: (data: SwiftData | ((prev: SwiftData) => SwiftData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<SwiftData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<SwiftData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigatePlatforms: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const nextReads: NextReadCell[] = [
      {
        id: "next_kotlin",
        titleKey: this.s("next_kotlin_title"),
        descriptionKey: this.s("next_kotlin_description"),
        url: "/platforms/kotlin",
        onNavigate: () => this.navigate("/platforms/kotlin"),
      },
      {
        id: "next_react",
        titleKey: this.s("next_react_title"),
        descriptionKey: this.s("next_react_description"),
        url: "/platforms/react",
        onNavigate: () => this.navigate("/platforms/react"),
      },
    ];

    this.updateData({ nextReadLinks: this.asCollection(nextReads) });
  };

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`platforms_swift_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
