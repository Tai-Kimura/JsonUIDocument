// ViewModel for ConceptsIndex (category index).
//
// Hand-authored — rjui's hook generator hasn't emitted a base for this
// yet. Simple seeder: builds the `articles` CollectionDataSource from a
// static catalog that mirrors ChromeViewModel's NAV_CATALOG for the same
// category so the sidebar and the index stay in lockstep.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ConceptsIndexData } from "@/generated/data/ConceptsIndexData";
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
  { id: "why-spec-first", url: "/concepts/why-spec-first", titleKey: "concepts_why_spec_first_title" },
  { id: "one-layout-json", url: "/concepts/one-layout-json", titleKey: "concepts_one_layout_json_title" },
  { id: "viewmodel-owned-state", url: "/concepts/viewmodel-owned-state", titleKey: "concepts_viewmodel_owned_state_title" },
  { id: "data-binding", url: "/concepts/data-binding", titleKey: "concepts_data_binding_title" },
  { id: "hot-reload", url: "/concepts/hot-reload", titleKey: "concepts_hot_reload_title" },
  { id: "responsive-design", url: "/concepts/responsive-design", titleKey: "concepts_responsive_design_title" },
  { id: "screen-composition", url: "/concepts/screen-composition", titleKey: "concepts_screen_composition_title" },
  { id: "implementation-contract-check", url: "/concepts/implementation-contract-check", titleKey: "concepts_implementation_contract_check_title" },
  { id: "db-schema-check", url: "/concepts/db-schema-check", titleKey: "concepts_db_schema_check_title" }
];

export class ConceptsIndexViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ConceptsIndexData;
  protected _setData: (d: ConceptsIndexData | ((p: ConceptsIndexData) => ConceptsIndexData)) => void;

  get data(): ConceptsIndexData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => ConceptsIndexData,
    setData: (d: ConceptsIndexData | ((p: ConceptsIndexData) => ConceptsIndexData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.onAppear();
  }

  updateData = (updates: Partial<ConceptsIndexData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ConceptsIndexData>) => { this.updateData(vars); };

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
