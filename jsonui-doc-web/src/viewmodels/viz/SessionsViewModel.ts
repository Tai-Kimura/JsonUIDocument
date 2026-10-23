// ViewModel for jui viz > Talk, prompts and notifications.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SessionsData } from "@/generated/data/SessionsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class SessionsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => SessionsData;
  protected _setData: (
    data: SessionsData | ((prev: SessionsData) => SessionsData),
  ) => void;

  get data(): SessionsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => SessionsData,
    setData: (
      data: SessionsData | ((prev: SessionsData) => SessionsData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<SessionsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<SessionsData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateBack: () => this.navigate("/viz"),
    });
  };

  onAppear = () => {
    this.seed(this.sDefault);
  };

  mountLanguage = (): void => {
    this.seed(this.s);
  };

  private seed = (lookup: (key: string) => string): void => {
    this.updateData({
      nextReadLinks: this.asCollection(this.buildNextReads(lookup)),
    });
  };

  private buildNextReads = (lookup: (key: string) => string): NextReadCell[] => [
      {
        id: "next_index",
        titleKey: lookup("next_index_title"),
        descriptionKey: lookup("next_index_description"),
        url: "/viz",
        onNavigate: () => this.navigate("/viz"),
      },
      {
        id: "next_panels",
        titleKey: lookup("next_panels_title"),
        descriptionKey: lookup("next_panels_description"),
        url: "/viz/panels",
        onNavigate: () => this.navigate("/viz/panels"),
      },
      {
        id: "next_approvals",
        titleKey: lookup("next_approvals_title"),
        descriptionKey: lookup("next_approvals_description"),
        url: "/viz/approvals",
        onNavigate: () => this.navigate("/viz/approvals"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`viz_sessions_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_sessions_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
