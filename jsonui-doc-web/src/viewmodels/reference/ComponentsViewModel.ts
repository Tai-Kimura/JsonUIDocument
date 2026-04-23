// ViewModel for Reference > Component reference (index).
// Seeds a catalog of all 28 components with one-line descriptions + links to
// the corresponding detail page at /reference/components/<kebab>.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ComponentsData } from "@/generated/data/ComponentsData";
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

// Every component with a short one-line description. Descriptions mirror the
// `description.{en,ja}` authored in docs/data/attribute-overrides/<name>.json.
// `onAppear` picks the right variant based on StringManager.language so the
// catalog cards respect the topbar's language toggle.
const COMPONENT_CATALOG: Array<{ kebab: string; name: string; en: string; ja: string }> = [
  { kebab: "label",          name: "Label",          en: "Display component for single-line or multi-line text. Read-only.",                                                   ja: "単一行または複数行のテキストを描画する表示専用コンポーネント。ユーザー入力には TextField / TextView を使う。" },
  { kebab: "icon-label",     name: "IconLabel",      en: "Label with a leading or trailing icon glyph.",                                                                        ja: "先頭または末尾にアイコングリフを持つラベル。アイコン付きボタン、メニュー項目、山形矢印付きセクション行、ステータス表示に使う。" },
  { kebab: "button",         name: "Button",         en: "Interactive component that triggers a ViewModel event on tap.",                                                       ja: "タップで ViewModel のイベントハンドラを起動するインタラクティブコンポーネント。見た目は `style` と子要素で決まり、タップ判定は常に領域全体。" },
  { kebab: "text-field",     name: "TextField",      en: "Single-line text input with two-way binding.",                                                                        ja: "短い文字列を受け取る単一行の入力フィールド。複数行は TextView を使う。パスワード入力は `secure: true` を指定。" },
  { kebab: "text-view",      name: "TextView",       en: "Multi-line text input that grows with content.",                                                                      ja: "複数行の長文入力（コメント・説明・メッセージ）用。`height` で制約されない限り、内容に応じて縦に伸びる。" },
  { kebab: "edit-text",      name: "EditText",       en: "Android-flavored alias for TextField (XML compat).",                                                                  ja: "TextField の Android ネイティブ命名エイリアス。実行時動作は同一。XML `EditText` から移行する Android エンジニアの属性名の馴染みを保つために存在。" },
  { kebab: "input",          name: "Input",          en: "Web-flavored alias for TextField mirroring HTML <input>.",                                                            ja: "TextField の Web ネイティブ命名エイリアス、HTML `<input>` 風。実行時動作は同一。" },
  { kebab: "view",           name: "View",           en: "Generic container that arranges children vertically or horizontally.",                                                ja: "子要素を垂直または水平に並べる汎用コンテナ。最も多用され、あらゆる JsonUI 画面の各セクションのルートに存在する。" },
  { kebab: "safe-area-view", name: "SafeAreaView",   en: "View that respects the host platform's safe area (notch, status bar).",                                               ja: "ホストプラットフォームのセーフエリア（ノッチ、ホームインジケータ、ステータスバー）を尊重する View。画面のルートに置くのが一般的。" },
  { kebab: "scroll-view",    name: "ScrollView",     en: "Scrollable container for content that may overflow the viewport.",                                                    ja: "垂直（デフォルト）または水平にスクロール可能なコンテナ。可視領域を超えた子要素がスクロール対象になる。" },
  { kebab: "collection",     name: "Collection",     en: "Virtualized list / grid bound to a dynamic array.",                                                                   ja: "動的配列を仮想化して描画するリスト／グリッド。可視範囲のみ描画。垂直／水平リスト、複数カラムグリッド、セクションヘッダ、ページング、遅延読み込みに対応。" },
  { kebab: "tab-view",       name: "TabView",        en: "Multi-page tab bar with one active child at a time.",                                                                 ja: "複数ページを持つタブバー。各タブは独立した子 View を持ち、アクティブなタブのみ前面表示される。" },
  { kebab: "select-box",     name: "SelectBox",      en: "Picker for one value from a list; date / time modes supported.",                                                      ja: "離散的な選択肢から 1 件を選ぶピッカー。`datePickerMode` 指定時は日付／時刻ピッカーになる。iOS/Android ではネイティブピッカー、Web では `<select>`。" },
  { kebab: "switch",         name: "Switch",         en: "Binary ON/OFF toggle with animated thumb.",                                                                           ja: "二値 ON/OFF を切り替えるアニメーション付きトグル。ホストプラットフォームに準拠（iOS カプセル / Android Material / Web カスタム）。" },
  { kebab: "toggle",         name: "Toggle",         en: "Alias for Switch with Android-style naming.",                                                                         ja: "Switch の Android 流命名エイリアス。実行時動作は同一。" },
  { kebab: "segment",        name: "Segment",        en: "Mutually exclusive horizontal button group (2–5 options).",                                                           ja: "排他的な水平ボタングループ。同時に 2〜5 件の選択肢を表示する。" },
  { kebab: "slider",         name: "Slider",         en: "Continuous numeric input over a min / max range.",                                                                    ja: "指定範囲の連続数値入力。`step` で離散値にもできる。" },
  { kebab: "radio",          name: "Radio",          en: "Single selection within a mutually exclusive group.",                                                                 ja: "グループ内で排他的に 1 件を選択するボタン。単体のラジオボタンとして動作し、`group` 属性で排他グループに属するものを定義。" },
  { kebab: "check-box",      name: "CheckBox",       en: "Binary or indeterminate checkbox for zero-or-more selections.",                                                       ja: "二値のチェックボックス。Radio と異なり、見た目がグループでも各 CheckBox は独立した状態を持つ。" },
  { kebab: "check",          name: "Check",          en: "Short alias for CheckBox.",                                                                                            ja: "CheckBox の短いエイリアス。実行時動作は同一。" },
  { kebab: "progress",       name: "Progress",       en: "Linear or circular progress indicator (determinate).",                                                                ja: "線形または円形の進捗インジケータ。`progress`（0.0〜1.0）を指定すると確定進捗になる。" },
  { kebab: "indicator",      name: "Indicator",      en: "Activity spinner for indefinite short-duration waits.",                                                               ja: "不定・短時間の待機用スピナー（ローディング、ネットワーク取得）。常にアニメーション、進捗値なし。" },
  { kebab: "image",          name: "Image",          en: "Bundled / local image from the resource bundle.",                                                                      ja: "同梱／ローカル画像を表示。アプリの resource bundle（iOS は asset catalog、Android は `res/drawable`、Web は `public/`）から読み込む。" },
  { kebab: "network-image",  name: "NetworkImage",   en: "URL-loaded image with caching, placeholder, and error fallback.",                                                     ja: "URL から自動ロードされる画像。キャッシュ・プレースホルダ・エラー時フォールバックを備える。" },
  { kebab: "gradient-view",  name: "GradientView",   en: "View with a linear gradient background (multi-stop).",                                                                ja: "線形グラデーション背景を持つ View。2 色の単純なグラデーションなら通常の View の `gradient` 属性で十分、`locations`（多段 stop 制御）が必要なときに GradientView を使う。" },
  { kebab: "blur",           name: "Blur",           en: "Platform-native blur / backdrop filter for glass effects.",                                                           ja: "この View の背面にある内容に、プラットフォームネイティブなぼかし（iOS UIBlurEffect / Android RenderEffect / Web CSS backdrop-filter）を適用する。" },
  { kebab: "circle-view",    name: "CircleView",     en: "Circular container for avatars, badges, and status dots.",                                                            ja: "円形コンテナ。`cornerRadius: width/2` を指定した View と等価だが、アスペクト比に関わらず真円を保証する。" },
  { kebab: "web",            name: "Web",            en: "Embedded web content via WKWebView / WebView / <iframe>.",                                                            ja: "WKWebView（iOS）／WebView（Android）／`<iframe>`（Web）による埋め込み Web コンテンツ。埋め込み地図、サードパーティウィジェット、HTML プレビューなどに使う。" },
];

