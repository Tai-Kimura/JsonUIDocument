// ViewModel for Guides > Developer menu.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DeveloperMenuData } from "@/generated/data/DeveloperMenuData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class DeveloperMenuViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => DeveloperMenuData;
  protected _setData: (
    data: DeveloperMenuData | ((prev: DeveloperMenuData) => DeveloperMenuData),
  ) => void;

  get data(): DeveloperMenuData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => DeveloperMenuData,
    setData: (data: DeveloperMenuData | ((prev: DeveloperMenuData) => DeveloperMenuData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<DeveloperMenuData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<DeveloperMenuData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateGuides: () => this.navigate("/"),
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
        id: "next_navigation",
        titleKey: lookup("next_navigation_title"),
        descriptionKey: lookup("next_navigation_description"),
        url: "/guides/navigation",
        onNavigate: () => this.navigate("/guides/navigation"),
      },
      {
        id: "next_writing_layouts",
        titleKey: lookup("next_writing_layouts_title"),
        descriptionKey: lookup("next_writing_layouts_description"),
        url: "/guides/writing-layouts",
        onNavigate: () => this.navigate("/guides/writing-layouts"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_developer_menu_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_developer_menu_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
