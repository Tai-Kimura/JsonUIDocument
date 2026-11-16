// ViewModel for Guides > Unit contracts.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { UnitContractsData } from "@/generated/data/UnitContractsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class UnitContractsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => UnitContractsData;
  protected _setData: (
    data: UnitContractsData | ((prev: UnitContractsData) => UnitContractsData),
  ) => void;

  get data(): UnitContractsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => UnitContractsData,
    setData: (
      data: UnitContractsData | ((prev: UnitContractsData) => UnitContractsData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<UnitContractsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<UnitContractsData>) => { this.updateData(vars); };

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
      id: "next_testing",
      titleKey: lookup("next_testing_title"),
      descriptionKey: lookup("next_testing_description"),
      url: "/guides/testing",
      onNavigate: () => this.navigate("/guides/testing"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_unit_contracts_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_unit_contracts_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
