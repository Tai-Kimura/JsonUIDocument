// ViewModel for Guides > Following the user's text size.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TextSizeData } from "@/generated/data/TextSizeData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class TextSizeViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => TextSizeData;
  protected _setData: (
    data: TextSizeData | ((prev: TextSizeData) => TextSizeData),
  ) => void;

  get data(): TextSizeData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => TextSizeData,
    setData: (
      data: TextSizeData | ((prev: TextSizeData) => TextSizeData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<TextSizeData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<TextSizeData>) => { this.updateData(vars); };

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
      id: "next_readers",
      titleKey: lookup("next_readers_title"),
      descriptionKey: lookup("next_readers_description"),
      url: "/guides/screen-readers",
      onNavigate: () => this.navigate("/guides/screen-readers"),
    },
    {
      id: "next_reference",
      titleKey: lookup("next_reference_title"),
      descriptionKey: lookup("next_reference_description"),
      url: "/reference/components/label",
      onNavigate: () => this.navigate("/reference/components/label"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_text_size_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_text_size_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
