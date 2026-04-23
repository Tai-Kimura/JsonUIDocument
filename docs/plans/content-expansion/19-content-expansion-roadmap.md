# 19. コンテンツ拡充ロードマップ（plans 20〜41 のインデックス）

> **本計画書の位置付け:** 既存 plans 00〜18 は**設計・骨組み**まで。実際の記事本文・コードサンプル・説明文が薄いため、
> **plans 20〜41 で各記事の「書くべき内容」を記事単位で詳細化**する。
>
> **本ロードマップは UI / レイアウト構造には一切触れない。**記事に載せる **テキスト・コードサンプル・クロスリンク・strings キー** のみを対象とする
> （デザイン全面改修中のため、Collection / cell / converter / style 等の選択は各セッションの判断に委ねる）。

---

## 1. 背景

監査の結果、以下のギャップが判明:

| カテゴリ | 記事数 | 実装率 | 主な不足 |
|---------|--------|--------|---------|
| learn | 5 | 50〜80% | `installation` のみ完成。他 4 記事は骨組みに `TODO`/空文字が多数 |
| reference | 5 | **0%** | 全記事スタブ。`attributes` / `components` は plan 14 のパイプライン起動待ち |
| guides | 5 | 20% | `writing-your-first-spec` のみ充実。他 4 記事はコードサンプル 0 個 |
| platforms | 3 | **0%** | plan 05/06/07 の構造設計は終わっているが、記事本文が書かれていない |
| concepts | 5 | 30% | `hot-reload` が完全スタブ。他 4 記事も概念説明だけでコードが乏しい |
| tools | 5 | 30% | plan 08〜12 の構造設計は終わっているが、記事本文が書かれていない |

→ plans 20〜41 で、各記事に**具体的に書き下ろすべき本文・コードサンプル・数値・表**を指示する。

---

## 2. 設計原則（全プラン共通）

1. **UI 構造に言及しない**。Collection / cellClasses / orientation / style / converter 選定は既存 layout の踏襲で OK。デザイン改修後に再配置される。
2. **コードサンプルは完全形で書く**。「この関数を載せる」ではなく、貼り付け可能な全文を記述。
3. **すべて日英同時**。strings キーの命名規則を指定し、`.ja.md` / `.en.md` のような別ファイル化はしない（strings.json 一元管理）。
4. **クロスリンクを必ず 3 本以上**張る。関連ページの相互遷移を切らさない。
5. **既存 layout JSON を書き換える前提**で spec 側の `metadata.description` も更新。`@generated` 印のある行は触らない（plan 16 の invariant 1, 3）。
6. **新設セクションは section id を先に決める**。本文を足すとき Anchor リンクが効くように。

---

## 3. 実行単位（1 plan ≒ 1 セッション）

1 プランを 1 セッションで処理できる粒度を目標とする。目安:

- 単一記事の本文拡充: 2〜4 時間 / 1 セッション
- 複数の類似記事をバンドルしたプラン: 4〜8 時間 / 1 セッション（分割可）
- 大規模セクション（platforms/swift 等）: 1 プラン = 1 日 / 分割必要

各プラン冒頭の **"Scope" 節**で所要時間目安と「セッション分割の推奨境界」を明記する。

---

## 4. プラン一覧（実行順）

### Phase A. Reference（他セクションが依存するため最優先）

| # | ファイル | 対象記事 | 依存 |
|---|---------|---------|------|
| 20 | `20-reference-overrides-text-input.md` | Label / IconLabel / TextField / TextView / EditText / Input / Button | plan 14 |
| 21 | `21-reference-overrides-selection.md` | SelectBox / Switch / Toggle / Segment / Slider / Radio / CheckBox / Check / Progress / Indicator | plan 14 |
| 22 | `22-reference-overrides-container.md` | View / SafeAreaView / ScrollView / Collection / TabView | plan 14 |
| 23 | `23-reference-overrides-media.md` | Image / NetworkImage / GradientView / Blur / CircleView / Web | plan 14 |
| 24 | `24-reference-common-attributes.md` | 共通 131 属性（layout / spacing / text / state / binding / event / responsive / misc） | plan 14 |
| 25 | `25-reference-cli-commands.md` | `/reference/cli-commands`（jui / sjui / kjui / rjui / jsonui-test / jsonui-doc 全サブコマンド） | plan 08 |
| 26 | `26-reference-mcp-tools.md` | `/reference/mcp-tools`（29 ツール全引数・戻り値・エラー） | plan 09 |
| 27 | `27-reference-json-schema.md` | `/reference/json-schema`（spec / layout / strings / cells の JSON スキーマ） | plan 17 |

