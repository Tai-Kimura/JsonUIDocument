// ViewModel for Guides > Colors and theming.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ColorsData } from "@/generated/data/ColorsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ColorsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ColorsData;
  protected _setData: (data: ColorsData | ((prev: ColorsData) => ColorsData)) => void;

  get data(): ColorsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => ColorsData,
    setData: (data: ColorsData | ((prev: ColorsData) => ColorsData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ColorsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ColorsData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateGuides: () => this.navigate("/guides"),
      onNavigateLocalization: () => this.navigate("/guides/localization"),
      onNavigateAttributesStyle: () => this.navigate("/reference/attributes/style"),
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
      id: "next_localization",
      titleKey: lookup("next_localization_title"),
      descriptionKey: lookup("next_localization_description"),
      url: "/guides/localization",
      onNavigate: () => this.navigate("/guides/localization"),
    },
    {
      id: "next_style",
      titleKey: lookup("next_style_title"),
      descriptionKey: lookup("next_style_description"),
      url: "/reference/attributes/style",
      onNavigate: () => this.navigate("/reference/attributes/style"),
    },
    {
      id: "next_rjui",
      titleKey: lookup("next_rjui_title"),
      descriptionKey: lookup("next_rjui_description"),
      url: "/platforms/react",
      onNavigate: () => this.navigate("/platforms/react"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_colors_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_colors_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
