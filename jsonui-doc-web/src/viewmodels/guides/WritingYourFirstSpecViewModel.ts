// ViewModel for Guides > Writing your first spec.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WritingYourFirstSpecData } from "@/generated/data/WritingYourFirstSpecData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class WritingYourFirstSpecViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => WritingYourFirstSpecData;
  protected _setData: (
    data:
      | WritingYourFirstSpecData
      | ((prev: WritingYourFirstSpecData) => WritingYourFirstSpecData),
  ) => void;

  get data(): WritingYourFirstSpecData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => WritingYourFirstSpecData,
    setData: (
      data:
        | WritingYourFirstSpecData
        | ((prev: WritingYourFirstSpecData) => WritingYourFirstSpecData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<WritingYourFirstSpecData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<WritingYourFirstSpecData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateGuides: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const nextReads: NextReadCell[] = [
      {
        id: "next_navigation",
        titleKey: this.s("next_navigation_title"),
        descriptionKey: this.s("next_navigation_description"),
        url: "/guides/navigation",
        onNavigate: () => this.navigate("/guides/navigation"),
      },
      {
        id: "next_testing",
        titleKey: this.s("next_testing_title"),
        descriptionKey: this.s("next_testing_description"),
        url: "/guides/testing",
        onNavigate: () => this.navigate("/guides/testing"),
      },
      {
        id: "next_spec",
        titleKey: this.s("next_spec_title"),
        descriptionKey: this.s("next_spec_description"),
        url: "/spec/split-overview",
        onNavigate: () => this.navigate("/spec/split-overview"),
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
    StringManager.getString(`guides_writing_your_first_spec_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
