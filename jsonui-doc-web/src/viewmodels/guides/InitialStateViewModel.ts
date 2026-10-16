// ViewModel for Guides > Initial state.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { InitialStateData } from "@/generated/data/InitialStateData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class InitialStateViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => InitialStateData;
  protected _setData: (
    data: InitialStateData | ((prev: InitialStateData) => InitialStateData),
  ) => void;

  get data(): InitialStateData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => InitialStateData,
    setData: (
      data: InitialStateData | ((prev: InitialStateData) => InitialStateData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<InitialStateData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<InitialStateData>) => { this.updateData(vars); };

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
      id: "next_testing",
      titleKey: lookup("next_testing_title"),
      descriptionKey: lookup("next_testing_description"),
      url: "/guides/testing",
      onNavigate: () => this.navigate("/guides/testing"),
    },
    {
      id: "next_identity",
      titleKey: lookup("next_identity_title"),
      descriptionKey: lookup("next_identity_description"),
      url: "/concepts/screen-identity",
      onNavigate: () => this.navigate("/concepts/screen-identity"),
    },
    {
      id: "next_tooling",
      titleKey: lookup("next_tooling_title"),
      descriptionKey: lookup("next_tooling_description"),
      url: "/reference/test-tooling",
      onNavigate: () => this.navigate("/reference/test-tooling"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_initial_state_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`guides_initial_state_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
