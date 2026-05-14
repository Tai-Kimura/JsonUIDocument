// ViewModel for Concepts > Screen composition.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ScreenCompositionData } from "@/generated/data/ScreenCompositionData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ScreenCompositionViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ScreenCompositionData;
  protected _setData: (
    data: ScreenCompositionData | ((prev: ScreenCompositionData) => ScreenCompositionData),
  ) => void;

  get data(): ScreenCompositionData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => ScreenCompositionData,
    setData: (
      data: ScreenCompositionData | ((prev: ScreenCompositionData) => ScreenCompositionData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ScreenCompositionData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ScreenCompositionData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateConcepts: () => this.navigate("/"),
    });
  };

  // SSR-safe initial seed. mountLanguage re-seeds with persisted locale
  // post-mount. See jsonui-cli/docs/bugs/reports/2026-05-08-rjui-vm-pre-
  // resolve-string-hydration-mismatch.md.
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
      id: "next_viewmodel_owned_state",
      titleKey: lookup("next_viewmodel_owned_state_title"),
      descriptionKey: lookup("next_viewmodel_owned_state_description"),
      url: "/concepts/viewmodel-owned-state",
      onNavigate: () => this.navigate("/concepts/viewmodel-owned-state"),
    },
    {
      id: "next_embed_reference",
      titleKey: lookup("next_embed_reference_title"),
      descriptionKey: lookup("next_embed_reference_description"),
      url: "/reference/components/embed",
      onNavigate: () => this.navigate("/reference/components/embed"),
    },
  ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`concepts_screen_composition_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`concepts_screen_composition_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
