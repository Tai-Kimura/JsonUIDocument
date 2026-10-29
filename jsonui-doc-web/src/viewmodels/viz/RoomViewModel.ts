// ViewModel for jui viz > The room and its robots.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { RoomData } from "@/generated/data/RoomData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class RoomViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => RoomData;
  protected _setData: (
    data: RoomData | ((prev: RoomData) => RoomData),
  ) => void;

  get data(): RoomData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => RoomData,
    setData: (
      data: RoomData | ((prev: RoomData) => RoomData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<RoomData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<RoomData>) => { this.updateData(vars); };

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
        id: "next_codex",
        titleKey: lookup("next_codex_title"),
        descriptionKey: lookup("next_codex_description"),
        url: "/viz/codex",
        onNavigate: () => this.navigate("/viz/codex"),
      },
      {
        id: "next_spirits",
        titleKey: lookup("next_spirits_title"),
        descriptionKey: lookup("next_spirits_description"),
        url: "/viz/spirits",
        onNavigate: () => this.navigate("/viz/spirits"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`viz_room_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_room_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
