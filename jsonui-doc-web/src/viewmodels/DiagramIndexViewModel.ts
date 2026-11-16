// ViewModel for DiagramIndex (category index).
//
// Hand-authored, on the GuidesIndexViewModel pattern: builds the `articles`
// CollectionDataSource from a static catalog that mirrors ChromeViewModel's
// NAV_CATALOG for the same category so the sidebar and the index stay in
// lockstep.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DiagramIndexData } from "@/generated/data/DiagramIndexData";
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
  { id: "from-specs", url: "/diagram/from-specs", titleKey: "diagram_from_specs_title" },
];

export class DiagramIndexViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => DiagramIndexData;
  protected _setData: (d: DiagramIndexData | ((p: DiagramIndexData) => DiagramIndexData)) => void;

  get data(): DiagramIndexData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => DiagramIndexData,
    setData: (d: DiagramIndexData | ((p: DiagramIndexData) => DiagramIndexData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.onAppear();
  }

  updateData = (updates: Partial<DiagramIndexData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<DiagramIndexData>) => { this.updateData(vars); };

  onAppear = () => {
    this.updateData({
      articles: new CollectionDataSource([{ cells: { data: this.buildArticles((k) => StringManager.getDefaultString(k)) } }]),
    });
  };

  mountLanguage = (): void => {
    this.updateData({
      articles: new CollectionDataSource([{ cells: { data: this.buildArticles((k) => StringManager.getString(k)) } }]),
    });
  };

  private buildArticles = (lookup: (key: string) => string): ArticleCell[] =>
    CATALOG.map((e) => ({
      id: e.id,
      titleKey: lookup(e.titleKey),
      descriptionKey: lookup(e.titleKey.replace(/_title$/, "_lead")),
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

  navigate = (url: string): void => { this.router.push(url); };
}
