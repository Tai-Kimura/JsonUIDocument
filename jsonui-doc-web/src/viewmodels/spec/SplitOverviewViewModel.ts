// ViewModel for Spec > Five ways to split a spec.
//
// Spec: docs/screens/json/spec/split-overview.spec.json
// Hand-written (no ViewModelBase — same pattern as AnatomyViewModel and the
// Concepts essay VMs).

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SplitOverviewData } from "@/generated/data/SplitOverviewData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class SplitOverviewViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => SplitOverviewData;
  protected _setData: (
    data: SplitOverviewData | ((prev: SplitOverviewData) => SplitOverviewData),
  ) => void;

  get data(): SplitOverviewData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => SplitOverviewData,
    setData: (
      data: SplitOverviewData | ((prev: SplitOverviewData) => SplitOverviewData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<SplitOverviewData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<SplitOverviewData>) => {
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
        id: "next_anatomy",
        titleKey: this.s("next_anatomy_title"),
        descriptionKey: this.s("next_anatomy_description"),
        url: "/spec/anatomy",
        onNavigate: () => this.navigate("/spec/anatomy"),
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
    StringManager.getString(`spec_split_overview_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
