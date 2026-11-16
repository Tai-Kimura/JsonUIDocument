// ViewModel for Flow diagram > Drawn from the specs.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { FromSpecsData } from "@/generated/data/FromSpecsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class FromSpecsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => FromSpecsData;
  protected _setData: (
    data: FromSpecsData | ((prev: FromSpecsData) => FromSpecsData),
  ) => void;

  get data(): FromSpecsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => FromSpecsData,
    setData: (
      data: FromSpecsData | ((prev: FromSpecsData) => FromSpecsData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<FromSpecsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<FromSpecsData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateDiagram: () => this.navigate("/diagram"),
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
      id: "next_navigation",
      titleKey: lookup("next_navigation_title"),
      descriptionKey: lookup("next_navigation_description"),
      url: "/guides/navigation",
      onNavigate: () => this.navigate("/guides/navigation"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`diagram_from_specs_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`diagram_from_specs_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
