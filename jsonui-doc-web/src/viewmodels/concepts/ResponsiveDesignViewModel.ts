// ViewModel for Concepts > Responsive design.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ResponsiveDesignData } from "@/generated/data/ResponsiveDesignData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ResponsiveDesignViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ResponsiveDesignData;
  protected _setData: (
    data: ResponsiveDesignData | ((prev: ResponsiveDesignData) => ResponsiveDesignData),
  ) => void;

  get data(): ResponsiveDesignData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => ResponsiveDesignData,
    setData: (
      data: ResponsiveDesignData | ((prev: ResponsiveDesignData) => ResponsiveDesignData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ResponsiveDesignData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ResponsiveDesignData>) => {
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
        id: "next_one_layout_json",
        titleKey: this.s("next_one_layout_json_title"),
        descriptionKey: this.s("next_one_layout_json_description"),
        url: "/concepts/one-layout-json",
        onNavigate: () => this.navigate("/concepts/one-layout-json"),
      },
      {
        id: "next_hot_reload",
        titleKey: this.s("next_hot_reload_title"),
        descriptionKey: this.s("next_hot_reload_description"),
        url: "/concepts/hot-reload",
        onNavigate: () => this.navigate("/concepts/hot-reload"),
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
    StringManager.getString(`concepts_responsive_design_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