export class ComponentsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ComponentsData;
  protected _setData: (
    data: ComponentsData | ((prev: ComponentsData) => ComponentsData),
  ) => void;

  get data(): ComponentsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => ComponentsData,
    setData: (data: ComponentsData | ((prev: ComponentsData) => ComponentsData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ComponentsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ComponentsData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateReference: () => this.navigate("/"),
    });
  };

  onAppear = () => {
    const lang = StringManager.language === "ja" ? "ja" : "en";
    const catalog: CatalogCell[] = COMPONENT_CATALOG.map((c) => {
      const url = `/reference/components/${c.kebab}`;
      return {
        id: `cat_${c.kebab.replace(/-/g, "_")}`,
        titleKey: c.name,
        descriptionKey: lang === "ja" ? c.ja : c.en,
        url,
        onNavigate: () => this.navigate(url),
      };
    });

    const nextReads: NextReadCell[] = [
      {
        id: "next_attributes",
        titleKey: this.s("next_attributes_title"),
        descriptionKey: this.s("next_attributes_description"),
        url: "/reference/attributes",
        onNavigate: () => this.navigate("/reference/attributes"),
      },
      {
        id: "next_custom_components",
        titleKey: this.s("next_custom_components_title"),
        descriptionKey: this.s("next_custom_components_description"),
        url: "/guides/custom-components",
        onNavigate: () => this.navigate("/guides/custom-components"),
      },
    ];

    this.updateData({
      componentCatalog: this.asCollection(catalog),
      nextReadLinks: this.asCollection(nextReads),
    });
  };

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`reference_components_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
