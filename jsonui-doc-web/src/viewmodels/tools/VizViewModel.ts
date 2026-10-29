// ViewModel for Tools > jui viz — since 2026-10-24 a pointer to the /viz section.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { VizData } from "@/generated/data/VizData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class VizViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => VizData;
  protected _setData: (
    data: VizData | ((prev: VizData) => VizData),
  ) => void;

  get data(): VizData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => VizData,
    setData: (data: VizData | ((prev: VizData) => VizData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<VizData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<VizData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateTools: () => this.navigate("/tools"),
    });
  };

  onAppear = () => {
    this.updateData({ articleLinks: this.asCollection(this.buildArticles(this.sDefault)) });
  };

  mountLanguage = (): void => {
    this.updateData({ articleLinks: this.asCollection(this.buildArticles(this.s)) });
  };

  // The page now only points at the /viz section: one card per article.
  private buildArticles = (lookup: (key: string) => string): NextReadCell[] => [
    {
      id: "next_index",
      titleKey: lookup("next_index_title"),
      descriptionKey: lookup("next_index_description"),
      url: "/viz",
      onNavigate: () => this.navigate("/viz"),
    },
    {
      id: "next_setup",
      titleKey: lookup("next_setup_title"),
      descriptionKey: lookup("next_setup_description"),
      url: "/viz/setup",
      onNavigate: () => this.navigate("/viz/setup"),
    },
    {
      id: "next_codex",
      titleKey: lookup("next_codex_title"),
      descriptionKey: lookup("next_codex_description"),
      url: "/viz/codex",
      onNavigate: () => this.navigate("/viz/codex"),
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
      id: "next_messages",
      titleKey: lookup("next_messages_title"),
      descriptionKey: lookup("next_messages_description"),
      url: "/viz/messages",
      onNavigate: () => this.navigate("/viz/messages"),
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

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`tools_viz_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`tools_viz_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
