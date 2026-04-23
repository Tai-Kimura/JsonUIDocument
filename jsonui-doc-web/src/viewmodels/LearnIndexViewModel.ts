// ViewModel for LearnIndex (category index).
//
// Hand-authored — rjui's hook generator hasn't emitted a base for this
// yet. Simple seeder: builds the `articles` CollectionDataSource from a
// static catalog that mirrors ChromeViewModel's NAV_CATALOG for the same
// category so the sidebar and the index stay in lockstep.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LearnIndexData } from "@/generated/data/LearnIndexData";
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
  { id: "installation", url: "/learn/installation", titleKey: "learn_installation_title" },
  { id: "hello-world", url: "/learn/hello-world", titleKey: "learn_hello_world_title" },
  { id: "first-screen", url: "/learn/first-screen", titleKey: "learn_first_screen_title" },
  { id: "data-binding", url: "/learn/data-binding-basics", titleKey: "learn_data_binding_basics_title" },
  { id: "what-is-jsonui", url: "/learn/what-is-jsonui", titleKey: "learn_what_is_jsonui_title" }
];

export class LearnIndexViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => LearnIndexData;
  protected _setData: (d: LearnIndexData | ((p: LearnIndexData) => LearnIndexData)) => void;

  get data(): LearnIndexData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => LearnIndexData,
    setData: (d: LearnIndexData | ((p: LearnIndexData) => LearnIndexData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.onAppear();
  }

  updateData = (updates: Partial<LearnIndexData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<LearnIndexData>) => { this.updateData(vars); };

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
