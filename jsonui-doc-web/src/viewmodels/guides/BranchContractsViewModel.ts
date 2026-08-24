// ViewModel for Guides > Branch contracts.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { BranchContractsData } from "@/generated/data/BranchContractsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class BranchContractsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => BranchContractsData;
  protected _setData: (
    data: BranchContractsData | ((prev: BranchContractsData) => BranchContractsData),
  ) => void;

  get data(): BranchContractsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => BranchContractsData,
    setData: (
      data: BranchContractsData | ((prev: BranchContractsData) => BranchContractsData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<BranchContractsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<BranchContractsData>) => { this.updateData(vars); };

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
      id: "next_first_spec",
      titleKey: lookup("next_first_spec_title"),
      descriptionKey: lookup("next_first_spec_description"),
      url: "/guides/writing-your-first-spec",
      onNavigate: () => this.navigate("/guides/writing-your-first-spec"),
    },
    {
      id: "next_verifying",
      titleKey: lookup("next_verifying_title"),
      descriptionKey: lookup("next_verifying_description"),
      url: "/guides/verifying-implementation-against-docs",
      onNavigate: () => this.navigate("/guides/verifying-implementation-against-docs"),
    },
    {
      id: "next_testing",
      titleKey: lookup("next_testing_title"),
      descriptionKey: lookup("next_testing_description"),
      url: "/guides/testing",
      onNavigate: () => this.navigate("/guides/testing"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_branch_contracts_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_branch_contracts_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
