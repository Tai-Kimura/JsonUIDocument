// ViewModel for Guides > Writing screen tests.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TestingData } from "@/generated/data/TestingData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class TestingViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => TestingData;
  protected _setData: (
    data: TestingData | ((prev: TestingData) => TestingData),
  ) => void;

  get data(): TestingData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => TestingData,
    setData: (data: TestingData | ((prev: TestingData) => TestingData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<TestingData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<TestingData>) => { this.updateData(vars); };

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
        id: "next_test_runner",
        titleKey: lookup("next_test_runner_title"),
        descriptionKey: lookup("next_test_runner_description"),
        url: "/tools/test-runner",
        onNavigate: () => this.navigate("/tools/test-runner"),
      },
      {
        id: "next_navigation",
        titleKey: lookup("next_navigation_title"),
        descriptionKey: lookup("next_navigation_description"),
        url: "/guides/navigation",
        onNavigate: () => this.navigate("/guides/navigation"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_testing_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_testing_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
