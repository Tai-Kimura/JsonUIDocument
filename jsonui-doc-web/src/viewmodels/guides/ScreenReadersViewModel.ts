// ViewModel for Guides > Screen readers.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ScreenReadersData } from "@/generated/data/ScreenReadersData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ScreenReadersViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ScreenReadersData;
  protected _setData: (
    data: ScreenReadersData | ((prev: ScreenReadersData) => ScreenReadersData),
  ) => void;

  get data(): ScreenReadersData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => ScreenReadersData,
    setData: (
      data: ScreenReadersData | ((prev: ScreenReadersData) => ScreenReadersData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ScreenReadersData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ScreenReadersData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateGuides: () => this.navigate("/guides"),
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
      id: "next_layouts",
      titleKey: lookup("next_layouts_title"),
      descriptionKey: lookup("next_layouts_description"),
      url: "/guides/writing-layouts",
      onNavigate: () => this.navigate("/guides/writing-layouts"),
    },
    {
      id: "next_localization",
      titleKey: lookup("next_localization_title"),
      descriptionKey: lookup("next_localization_description"),
      url: "/guides/localization",
      onNavigate: () => this.navigate("/guides/localization"),
    },
    {
      id: "next_testing",
      titleKey: lookup("next_testing_title"),
      descriptionKey: lookup("next_testing_description"),
      url: "/guides/testing",
      onNavigate: () => this.navigate("/guides/testing"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_screen_readers_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_screen_readers_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
