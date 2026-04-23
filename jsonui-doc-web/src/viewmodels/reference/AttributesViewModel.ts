// ViewModel for Reference > Attribute reference.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AttributesData } from "@/generated/data/AttributesData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface CatalogCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

interface NextReadCell extends CatalogCell {}

// Bilingual — onAppear picks `en` or `ja` based on StringManager.language.
// JA copy mirrors docs/data/attribute-overrides/_common_<slug>.json descriptions.
const CATEGORY_CATALOG: Array<{ slug: string; name: string; en: string; ja: string }> = [
  { slug: "layout",     name: "Layout",     en: "Size and axis behavior: width / height / weight / aspectRatio.",                     ja: "レイアウト属性はコンポーネントのサイズと軸方向の挙動を決める。コンポーネント種別によらず全てに適用される。" },
  { slug: "spacing",    name: "Spacing",    en: "Inner (padding) and outer (margin) empty space around components.",                  ja: "スペーシング属性はコンポーネントの周囲と内側の余白を制御する。margin は外側、padding は内側。" },
  { slug: "alignment",  name: "Alignment",  en: "Where a component sits within its parent and relative to siblings.",                 ja: "配置属性はコンポーネントが親のどこに置かれるか、兄弟要素がその要素に対してどう配置されるかを制御する。多くは Android の RelativeLayout 由来で、相対位置指定モードの View 内で有効。" },
  { slug: "state",      name: "State",      en: "Visibility, enabled / alpha, and interaction gate attributes.",                      ja: "状態属性は可視性、インタラクション、不透明度を制御する。ほとんどが Boolean、`visibility` のみ三値。" },
  { slug: "binding",    name: "Binding",    en: "@{}, @string/, @event — connect JSON to ViewModel fields.",                          ja: "Binding 属性は `@{...}` 構文で JSON 値と ViewModel の状態を繋ぐ。値 binding、文字列解決、イベント binding の 3 種類がある。" },
  { slug: "event",      name: "Event",      en: "onClick / onLongPress / onAppear — bind user interactions to the ViewModel.",        ja: "イベント属性はユーザー操作を ViewModel のメソッドにバインドする。全て任意、省略すれば該当操作は無効。" },
  { slug: "style",      name: "Style",      en: "Background / border / cornerRadius / shadow and style preset.",                      ja: "style 属性はコンポーネントの見た目を制御する: 背景、ボーダー、シャドウ、角丸、スタイルプリセット。" },
  { slug: "responsive", name: "Responsive", en: "platforms filter and breakpoint-specific overrides.",                                 ja: "レスポンシブ属性はビューポートのブレークポイントやホストプラットフォームに応じて値を変える。ブレークポイントは `jsonui-doc-web/tailwind.config.js` で設定する。" },
  { slug: "misc",       name: "Misc",       en: "Identity / include / partial and other meta attributes.",                            ja: "他のカテゴリに属さない識別・メタデータ・合成・デバッグ系の属性。" },
];

export class AttributesViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => AttributesData;
  protected _setData: (
    data: AttributesData | ((prev: AttributesData) => AttributesData),
  ) => void;

  get data(): AttributesData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => AttributesData,
    setData: (data: AttributesData | ((prev: AttributesData) => AttributesData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<AttributesData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<AttributesData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateReference: () => this.navigate("/"),
    });
  };

  onAppear = () => {
    const lang = StringManager.language === "ja" ? "ja" : "en";
    const catalog: CatalogCell[] = CATEGORY_CATALOG.map((c) => {
      const url = `/reference/attributes/${c.slug}`;
      return {
        id: `cat_${c.slug}`,
        titleKey: c.name,
        descriptionKey: lang === "ja" ? c.ja : c.en,
        url,
        onNavigate: () => this.navigate(url),
      };
    });

    const nextReads: NextReadCell[] = [
      {
        id: "next_components",
        titleKey: this.s("next_components_title"),
        descriptionKey: this.s("next_components_description"),
        url: "/reference/components",
        onNavigate: () => this.navigate("/reference/components"),
      },
      {
        id: "next_json_schema",
        titleKey: this.s("next_json_schema_title"),
        descriptionKey: this.s("next_json_schema_description"),
        url: "/reference/json-schema",
        onNavigate: () => this.navigate("/reference/json-schema"),
      },
    ];

    this.updateData({
      categoryCatalog: this.asCollection(catalog),
      nextReadLinks: this.asCollection(nextReads),
    });
  };

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`reference_attributes_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
