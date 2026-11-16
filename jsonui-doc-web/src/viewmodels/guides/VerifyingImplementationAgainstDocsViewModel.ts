// ViewModel for Guides > Verifying implementation against docs.
//
// Cookbook screen. Seeds two closing "read next" cards and handles the
// breadcrumb + language toggle. No state beyond private currentLanguage for
// re-seed on language flip. Mirrors OneLayoutJsonViewModel.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { VerifyingImplementationAgainstDocsData } from "@/generated/data/VerifyingImplementationAgainstDocsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class VerifyingImplementationAgainstDocsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => VerifyingImplementationAgainstDocsData;
  protected _setData: (
    data:
      | VerifyingImplementationAgainstDocsData
      | ((
          prev: VerifyingImplementationAgainstDocsData,
        ) => VerifyingImplementationAgainstDocsData),
  ) => void;

  get data(): VerifyingImplementationAgainstDocsData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => VerifyingImplementationAgainstDocsData,
    setData: (
      data:
        | VerifyingImplementationAgainstDocsData
        | ((
            prev: VerifyingImplementationAgainstDocsData,
          ) => VerifyingImplementationAgainstDocsData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<VerifyingImplementationAgainstDocsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<VerifyingImplementationAgainstDocsData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateGuides: () => this.navigate("/guides"),
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
      id: "next_concept",
      titleKey: lookup("next_concept_title"),
      descriptionKey: lookup("next_concept_description"),
      url: "/concepts/implementation-contract-check",
      onNavigate: () =>
        this.navigate("/concepts/implementation-contract-check"),
    },
    {
      id: "next_api_cookbook",
      titleKey: lookup("next_api_cookbook_title"),
      descriptionKey: lookup("next_api_cookbook_description"),
      url: "/guides/api-data-models",
      onNavigate: () => this.navigate("/guides/api-data-models"),
    },
  ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(
      `guides_verifying_implementation_against_docs_${key}`,
    );

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(
      `guides_verifying_implementation_against_docs_${key}`,
    );

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
