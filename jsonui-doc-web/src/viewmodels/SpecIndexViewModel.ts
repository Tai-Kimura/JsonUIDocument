// ViewModel for SpecIndex (category index).
//
// Hand-authored — rjui's hook generator hasn't emitted a base for this
// yet. Simple seeder: builds the `articles` CollectionDataSource from a
// static catalog that mirrors ChromeViewModel's NAV_CATALOG for the same
// category so the sidebar and the index stay in lockstep.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SpecIndexData } from "@/generated/data/SpecIndexData";
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

const CATALOG: ReadonlyArray<{ id: string; url: string; titleKey: string }> = [
  { id: "anatomy",              url: "/spec/anatomy",              titleKey: "spec_anatomy_title" },
  { id: "split-overview",       url: "/spec/split-overview",       titleKey: "spec_split_overview_title" },
  { id: "layout-file",          url: "/spec/layout-file",          titleKey: "spec_layout_file_title" },
  { id: "parent-sub-spec",      url: "/spec/parent-sub-spec",      titleKey: "spec_parent_sub_spec_title" },
  { id: "component-spec",       url: "/spec/component-spec",       titleKey: "spec_component_spec_title" },
  { id: "custom-types",         url: "/spec/custom-types",         titleKey: "spec_custom_types_title" },
  { id: "cell-classes",         url: "/spec/cell-classes",         titleKey: "spec_cell_classes_title" },
  { id: "validation-and-drift", url: "/spec/validation-and-drift", titleKey: "spec_validation_and_drift_title" }
];

export class SpecIndexViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => SpecIndexData;
  protected _setData: (d: SpecIndexData | ((p: SpecIndexData) => SpecIndexData)) => void;

  get data(): SpecIndexData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => SpecIndexData,
    setData: (d: SpecIndexData | ((p: SpecIndexData) => SpecIndexData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.onAppear();
  }

  updateData = (updates: Partial<SpecIndexData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<SpecIndexData>) => { this.updateData(vars); };

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
      platforms: "",
      platformsVisibility: "gone",
      onNavigate: () => this.navigate(e.url),
    }));

  navigate = (url: string): void => { this.router.push(url); };
}
