// ViewModel for Guides > Referencing the API canon from a spec.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CanonicalMarksData } from "@/generated/data/CanonicalMarksData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class CanonicalMarksViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => CanonicalMarksData;
  protected _setData: (
    data: CanonicalMarksData | ((prev: CanonicalMarksData) => CanonicalMarksData),
  ) => void;

  get data(): CanonicalMarksData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => CanonicalMarksData,
    setData: (
      data: CanonicalMarksData | ((prev: CanonicalMarksData) => CanonicalMarksData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<CanonicalMarksData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<CanonicalMarksData>) => { this.updateData(vars); };

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
      id: "next_api_models",
      titleKey: lookup("next_api_models_title"),
      descriptionKey: lookup("next_api_models_description"),
      url: "/guides/api-data-models",
      onNavigate: () => this.navigate("/guides/api-data-models"),
    },
    {
      id: "next_verifying",
      titleKey: lookup("next_verifying_title"),
      descriptionKey: lookup("next_verifying_description"),
      url: "/guides/verifying-implementation-against-docs",
      onNavigate: () => this.navigate("/guides/verifying-implementation-against-docs"),
    },
    {
      id: "next_first_spec",
      titleKey: lookup("next_first_spec_title"),
      descriptionKey: lookup("next_first_spec_description"),
      url: "/guides/writing-your-first-spec",
      onNavigate: () => this.navigate("/guides/writing-your-first-spec"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_canonical_marks_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_canonical_marks_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
