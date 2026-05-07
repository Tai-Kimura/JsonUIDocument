// ViewModel for Concepts > One Layout JSON per screen.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { OneLayoutJsonData } from "@/generated/data/OneLayoutJsonData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class OneLayoutJsonViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => OneLayoutJsonData;
  protected _setData: (
    data: OneLayoutJsonData | ((prev: OneLayoutJsonData) => OneLayoutJsonData),
  ) => void;

  get data(): OneLayoutJsonData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => OneLayoutJsonData,
    setData: (
      data: OneLayoutJsonData | ((prev: OneLayoutJsonData) => OneLayoutJsonData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<OneLayoutJsonData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<OneLayoutJsonData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateConcepts: () => this.navigate("/"),
    });
  };

  // SSR-safe initial seed (default-language). mountLanguage re-seeds with
  // persisted locale post-mount. See jsonui-cli/docs/bugs/reports/2026-05-08-
  // rjui-vm-pre-resolve-string-hydration-mismatch.md.
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
      id: "next_why_spec_first",
      titleKey: lookup("next_why_spec_first_title"),
      descriptionKey: lookup("next_why_spec_first_description"),
      url: "/concepts/why-spec-first",
      onNavigate: () => this.navigate("/concepts/why-spec-first"),
    },
    {
      id: "next_viewmodel",
      titleKey: lookup("next_viewmodel_title"),
      descriptionKey: lookup("next_viewmodel_description"),
      url: "/concepts/viewmodel-owned-state",
      onNavigate: () => this.navigate("/concepts/viewmodel-owned-state"),
    },
  ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`concepts_one_layout_json_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`concepts_one_layout_json_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
