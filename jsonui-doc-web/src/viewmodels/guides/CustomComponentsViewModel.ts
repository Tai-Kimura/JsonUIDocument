// ViewModel for Guides > Building a custom component.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CustomComponentsData } from "@/generated/data/CustomComponentsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class CustomComponentsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => CustomComponentsData;
  protected _setData: (
    data: CustomComponentsData | ((prev: CustomComponentsData) => CustomComponentsData),
  ) => void;

  get data(): CustomComponentsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => CustomComponentsData,
    setData: (data: CustomComponentsData | ((prev: CustomComponentsData) => CustomComponentsData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<CustomComponentsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<CustomComponentsData>) => { this.updateData(vars); };

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
        id: "next_writing_layouts",
        titleKey: lookup("next_writing_layouts_title"),
        descriptionKey: lookup("next_writing_layouts_description"),
        url: "/guides/writing-layouts",
        onNavigate: () => this.navigate("/guides/writing-layouts"),
      },
      {
        id: "next_spec_first",
        titleKey: lookup("next_spec_first_title"),
        descriptionKey: lookup("next_spec_first_description"),
        url: "/guides/writing-your-first-spec",
        onNavigate: () => this.navigate("/guides/writing-your-first-spec"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_custom_components_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_custom_components_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
