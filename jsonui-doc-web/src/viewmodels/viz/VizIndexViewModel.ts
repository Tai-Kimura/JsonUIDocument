// ViewModel for jui viz > Overview.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { VizIndexData } from "@/generated/data/VizIndexData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class VizIndexViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => VizIndexData;
  protected _setData: (
    data: VizIndexData | ((prev: VizIndexData) => VizIndexData),
  ) => void;

  get data(): VizIndexData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => VizIndexData,
    setData: (
      data: VizIndexData | ((prev: VizIndexData) => VizIndexData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<VizIndexData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<VizIndexData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateBack: () => this.navigate("/tools"),
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
      articleLinks: this.asCollection(this.buildArticles(lookup)),
    });
  };

  private buildNextReads = (lookup: (key: string) => string): NextReadCell[] => [
      {
        id: "next_setup",
        titleKey: lookup("next_setup_title"),
        descriptionKey: lookup("next_setup_description"),
        url: "/viz/setup",
        onNavigate: () => this.navigate("/viz/setup"),
      },
    ];

  private buildArticles = (lookup: (key: string) => string): NextReadCell[] => [
      {
        id: "next_setup",
        titleKey: lookup("next_setup_title"),
        descriptionKey: lookup("next_setup_description"),
        url: "/viz/setup",
        onNavigate: () => this.navigate("/viz/setup"),
      },
      {
        id: "next_room",
        titleKey: lookup("next_room_title"),
        descriptionKey: lookup("next_room_description"),
        url: "/viz/room",
        onNavigate: () => this.navigate("/viz/room"),
      },
      {
        id: "next_spirits",
        titleKey: lookup("next_spirits_title"),
        descriptionKey: lookup("next_spirits_description"),
        url: "/viz/spirits",
        onNavigate: () => this.navigate("/viz/spirits"),
      },
      {
        id: "next_panels",
        titleKey: lookup("next_panels_title"),
        descriptionKey: lookup("next_panels_description"),
        url: "/viz/panels",
        onNavigate: () => this.navigate("/viz/panels"),
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
      {
        id: "next_tests",
        titleKey: lookup("next_tests_title"),
        descriptionKey: lookup("next_tests_description"),
        url: "/viz/tests",
        onNavigate: () => this.navigate("/viz/tests"),
      },
      {
        id: "next_server_room",
        titleKey: lookup("next_server_room_title"),
        descriptionKey: lookup("next_server_room_description"),
        url: "/viz/server-room",
        onNavigate: () => this.navigate("/viz/server-room"),
      },
      {
        id: "next_infra_model",
        titleKey: lookup("next_infra_model_title"),
        descriptionKey: lookup("next_infra_model_description"),
        url: "/viz/infra-model",
        onNavigate: () => this.navigate("/viz/infra-model"),
      },
      {
        id: "next_cost",
        titleKey: lookup("next_cost_title"),
        descriptionKey: lookup("next_cost_description"),
        url: "/viz/cost",
        onNavigate: () => this.navigate("/viz/cost"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`viz_index_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_index_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
