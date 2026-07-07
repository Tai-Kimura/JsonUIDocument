// ViewModel for Concepts > Implementation contract check.
//
// Simple prose screen. Seeds two closing "read next" cards and handles the
// breadcrumb + language toggle. No state beyond private currentLanguage for
// re-seed on language flip. Mirrors OneLayoutJsonViewModel.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ImplementationContractCheckData } from "@/generated/data/ImplementationContractCheckData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ImplementationContractCheckViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ImplementationContractCheckData;
  protected _setData: (
    data:
      | ImplementationContractCheckData
      | ((prev: ImplementationContractCheckData) => ImplementationContractCheckData),
  ) => void;

  get data(): ImplementationContractCheckData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => ImplementationContractCheckData,
    setData: (
      data:
        | ImplementationContractCheckData
        | ((prev: ImplementationContractCheckData) => ImplementationContractCheckData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ImplementationContractCheckData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ImplementationContractCheckData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateConcepts: () => this.navigate("/concepts"),
    });
  };

  onAppear = () => {
    this.updateData({
      nextReadLinks: this.asCollection(this.buildNextReads(this.sDefault)),
    });
  };

  mountLanguage = (): void => {
    this.updateData({
      nextReadLinks: this.asCollection(this.buildNextReads(this.s)),
    });
  };

  private buildNextReads = (lookup: (key: string) => string): NextReadCell[] => [
    {
      id: "next_verify_guide",
      titleKey: lookup("next_verify_guide_title"),
      descriptionKey: lookup("next_verify_guide_description"),
      url: "/guides/verifying-implementation-against-docs",
      onNavigate: () =>
        this.navigate("/guides/verifying-implementation-against-docs"),
    },
    {
      id: "next_cli_reference",
      titleKey: lookup("next_cli_reference_title"),
      descriptionKey: lookup("next_cli_reference_description"),
      url: "/reference/cli-commands",
      onNavigate: () => this.navigate("/reference/cli-commands"),
    },
  ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`concepts_implementation_contract_check_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(
      `concepts_implementation_contract_check_${key}`,
    );

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
