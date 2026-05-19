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
    this.updateData({ nextReadLinks: this.asCollection(this.buildNextReads(this.sDefault)) });
  };

  mountLanguage = (): void => {
    this.updateData({ nextReadLinks: this.asCollection(this.buildNextReads(this.s)) });
  };

  private buildNextReads = (lookup: (key: string) => string): NextReadCell[] => [
      {
        id: "next_kotlin",
        titleKey: lookup("next_kotlin_title"),
        descriptionKey: lookup("next_kotlin_description"),
        url: "/platforms/kotlin",
        onNavigate: () => this.navigate("/platforms/kotlin"),
      },
      {
        id: "next_react",
        titleKey: lookup("next_react_title"),
        descriptionKey: lookup("next_react_description"),
        url: "/platforms/react",
        onNavigate: () => this.navigate("/platforms/react"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`platforms_swift_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`platforms_swift_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
