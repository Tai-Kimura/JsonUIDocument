// ViewModel for Tools > test-runner.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TestRunnerData } from "@/generated/data/TestRunnerData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class TestRunnerViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => TestRunnerData;
  protected _setData: (
    data: TestRunnerData | ((prev: TestRunnerData) => TestRunnerData),
  ) => void;

  get data(): TestRunnerData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => TestRunnerData,
    setData: (data: TestRunnerData | ((prev: TestRunnerData) => TestRunnerData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<TestRunnerData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<TestRunnerData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateTools: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const nextReads: NextReadCell[] = [
      {
        id: "next_cli",
        titleKey: this.s("next_cli_title"),
        descriptionKey: this.s("next_cli_description"),
        url: "/tools/cli",
        onNavigate: () => this.navigate("/tools/cli"),
      },
      {
        id: "next_testing_guide",
        titleKey: this.s("next_testing_guide_title"),
        descriptionKey: this.s("next_testing_guide_description"),
        url: "/guides/testing",
        onNavigate: () => this.navigate("/guides/testing"),
      },
    ];

    this.updateData({
      nextReadLinks: this.asCollection(nextReads),
    });
  };

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`tools_test_runner_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
