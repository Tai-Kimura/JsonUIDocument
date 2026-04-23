// ViewModel for Concepts > Why spec-first.
//
// Short-essay screen. Seeds two closing "read next" cards and handles the
// breadcrumb + language toggle. No state beyond private currentLanguage for
// re-seed on language flip.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WhySpecFirstData } from "@/generated/data/WhySpecFirstData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class WhySpecFirstViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => WhySpecFirstData;
  protected _setData: (
    data: WhySpecFirstData | ((prev: WhySpecFirstData) => WhySpecFirstData),
  ) => void;

  get data(): WhySpecFirstData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => WhySpecFirstData,
    setData: (
      data: WhySpecFirstData | ((prev: WhySpecFirstData) => WhySpecFirstData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<WhySpecFirstData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<WhySpecFirstData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateConcepts: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const nextReads: NextReadCell[] = [
      {
        id: "next_data_binding",
        titleKey: this.s("next_data_binding_title"),
        descriptionKey: this.s("next_data_binding_description"),
        url: "/concepts/data-binding",
        onNavigate: () => this.navigate("/concepts/data-binding"),
      },
      {
        id: "next_one_layout",
        titleKey: this.s("next_one_layout_title"),
        descriptionKey: this.s("next_one_layout_description"),
        url: "/concepts/one-layout-json",
        onNavigate: () => this.navigate("/concepts/one-layout-json"),
      },
    ];

    this.updateData({
      nextReadLinks: this.asCollection(nextReads),
    });
  };

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`concepts_why_spec_first_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
