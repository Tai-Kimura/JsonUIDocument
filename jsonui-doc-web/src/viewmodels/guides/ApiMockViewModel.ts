// ViewModel for Guides > Mocking APIs in tests.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ApiMockData } from "@/generated/data/ApiMockData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ApiMockViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ApiMockData;
  protected _setData: (
    data: ApiMockData | ((prev: ApiMockData) => ApiMockData),
  ) => void;

  get data(): ApiMockData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => ApiMockData,
    setData: (data: ApiMockData | ((prev: ApiMockData) => ApiMockData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ApiMockData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ApiMockData>) => { this.updateData(vars); };

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
        id: "next_testing",
        titleKey: lookup("next_testing_title"),
        descriptionKey: lookup("next_testing_description"),
        url: "/guides/testing",
        onNavigate: () => this.navigate("/guides/testing"),
      },
      {
        id: "next_cli",
        titleKey: lookup("next_cli_title"),
        descriptionKey: lookup("next_cli_description"),
        url: "/reference/cli-commands",
        onNavigate: () => this.navigate("/reference/cli-commands"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_api_mock_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_api_mock_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
