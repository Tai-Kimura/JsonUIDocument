// ViewModel for Platforms > ReactJsonUI (layout basename: rjui to avoid 'React' name collision).

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { RjuiData } from "@/generated/data/RjuiData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class RjuiViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => RjuiData;
  protected _setData: (
    data: RjuiData | ((prev: RjuiData) => RjuiData),
  ) => void;

  get data(): RjuiData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => RjuiData,
    setData: (data: RjuiData | ((prev: RjuiData) => RjuiData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<RjuiData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<RjuiData>) => { this.updateData(vars); };

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
        id: "next_swift",
        titleKey: lookup("next_swift_title"),
        descriptionKey: lookup("next_swift_description"),
        url: "/platforms/swift",
        onNavigate: () => this.navigate("/platforms/swift"),
      },
      {
        id: "next_kotlin",
        titleKey: lookup("next_kotlin_title"),
        descriptionKey: lookup("next_kotlin_description"),
        url: "/platforms/kotlin",
        onNavigate: () => this.navigate("/platforms/kotlin"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`platforms_rjui_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`platforms_rjui_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