### Phase B. Learn（A と並行可）

| # | ファイル | 対象記事 |
|---|---------|---------|
| 28 | `28-learn-expansion.md` | `/learn/what-is-jsonui` + `/learn/hello-world` + `/learn/first-screen` + `/learn/data-binding-basics`（`installation` は完成済で対象外） |

### Phase C. Guides（A 完成後、記事相互参照が効くように）

| # | ファイル | 対象記事 |
|---|---------|---------|
| 29 | `29-guides-navigation.md` | `/guides/navigation` |
| 30 | `30-guides-localization.md` | `/guides/localization` |
| 31 | `31-guides-testing.md` | `/guides/testing` |
| 32 | `32-guides-custom-components.md` | `/guides/custom-components` |

### Phase D. Platforms（Reference 完成後。属性を引用するため）

| # | ファイル | 対象記事 |
|---|---------|---------|
| 33 | `33-platforms-swift-content.md` | `/platforms/swift/**`（plan 05 の全 18 ページに本文を注入） |
| 34 | `34-platforms-kotlin-content.md` | `/platforms/kotlin/**`（plan 06 ベース） |
| 35 | `35-platforms-rjui-content.md` | `/platforms/rjui/**`（plan 07 ベース） |

### Phase E. Concepts（A 完成後）

| # | ファイル | 対象記事 |
|---|---------|---------|
| 36 | `36-concepts-expansion.md` | `/concepts/why-spec-first` + `/concepts/one-layout-json` + `/concepts/data-binding` + `/concepts/viewmodel-owned-state` + `/concepts/hot-reload` |

### Phase F. Tools（A 完成後、CLI / MCP 個別ページの本文）

| # | ファイル | 対象記事 |
|---|---------|---------|
| 37 | `37-tools-cli-article.md` | `/tools/cli`（overview + install + 3 ツール導線） |
| 38 | `38-tools-mcp-article.md` | `/tools/mcp`（overview + 4 グループ導線 + `tools/mcp/tools/*` ディレクトリ） |
| 39 | `39-tools-agents-article.md` | `/tools/agents`（9 エージェント + 11 スキル + 5 ルール） |
| 40 | `40-tools-test-runner-article.md` | `/tools/test-runner`（screen / flow / drivers） |
| 41 | `41-tools-helper-article.md` | `/tools/helper`（VSCode 拡張機能ガイド） |

### Phase G. Colors & Theming（upstream `colors-multitheme` Phase 1〜4 完了が前提）

| # | ファイル | 対象記事 |
|---|---------|---------|
| 42 | `42-colors-and-theming.md` | `/guides/theming` + `/reference/colors-json` 新設、`platforms/*/theming` への指示、`concepts/one-layout-json` / `guides/localization` / `reference/json-schema` / `reference/cli-commands` への節追加 |

---

## 5. 依存グラフ

```
                   ┌─ 20 (Text/Input) ─┐
                   ├─ 21 (Selection)  ─┤
plan 14 ──────────►├─ 22 (Container)  ─┼──► 33 (Swift)
(reference gen)    ├─ 23 (Media)      ─┤     34 (Kotlin)
                   └─ 24 (Common)     ─┘     35 (Rjui)

plan 08 ──► 25 (CLI reference)
plan 09 ──► 26 (MCP reference) ─────────► 38 (Tools/MCP article)
plan 17 ──► 27 (JSON Schema reference)

28 (Learn)        ─── 独立（並行可）
29〜32 (Guides)   ─── 20〜24 完成後が望ましい（属性リンク張れるため）
36 (Concepts)     ─── 20〜24 完成後が望ましい
37〜41 (Tools)    ─── 25, 26 完成後
```

---

## 6. 実行順の推奨

