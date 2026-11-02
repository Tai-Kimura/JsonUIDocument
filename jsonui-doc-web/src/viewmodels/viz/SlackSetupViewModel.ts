// ViewModel for jui viz > Slack setup.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SlackSetupData } from "@/generated/data/SlackSetupData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class SlackSetupViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => SlackSetupData;
  protected _setData: (
    data: SlackSetupData | ((prev: SlackSetupData) => SlackSetupData),
  ) => void;

  get data(): SlackSetupData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => SlackSetupData,
    setData: (
      data: SlackSetupData | ((prev: SlackSetupData) => SlackSetupData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<SlackSetupData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<SlackSetupData>) => { this.updateData(vars); };

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
        id: "next_slack",
        titleKey: lookup("next_slack_title"),
        descriptionKey: lookup("next_slack_description"),
        url: "/viz/slack",
        onNavigate: () => this.navigate("/viz/slack"),
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
    StringManager.getString(`viz_slack_setup_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_slack_setup_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
