// ViewModel for GuidesIndex (category index).
//
// Hand-authored — rjui's hook generator hasn't emitted a base for this
// yet. Simple seeder: builds the `articles` CollectionDataSource from a
// static catalog that mirrors ChromeViewModel's NAV_CATALOG for the same
// category so the sidebar and the index stay in lockstep.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { GuidesIndexData } from "@/generated/data/GuidesIndexData";
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
  platforms: string;
  platformsVisibility: "visible" | "gone";
  onNavigate: () => void;
}

const CATALOG: ReadonlyArray<{ id: string; url: string; titleKey: string; platforms?: string }> = [
  { id: "writing-your-first-spec", url: "/guides/writing-your-first-spec", titleKey: "guides_writing_your_first_spec_title" },
  { id: "writing-layouts", url: "/guides/writing-layouts", titleKey: "guides_writing_layouts_title" },
  { id: "navigation", url: "/guides/navigation", titleKey: "guides_navigation_title" },
  { id: "testing", url: "/guides/testing", titleKey: "guides_testing_title" },
  { id: "localization", url: "/guides/localization", titleKey: "guides_localization_title" },
  { id: "custom-components", url: "/guides/custom-components", titleKey: "guides_custom_components_title" },
  { id: "developer-menu", url: "/guides/developer-menu", titleKey: "guides_developer_menu_title", platforms: "iOS · Android" }
];

export class GuidesIndexViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => GuidesIndexData;
  protected _setData: (d: GuidesIndexData | ((p: GuidesIndexData) => GuidesIndexData)) => void;

  get data(): GuidesIndexData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => GuidesIndexData,
    setData: (d: GuidesIndexData | ((p: GuidesIndexData) => GuidesIndexData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.onAppear();
  }

  updateData = (updates: Partial<GuidesIndexData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<GuidesIndexData>) => { this.updateData(vars); };

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
      platforms: e.platforms ?? "",
      platformsVisibility: e.platforms ? "visible" : "gone",
      onNavigate: () => this.navigate(e.url),
    }));
    this.updateData({
      articles: new CollectionDataSource([{ cells: { data: articles } }]),
    });
  };

  navigate = (url: string): void => { this.router.push(url); };
}
