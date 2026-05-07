// ViewModel for Guides > Adding a new language.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LocalizationData } from "@/generated/data/LocalizationData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class LocalizationViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => LocalizationData;
  protected _setData: (
    data: LocalizationData | ((prev: LocalizationData) => LocalizationData),
  ) => void;

  get data(): LocalizationData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => LocalizationData,
    setData: (data: LocalizationData | ((prev: LocalizationData) => LocalizationData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<LocalizationData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<LocalizationData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateGuides: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const nextReads: NextReadCell[] = [
      {
        id: "next_spec_first",
        titleKey: this.s("next_spec_first_title"),
        descriptionKey: this.s("next_spec_first_description"),
        url: "/guides/writing-your-first-spec",
        onNavigate: () => this.navigate("/guides/writing-your-first-spec"),
      },
      {
        id: "next_concepts_data_binding",
        titleKey: this.s("next_concepts_data_binding_title"),
        descriptionKey: this.s("next_concepts_data_binding_description"),
        url: "/concepts/data-binding",
        onNavigate: () => this.navigate("/concepts/data-binding"),
      },
    ];

    this.updateData({ nextReadLinks: this.asCollection(nextReads) });
  };

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`guides_localization_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
