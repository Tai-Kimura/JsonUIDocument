// ViewModel for Guides > Branch tests.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { BranchTestsData } from "@/generated/data/BranchTestsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class BranchTestsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => BranchTestsData;
  protected _setData: (
    data: BranchTestsData | ((prev: BranchTestsData) => BranchTestsData),
  ) => void;

  get data(): BranchTestsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => BranchTestsData,
    setData: (
      data: BranchTestsData | ((prev: BranchTestsData) => BranchTestsData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<BranchTestsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<BranchTestsData>) => { this.updateData(vars); };

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
      id: "next_contracts",
      titleKey: lookup("next_contracts_title"),
      descriptionKey: lookup("next_contracts_description"),
      url: "/guides/branch-contracts",
      onNavigate: () => this.navigate("/guides/branch-contracts"),
    },
    {
      id: "next_testing",
      titleKey: lookup("next_testing_title"),
      descriptionKey: lookup("next_testing_description"),
      url: "/guides/testing",
      onNavigate: () => this.navigate("/guides/testing"),
    },
    {
      id: "next_verifying",
      titleKey: lookup("next_verifying_title"),
      descriptionKey: lookup("next_verifying_description"),
      url: "/guides/verifying-implementation-against-docs",
      onNavigate: () => this.navigate("/guides/verifying-implementation-against-docs"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_branch_tests_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_branch_tests_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
