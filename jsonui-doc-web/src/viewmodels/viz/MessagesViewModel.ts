// ViewModel for jui viz > Messages between sessions.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { MessagesData } from "@/generated/data/MessagesData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class MessagesViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => MessagesData;
  protected _setData: (
    data: MessagesData | ((prev: MessagesData) => MessagesData),
  ) => void;

  get data(): MessagesData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => MessagesData,
    setData: (
      data: MessagesData | ((prev: MessagesData) => MessagesData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<MessagesData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<MessagesData>) => { this.updateData(vars); };

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
        id: "next_sessions",
        titleKey: lookup("next_sessions_title"),
        descriptionKey: lookup("next_sessions_description"),
        url: "/viz/sessions",
        onNavigate: () => this.navigate("/viz/sessions"),
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
    StringManager.getString(`viz_messages_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_messages_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
