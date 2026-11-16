// ViewModel for jui viz > Server room.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ServerRoomData } from "@/generated/data/ServerRoomData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ServerRoomViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ServerRoomData;
  protected _setData: (
    data: ServerRoomData | ((prev: ServerRoomData) => ServerRoomData),
  ) => void;

  get data(): ServerRoomData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => ServerRoomData,
    setData: (
      data: ServerRoomData | ((prev: ServerRoomData) => ServerRoomData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ServerRoomData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ServerRoomData>) => { this.updateData(vars); };

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
        id: "next_tests",
        titleKey: lookup("next_tests_title"),
        descriptionKey: lookup("next_tests_description"),
        url: "/viz/tests",
        onNavigate: () => this.navigate("/viz/tests"),
      },
      {
        id: "next_infra_model",
        titleKey: lookup("next_infra_model_title"),
        descriptionKey: lookup("next_infra_model_description"),
        url: "/viz/infra-model",
        onNavigate: () => this.navigate("/viz/infra-model"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`viz_server_room_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_server_room_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
