// ViewModel for jui viz > Codex sessions.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CodexData } from "@/generated/data/CodexData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class CodexViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => CodexData;
  protected _setData: (
    data: CodexData | ((prev: CodexData) => CodexData),
  ) => void;

  get data(): CodexData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => CodexData,
    setData: (
      data: CodexData | ((prev: CodexData) => CodexData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<CodexData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<CodexData>) => { this.updateData(vars); };

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
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`viz_codex_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_codex_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
