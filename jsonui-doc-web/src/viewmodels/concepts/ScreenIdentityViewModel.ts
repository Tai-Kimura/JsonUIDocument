// ViewModel for Concepts > Screen identity and navigation assertion.
//
// Simple prose screen. Seeds three closing "read next" cards and handles the
// breadcrumb + language toggle. No state beyond re-seed on language flip.
// Mirrors DbSchemaCheckViewModel.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ScreenIdentityData } from "@/generated/data/ScreenIdentityData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ScreenIdentityViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ScreenIdentityData;
  protected _setData: (
    data: ScreenIdentityData | ((prev: ScreenIdentityData) => ScreenIdentityData),
  ) => void;

  get data(): ScreenIdentityData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => ScreenIdentityData,
    setData: (
      data:
        | ScreenIdentityData
        | ((prev: ScreenIdentityData) => ScreenIdentityData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ScreenIdentityData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ScreenIdentityData>) => {
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
      id: "next_testing",
      titleKey: lookup("next_testing_title"),
      descriptionKey: lookup("next_testing_description"),
      url: "/guides/testing",
      onNavigate: () => this.navigate("/guides/testing"),
    },
    {
      id: "next_composition",
      titleKey: lookup("next_composition_title"),
      descriptionKey: lookup("next_composition_description"),
      url: "/concepts/screen-composition",
      onNavigate: () => this.navigate("/concepts/screen-composition"),
    },
    {
      id: "next_responsive",
      titleKey: lookup("next_responsive_title"),
      descriptionKey: lookup("next_responsive_description"),
      url: "/concepts/responsive-design",
      onNavigate: () => this.navigate("/concepts/responsive-design"),
    },
  ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`concepts_screen_identity_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`concepts_screen_identity_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
