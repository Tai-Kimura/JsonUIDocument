// ViewModel for jui viz > Watching tests.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TestsData } from "@/generated/data/TestsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class TestsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => TestsData;
  protected _setData: (
    data: TestsData | ((prev: TestsData) => TestsData),
  ) => void;

  get data(): TestsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => TestsData,
    setData: (
      data: TestsData | ((prev: TestsData) => TestsData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<TestsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<TestsData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateBack: () => this.navigate("/viz"),
    });
  };

  onAppear = () => {
    this.seed(this.sDefault);
  };

  mountLanguage = (): void => {
    this.seed(this.s);
  };

  private seed = (lookup: (key: string) => string): void => {
    this.updateData({
      nextReadLinks: this.asCollection(this.buildNextReads(lookup)),
    });
  };

  private buildNextReads = (lookup: (key: string) => string): NextReadCell[] => [
      {
        id: "next_index",
        titleKey: lookup("next_index_title"),
        descriptionKey: lookup("next_index_description"),
        url: "/viz",
        onNavigate: () => this.navigate("/viz"),
      },
      {
        id: "next_approvals",
        titleKey: lookup("next_approvals_title"),
        descriptionKey: lookup("next_approvals_description"),
        url: "/viz/approvals",
        onNavigate: () => this.navigate("/viz/approvals"),
      },
      {
        id: "next_server_room",
        titleKey: lookup("next_server_room_title"),
        descriptionKey: lookup("next_server_room_description"),
        url: "/viz/server-room",
        onNavigate: () => this.navigate("/viz/server-room"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`viz_tests_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_tests_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
