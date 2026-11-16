// ViewModel for Concepts > DB schema check (docs/db ⇔ live DB).
//
// Simple prose screen. Seeds three closing "read next" cards and handles the
// breadcrumb + language toggle. No state beyond re-seed on language flip.
// Mirrors ImplementationContractCheckViewModel.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DbSchemaCheckData } from "@/generated/data/DbSchemaCheckData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class DbSchemaCheckViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => DbSchemaCheckData;
  protected _setData: (
    data: DbSchemaCheckData | ((prev: DbSchemaCheckData) => DbSchemaCheckData),
  ) => void;

  get data(): DbSchemaCheckData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => DbSchemaCheckData,
    setData: (
      data: DbSchemaCheckData | ((prev: DbSchemaCheckData) => DbSchemaCheckData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<DbSchemaCheckData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<DbSchemaCheckData>) => {
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
      id: "next_contract",
      titleKey: lookup("next_contract_title"),
      descriptionKey: lookup("next_contract_description"),
      url: "/concepts/implementation-contract-check",
      onNavigate: () => this.navigate("/concepts/implementation-contract-check"),
    },
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
    StringManager.getString(`concepts_db_schema_check_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`concepts_db_schema_check_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
