// ViewModel for Tools > Helper (VS Code extension).

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { HelperData } from "@/generated/data/HelperData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class HelperViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => HelperData;
  protected _setData: (
    data: HelperData | ((prev: HelperData) => HelperData),
  ) => void;

  get data(): HelperData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => HelperData,
    setData: (data: HelperData | ((prev: HelperData) => HelperData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<HelperData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<HelperData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateTools: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const nextReads: NextReadCell[] = [
      {
        id: "next_cli",
        titleKey: this.s("next_cli_title"),
        descriptionKey: this.s("next_cli_description"),
        url: "/tools/cli",
        onNavigate: () => this.navigate("/tools/cli"),
      },
      {
        id: "next_installation",
        titleKey: this.s("next_installation_title"),
        descriptionKey: this.s("next_installation_description"),
        url: "/learn/installation",
        onNavigate: () => this.navigate("/learn/installation"),
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
    StringManager.getString(`tools_helper_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
