// ViewModel for Platforms > Kotlin.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { KotlinData } from "@/generated/data/KotlinData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class KotlinViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => KotlinData;
  protected _setData: (
    data: KotlinData | ((prev: KotlinData) => KotlinData),
  ) => void;

  get data(): KotlinData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => KotlinData,
    setData: (data: KotlinData | ((prev: KotlinData) => KotlinData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<KotlinData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<KotlinData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigatePlatforms: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const nextReads: NextReadCell[] = [
      {
        id: "next_swift",
        titleKey: this.s("next_swift_title"),
        descriptionKey: this.s("next_swift_description"),
        url: "/platforms/swift",
        onNavigate: () => this.navigate("/platforms/swift"),
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
    StringManager.getString(`platforms_kotlin_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