### Week 1 — 属性オーバーライド一気通貫
1. 24（共通属性）
2. 20 → 21 → 22 → 23（コンポーネント属性 4 バンドル）
   - `jui g project` パイプラインが未実装なら **並行して plan 14 §5 の実装セッション**を立てる

### Week 2 — Reference 残り + Learn
3. 25（CLI）
4. 26（MCP）
5. 27（JSON Schema）
6. 28（Learn 4 記事）

### Week 3 — Guides + Platform 開始
7. 29〜32（Guides 4 記事）
8. 33（Platforms/Swift）

### Week 4 — Platform 残り + Concepts + Tools
9. 34（Platforms/Kotlin）
10. 35（Platforms/Rjui）
11. 36（Concepts 5 記事）
12. 37〜41（Tools 5 記事）

---

## 7. 各プラン共通テンプレート

各プラン（20〜41）は以下の節構成を守ること:

```markdown
# NN. コンテンツプラン: <対象範囲>

> Scope: 所要時間目安・セッション分割推奨境界
> 依存: <先行すべき plan 番号>

## 1. 対象記事
| URL | spec file | layout file | 現状 |
|---|---|---|---|
| ... | ... | ... | CodeBlock N 個 / 骨組みのみ 等 |

## 2. 各記事の書き下ろすべき本文

### 2.1 <URL>
#### セクション: <H2>
- 本文骨子（日英両方）
- 載せるコードサンプル（言語タグ + 全文）
- 表データ（そのまま転記できる Markdown table）
- クロスリンク

### 2.2 <URL>
...

## 3. 必要な strings キー

`<prefix>_<key>` × 2 言語（`en` / `ja`）:

- `<prefix>_<key>` : <内容の目安>
- ...

## 4. クロスリンク追加先

既存記事のどこに「→ この新規コンテンツへ」のリンクを張るか:

- `/xxx/yyy` の「関連」節に追加
- `/aaa/bbb` の冒頭サブコピーに追加

## 5. 実装チェックリスト

- [ ] spec metadata description 更新
- [ ] strings キー追加（ja / en）
- [ ] 本文に対応する既存 cell の確認（なければ新規 cell 作成は次セッション）
- [ ] クロスリンク追加
- [ ] `jui build` 0 warnings
- [ ] `jui verify --fail-on-diff`
- [ ] `jsonui-localize`
```

---

## 8. UI / デザインに触れない条件

以下は**各プランで指示しない**:

- Collection / cellClasses の配列
- orientation / layout / columnCount
- style / fontSize / fontColor / padding / margin
- converter 選定（`CodeBlock` のみ例外：コードサンプル表示のため本文内で言及）
- sidebar include 先
- cells/*.json の構造

以下は**書いて OK**（コンテンツに属する）:

- セクション見出しの文言と論理順序
- 本文の文章（テキスト自体）
- コードサンプル（言語タグ付きで全文）
- 表（行列データ）
- クロスリンクの URL
- strings キーの命名（prefix ルール）

デザイン改修が完了したら、layout 側をそれに合わせて再配置するが、**各プランが指定したテキスト・コード・表のデータは維持される**。

---

## 9. 完了判定

全 22 プラン（20〜41）が完了した時点で:

- 全記事に CodeBlock ≥ 3（learn は ≥ 5, reference は ≥ 2 × コンポーネント、guides は ≥ 4）
- 全記事に「関連」節があり、クロスリンク ≥ 3
- 全記事に「よくある誤り」または「Tips」節がある（reference 除く）
- strings.json のキー数が現在（~2600）から +4000 程度増える見込み

---

## 10. 参考: 既存 plans との関係

- plans 00〜03: 全体設計（変更なし）
- plans 04, 14, 16, 17: 仕組み系（変更なし、plans 20〜41 から参照するのみ）
- plans 05, 06, 07: 既存の構造プラン → plans 33, 34, 35 が**本文プラン**として補完
- plans 08〜13: 既存の構造プラン → plans 25, 26, 37, 38, 39, 40, 41 が**本文プラン**として補完
- plan 18: `/learn/installation` 完成。plans 28〜32 以降の「完成記事」の参考テンプレート
