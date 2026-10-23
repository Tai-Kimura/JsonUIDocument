// ViewModel for jui viz > Set up.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SetupData } from "@/generated/data/SetupData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class SetupViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => SetupData;
  protected _setData: (
    data: SetupData | ((prev: SetupData) => SetupData),
  ) => void;

  get data(): SetupData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => SetupData,
    setData: (
      data: SetupData | ((prev: SetupData) => SetupData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<SetupData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<SetupData>) => { this.updateData(vars); };

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
        id: "next_room",
        titleKey: lookup("next_room_title"),
        descriptionKey: lookup("next_room_description"),
        url: "/viz/room",
        onNavigate: () => this.navigate("/viz/room"),
      },
    ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`viz_setup_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`viz_setup_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
