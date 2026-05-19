// ViewModel for Guides > Writing layouts.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WritingLayoutsData } from "@/generated/data/WritingLayoutsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class WritingLayoutsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => WritingLayoutsData;
  protected _setData: (
    data: WritingLayoutsData | ((prev: WritingLayoutsData) => WritingLayoutsData),
  ) => void;

  get data(): WritingLayoutsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => WritingLayoutsData,
    setData: (data: WritingLayoutsData | ((prev: WritingLayoutsData) => WritingLayoutsData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<WritingLayoutsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<WritingLayoutsData>) => { this.updateData(vars); };

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
        id: "next_developer_menu",
        titleKey: lookup("next_developer_menu_title"),
        descriptionKey: lookup("next_developer_menu_description"),
        url: "/guides/developer-menu",
        onNavigate: () => this.navigate("/guides/developer-menu"),
      },
      {
        id: "next_first_spec",
        titleKey: lookup("next_first_spec_title"),
        descriptionKey: lookup("next_first_spec_description"),
        url: "/guides/writing-your-first-spec",
        onNavigate: () => this.navigate("/guides/writing-your-first-spec"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_writing_layouts_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_writing_layouts_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
