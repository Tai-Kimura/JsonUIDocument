// ViewModel for Guides > Contract gaps.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ContractGapsData } from "@/generated/data/ContractGapsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ContractGapsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ContractGapsData;
  protected _setData: (
    data: ContractGapsData | ((prev: ContractGapsData) => ContractGapsData),
  ) => void;

  get data(): ContractGapsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => ContractGapsData,
    setData: (
      data: ContractGapsData | ((prev: ContractGapsData) => ContractGapsData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ContractGapsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ContractGapsData>) => { this.updateData(vars); };

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
      id: "next_tests",
      titleKey: lookup("next_tests_title"),
      descriptionKey: lookup("next_tests_description"),
      url: "/guides/branch-tests",
      onNavigate: () => this.navigate("/guides/branch-tests"),
    },
    {
      id: "next_unit",
      titleKey: lookup("next_unit_title"),
      descriptionKey: lookup("next_unit_description"),
      url: "/guides/unit-contracts",
      onNavigate: () => this.navigate("/guides/unit-contracts"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_contract_gaps_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_contract_gaps_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
