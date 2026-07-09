// ViewModel for Reference > Test tooling reference.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TestToolingData } from "@/generated/data/TestToolingData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class TestToolingViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => TestToolingData;
  protected _setData: (
    data: TestToolingData | ((prev: TestToolingData) => TestToolingData),
  ) => void;

  get data(): TestToolingData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => TestToolingData,
    setData: (data: TestToolingData | ((prev: TestToolingData) => TestToolingData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<TestToolingData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<TestToolingData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateReference: () => this.navigate("/"),
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
        id: "next_api_mock",
        titleKey: lookup("next_api_mock_title"),
        descriptionKey: lookup("next_api_mock_description"),
        url: "/guides/api-mock",
        onNavigate: () => this.navigate("/guides/api-mock"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`reference_test_tooling_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`reference_test_tooling_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
