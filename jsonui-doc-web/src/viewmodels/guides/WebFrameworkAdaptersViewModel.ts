// ViewModel for Guides > Web framework adapters.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WebFrameworkAdaptersData } from "@/generated/data/WebFrameworkAdaptersData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class WebFrameworkAdaptersViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => WebFrameworkAdaptersData;
  protected _setData: (
    data: WebFrameworkAdaptersData | ((prev: WebFrameworkAdaptersData) => WebFrameworkAdaptersData),
  ) => void;

  get data(): WebFrameworkAdaptersData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => WebFrameworkAdaptersData,
    setData: (
      data: WebFrameworkAdaptersData | ((prev: WebFrameworkAdaptersData) => WebFrameworkAdaptersData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<WebFrameworkAdaptersData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<WebFrameworkAdaptersData>) => { this.updateData(vars); };

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
      id: "next_rjui",
      titleKey: lookup("next_rjui_title"),
      descriptionKey: lookup("next_rjui_description"),
      url: "/platforms/react",
      onNavigate: () => this.navigate("/platforms/react"),
    },
    {
      id: "next_navigation",
      titleKey: lookup("next_navigation_title"),
      descriptionKey: lookup("next_navigation_description"),
      url: "/guides/navigation",
      onNavigate: () => this.navigate("/guides/navigation"),
    },
    {
      id: "next_jui_config",
      titleKey: lookup("next_jui_config_title"),
      descriptionKey: lookup("next_jui_config_description"),
      url: "/reference/jui-config",
      onNavigate: () => this.navigate("/reference/jui-config"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_web_framework_adapters_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_web_framework_adapters_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
