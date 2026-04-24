// ViewModel for Spec > The anatomy of a screen spec.
//
// Spec: docs/screens/json/spec/anatomy.spec.json
// Hand-written (no ViewModelBase — the article VMs under Spec follow the
// same direct-class pattern the Concepts essays use).

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AnatomyData } from "@/generated/data/AnatomyData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class AnatomyViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => AnatomyData;
  protected _setData: (
    data: AnatomyData | ((prev: AnatomyData) => AnatomyData),
  ) => void;

  get data(): AnatomyData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => AnatomyData,
    setData: (
      data: AnatomyData | ((prev: AnatomyData) => AnatomyData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<AnatomyData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<AnatomyData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateSpec: () => this.navigate("/spec/anatomy"),
    });
  };

  onAppear = () => {
    const nextReads: NextReadCell[] = [
      {
        id: "next_split_overview",
        titleKey: this.s("next_split_overview_title"),
        descriptionKey: this.s("next_split_overview_description"),
        url: "/spec/split-overview",
        onNavigate: () => this.navigate("/spec/split-overview"),
      },
      {
        id: "next_writing_your_first_spec",
        titleKey: this.s("next_writing_your_first_spec_title"),
        descriptionKey: this.s("next_writing_your_first_spec_description"),
        url: "/guides/writing-your-first-spec",
        onNavigate: () => this.navigate("/guides/writing-your-first-spec"),
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
    StringManager.getString(`spec_anatomy_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
