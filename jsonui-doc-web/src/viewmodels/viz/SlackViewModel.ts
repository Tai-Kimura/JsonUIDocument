// ViewModel for jui viz > Slack intake.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SlackData } from "@/generated/data/SlackData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class SlackViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => SlackData;
  protected _setData: (
    data: SlackData | ((prev: SlackData) => SlackData),
  ) => void;

  get data(): SlackData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => SlackData,
    setData: (
      data: SlackData | ((prev: SlackData) => SlackData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<SlackData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<SlackData>) => { this.updateData(vars); };

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
        id: "next_messages",
        titleKey: lookup("next_messages_title"),
        descriptionKey: lookup("next_messages_description"),
        url: "/viz/messages",
        onNavigate: () => this.navigate("/viz/messages"),
      },
      {
        id: "next_slack_setup",
        titleKey: lookup("next_slack_setup_title"),
        descriptionKey: lookup("next_slack_setup_description"),
        url: "/viz/slack-setup",
        onNavigate: () => this.navigate("/viz/slack-setup"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`viz_slack_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_slack_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
