// ViewModel for PlatformsIndex (category index).
//
// Hand-authored — rjui's hook generator hasn't emitted a base for this
// yet. Simple seeder: builds the `articles` CollectionDataSource from a
// static catalog that mirrors ChromeViewModel's NAV_CATALOG for the same
// category so the sidebar and the index stay in lockstep.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PlatformsIndexData } from "@/generated/data/PlatformsIndexData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface ArticleCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  readTimeKey: string;
  statusKey: string;
  statusBackground: string;
  statusColor: string;
  cardOpacity: number;
  url: string;
  onNavigate: () => void;
}

const CATALOG: ReadonlyArray<{ id: string; url: string; titleKey: string }> = [
  { id: "swift", url: "/platforms/swift", titleKey: "platforms_swift_title" },
  { id: "kotlin", url: "/platforms/kotlin", titleKey: "platforms_kotlin_title" },
  { id: "react", url: "/platforms/react", titleKey: "platforms_rjui_title" }
];

export class PlatformsIndexViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => PlatformsIndexData;
  protected _setData: (d: PlatformsIndexData | ((p: PlatformsIndexData) => PlatformsIndexData)) => void;

  get data(): PlatformsIndexData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => PlatformsIndexData,
    setData: (d: PlatformsIndexData | ((p: PlatformsIndexData) => PlatformsIndexData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.onAppear();
  }

  updateData = (updates: Partial<PlatformsIndexData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<PlatformsIndexData>) => { this.updateData(vars); };

  onAppear = () => {
    const articles: ArticleCell[] = CATALOG.map((e) => ({
      id: e.id,
      titleKey: StringManager.getString(e.titleKey),
      descriptionKey: StringManager.getString(e.titleKey.replace(/_title$/, "_lead")),
      readTimeKey: "",
      statusKey: "",
      statusBackground: "#DCFCE7",
      statusColor: "#166534",
      cardOpacity: 1,
      url: e.url,
      onNavigate: () => this.navigate(e.url),
    }));
    this.updateData({
      articles: new CollectionDataSource([{ cells: { data: articles } }]),
    });
  };

  navigate = (url: string): void => { this.router.push(url); };
}
