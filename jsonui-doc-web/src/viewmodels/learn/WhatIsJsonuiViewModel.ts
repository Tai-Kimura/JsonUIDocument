// ViewModel for Learn > What is JsonUI?.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WhatIsJsonuiData } from "@/generated/data/WhatIsJsonuiData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class WhatIsJsonuiViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => WhatIsJsonuiData;
  protected _setData: (
    data: WhatIsJsonuiData | ((prev: WhatIsJsonuiData) => WhatIsJsonuiData),
  ) => void;

  get data(): WhatIsJsonuiData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => WhatIsJsonuiData,
    setData: (data: WhatIsJsonuiData | ((prev: WhatIsJsonuiData) => WhatIsJsonuiData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<WhatIsJsonuiData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<WhatIsJsonuiData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateLearn: () => this.navigate("/"),
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
        id: "next_installation",
        titleKey: lookup("next_installation_title"),
        descriptionKey: lookup("next_installation_description"),
        url: "/learn/installation",
        onNavigate: () => this.navigate("/learn/installation"),
      },
      {
        id: "next_hello_world",
        titleKey: lookup("next_hello_world_title"),
        descriptionKey: lookup("next_hello_world_description"),
        url: "/learn/hello-world",
        onNavigate: () => this.navigate("/learn/hello-world"),
      },
    ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`learn_what_is_jsonui_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`learn_what_is_jsonui_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
