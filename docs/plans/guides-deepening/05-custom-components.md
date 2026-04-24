# 05 · custom-components 深堀り

## 現状

4 section: `spec-first` / `whitelist` / `scaffold` / `handedit`。heading + body Label のみ、CodeBlock なし。抽象的。

## 実装現実 vs 現在の記述

**最大のギャップ 1**: **spec-first** は正しいが、具体的なファイル配置（`docs/components/json/<name>.component.json`）と最近の plan（`79873ec: "plans: enforce spec-first custom components, drop standard-pattern customs"`）の位置づけが書けていない。
**最大のギャップ 2**: "whitelist" の実体が 2 層（`.jsonui-doc-rules.json` + 各 platform の `extensions/converter_mappings.rb`）だが、現 guide はこれを 1 層で語っている印象。
**最大のギャップ 3**: `.jsonui-type-map.json` はコンポーネント whitelist ではなく**カスタムデータ型のマップ**（TS interface / Swift struct / Kotlin data class 名を platform 間で対応させるもの）。混同すると読者が route を見失う。
**最大のギャップ 4**: 実在の exemplar（docs site 自身の CodeBlock component）を使えば「こう書く」が一発で伝わるが、現 guide は参照していない。

### component_spec.json の shape

実例: `/Users/like-a-rolling_stone/resource/JsonUIDocument/docs/components/json/codeblock.component.json`

top-level:
```json
{
  "type": "component_spec",
  "version": "1.0",
  "metadata": { "name": "CodeBlock", "displayName": "Code block", "category": "...", "platforms": ["web", "ios", "android"] },
  "props": { "items": [ { "name": "code", "type": "String", "binding_direction": "read-only" }, ... ] },
  "slots": { "items": [] },
  "structure": { "components": [...], "layout": {...} },
  "stateManagement": { "internalStates": [...], "exposedEvents": [...] },
  "usage": { "example": { "layoutSnippet": "...", "description": "..." } },
  "notes": [ "Spec-first discipline: this spec MUST exist and validate before .jsonui-doc-rules.json registers ..." ]
}
```

### 3 層の登録チェーン

**Layer 1 — spec**: `docs/components/json/<name>.component.json` を手で書く（or `jui doc init-component` で skeleton）。

**Layer 2 — project whitelist**: `.jsonui-doc-rules.json` の `rules.componentTypes.screen[]` に type 名を追加。これがプロジェクト全体で使える custom component の source of truth。

```json
// .jsonui-doc-rules.json (excerpt)
{
  "rules": {
    "componentTypes": {
      "screen": ["CodeBlock", "TableOfContents", "AttributeRow", ...]
    }
  }
}
```

**Layer 3 — platform converter registration**: 各 platform の `extensions/` ディレクトリ:
- Web: `jsonui-doc-web/rjui_tools/lib/react/converters/extensions/converter_mappings.rb`
- iOS: `sjui_tools/lib/swiftui/views/extensions/converter_mappings.rb`
- Android: `kjui_tools/lib/compose/components/extensions/component_mappings.rb`

それぞれ Hash で `'ComponentName' => 'ComponentNameConverter'` が書かれる（scaffolder が自動で append）。

Converter 本体は `extensions/<snake>_converter.rb`（hand-edit 可能、`@generated` マーカー無し）。attribute definition は `extensions/attribute_definitions/<Name>.json`（scaffolder が書くが、手編集も可）。

### `.jsonui-type-map.json` は別物

```json
{
  "version": "1.0",
  "types": {
    "AttributeRow": { "class": "AttributeRow", "android": {...}, "web": {...} }
  }
}
```

これは**データ型 (TS interface / Swift struct / Kotlin data class) の platform 間マッピング**。component whitelist ではない。`jui verify` の "unregistered custom types" 警告はこちらを指す。

### Scaffold 出力

`sjui generate converter Badge --attributes="text:String,color:String"` を実行した時の各 platform 出力:

**Web**:
- `rjui_tools/lib/react/converters/extensions/badge_converter.rb` (hand-editable)
- `rjui_tools/lib/react/converters/extensions/converter_mappings.rb` (auto-append)
- `rjui_tools/lib/react/converters/extensions/attribute_definitions/Badge.json` (auto-generated)

**iOS**:
- `sjui_tools/lib/swiftui/views/extensions/badge_converter.rb`
- `converter_mappings.rb` (append)
- `attribute_definitions/Badge.json`

**Android**:
- `kjui_tools/lib/compose/components/extensions/badge_component.rb`
- `component_mappings.rb` (append)
- `attribute_definitions/Badge.json`

**Ruby 上で生成される**（各 platform の converter は Ruby）。Swift/Kotlin/TypeScript の component 本体は**別途手書き or 別コマンド**で出力。

### hand-edit boundary

- **@generated** (DO NOT EDIT): Layout JSON、ViewModelBase、Hook、StringManager、Data interface。
- **Scaffold で出る、hand-edit 可**: `*_converter.rb`、`attribute_definitions/<Name>.json`、Swift/Kotlin/TSX の component impl。
- **Auto-update** (再実行で上書きされるが手編集も温存されがち): `converter_mappings.rb`（Hash entry 追加のみ、既存行は触らない）。

### 実在 exemplar — CodeBlock

docs site の CodeBlock component が理想的な題材:
- Spec: `docs/components/json/codeblock.component.json`
- Whitelist: `.jsonui-doc-rules.json` → `rules.componentTypes.screen` に `"CodeBlock"`
- Web converter: `jsonui-doc-web/rjui_tools/lib/react/converters/extensions/code_block_converter.rb`
- Web attribute defs: `jsonui-doc-web/rjui_tools/lib/react/converters/extensions/attribute_definitions/CodeBlock.json`
- Web component impl: `jsonui-doc-web/src/generated/components/CodeBlock.tsx` or `src/components/ui/CodeBlock.tsx` (要確認)
- 使用例: `docs/screens/layouts/guides/writing-your-first-spec.json` 内の `{ "type": "CodeBlock", "code": "...", "language": "json" }`

## 目標構造

4 section → **7 section**:

1. **Why spec-first** — 79873ec plan の趣旨（standard-pattern customs を廃止した理由）を簡潔に。
2. **The component spec** — `component_spec.json` の shape と実例引用。
3. **Registering with the project (.jsonui-doc-rules.json)** — whitelist 層。
4. **Registering with a platform (converter_mappings)** — 3 platform の converter 登録。
5. **The scaffold and what it writes** — `jui generate converter` の出力一覧（3 platform × 3 ファイル = 9）。
6. **Hand-edit boundaries** — @generated と非 @generated の区分、再実行での上書きルール。
7. **`.jsonui-type-map.json` ≠ component whitelist** — 混同を避けるための注意書き。

## 新設 section の詳細

### 1. Why spec-first

**body**: 「JsonUI は以前『standard pattern custom component』と呼ばれる "spec なしで直接 converter を書く" ショートカットを許していた。79873ec で廃止。**今は spec が先**。理由: (a) 3 platform で型整合を保つ source of truth が必要、(b) docs サイトに自動掲載するための schema が要る、(c) `jui verify` が spec を参照して drift 検出できる。」

### 2. The component spec

**body**: 「`docs/components/json/<name>.component.json` を書く。`jui doc init-component --name Foo` で skeleton を出せる。」

**CodeBlock** (json — CodeBlock component spec を抜粋):
```json
{
  "type": "component_spec",
  "version": "1.0",
  "metadata": {
    "name": "Badge",
    "displayName": "Badge",
    "category": "Display",
    "platforms": ["web", "ios", "android"]
  },
  "props": {
    "items": [
      { "name": "text",  "type": "String", "description": "Visible text." },
      { "name": "color", "type": "String", "defaultValue": "neutral",
        "description": "Semantic color key (neutral/success/warn/danger)." }
    ]
  },
  "slots": { "items": [] },
  "structure": { "components": [], "layout": {} },
  "notes": [
    "Spec-first: this spec MUST validate before registering the converter."
  ]
}
```

**CodeBlock** (bash):
```bash
jui doc validate component --file docs/components/json/badge.component.json
# exit 0 = valid
```

### 3. Registering with the project

**body**: 「spec が valid になったら `.jsonui-doc-rules.json` に type 名を追加。これでプロジェクト全体の screen spec から `{ "type": "Badge" }` が参照可能になる。」

**CodeBlock** (json):
```jsonc
// .jsonui-doc-rules.json
{
  "rules": {
    "componentTypes": {
      "screen": [
        "CodeBlock",
        "TableOfContents",
        "Badge"              // ← add
      ]
    }
  }
}
```

### 4. Registering with a platform

**body**: 「各 platform の converter ディレクトリで `converter_mappings.rb` に一行足す。通常は `jui generate converter` が自動で書くが、仕組みを知っておくと debug が楽。」

**CodeBlock** (ruby — Web):
```ruby
# jsonui-doc-web/rjui_tools/lib/react/converters/extensions/converter_mappings.rb
module SjuiTools
  module React
    module Converters
      module Extensions
        CONVERTER_MAPPINGS = {
          'CodeBlock'        => 'CodeBlockConverter',
          'TableOfContents'  => 'TableOfContentsConverter',
          'Badge'            => 'BadgeConverter',    # ← add
        }.freeze
      end
    end
  end
end
```

**Callout**: 「iOS は `sjui_tools/lib/swiftui/views/extensions/converter_mappings.rb`、Android は `kjui_tools/lib/compose/components/extensions/component_mappings.rb`。3 platform で key 名は同じ（spec の `type` 値と一致）。」

### 5. The scaffold and what it writes

**body**: 「登録作業は手でやらなくていい。`jui generate converter --from <spec>` で 3 platform 分を一発生成する。」

**CodeBlock** (bash):
```bash
jui generate converter --from docs/components/json/badge.component.json
```

**Table** (生成物):

| platform | file | 初回生成 | 再実行時 |
|---|---|---|---|
| Web | `rjui_tools/.../extensions/badge_converter.rb` | new | **skip**（既存保護） |
| Web | `.../attribute_definitions/Badge.json` | new | 上書き |
| Web | `.../converter_mappings.rb` | append | append（重複検出） |
| iOS | `sjui_tools/.../extensions/badge_converter.rb` | new | skip |
| iOS | `.../attribute_definitions/Badge.json` | new | 上書き |
| iOS | `.../converter_mappings.rb` | append | append |
| Android | `kjui_tools/.../extensions/badge_component.rb` | new | skip |
| Android | `.../attribute_definitions/Badge.json` | new | 上書き |
| Android | `.../component_mappings.rb` | append | append |

**Callout**: 「scaffold は**Ruby の converter ファイル**を書く。Swift/Kotlin/TSX の component 本体は別途手書きする（scaffold の `build_class_name()` や JSX 出力ロジックから逆引きで書ける）。」

### 6. Hand-edit boundaries

**body**: 「どこまで `jui build` が上書きし、どこから自分のものか。」

**Table**:

| ファイル | status |
|---|---|
| `docs/components/json/<name>.component.json` | **自分で書く**（source of truth） |
| `.jsonui-doc-rules.json` | **自分で書く**（whitelist） |
| `converter_mappings.rb` | scaffold が append、手編集 OK |
| `extensions/<name>_converter.rb` | scaffold が初回のみ書く、以後 **手編集**（@generated マーカー無し） |
| `attribute_definitions/<Name>.json` | scaffold が書く、上書きされる（手編集は spec 側で行う） |
| Layout JSON (`docs/screens/layouts/...`) | **@generated — 触るな** |
| `ViewModelBase` / `Hook` / `Data` | **@generated — 触るな** |
| component の Swift/Kotlin/TSX 実装 | **自分で書く**（scaffold は Ruby converter しか出さない） |

### 7. `.jsonui-type-map.json` ≠ component whitelist

**body**: 「**混同注意**。`.jsonui-type-map.json` はカスタム **データ型** の platform 間マッピング。`.jsonui-doc-rules.json` は custom **component** の whitelist。別の役割。」

**CodeBlock** (json — type-map):
```jsonc
// .jsonui-type-map.json — カスタムデータ型
{
  "types": {
    "AttributeRow": {                      // TS interface / Swift struct / Kotlin data class
      "class": "AttributeRow",             // iOS default
      "android": { "class": "AttributeRow" },
      "web":     { "class": "AttributeRow" }
    }
  }
}
```

**CodeBlock** (json — doc-rules):
```jsonc
// .jsonui-doc-rules.json — カスタムコンポーネント whitelist
{ "rules": { "componentTypes": { "screen": ["CodeBlock", "Badge", "..."] } } }
```

**Callout**: 「`jui verify` の `"Unregistered custom types"` 警告は **type-map** のほう。`"Invalid component type: 'X'"` validator エラーは **doc-rules** のほう。」

## Spec 編集差分

`docs/screens/json/guides/custom-components.spec.json`:
- TOC 4 → 7: `toc_why`, `toc_spec`, `toc_project`, `toc_platform`, `toc_scaffold`, `toc_handedit`, `toc_type_map`
- sections: `section_why`, `section_spec`, `section_project`, `section_platform`, `section_scaffold`, `section_handedit`, `section_type_map`
- 既存 `section_spec_first` → `section_why`, `section_whitelist` は 2 分割 → `section_project` + `section_platform`, `section_scaffold` 維持, `section_handedit` 維持, `section_type_map` 新規

## strings.json 新設キー（custom_components namespace）

```
custom_components_section_why_heading/body
custom_components_section_spec_heading/body
custom_components_section_spec_codeblock_caption     (optional)
custom_components_section_project_heading/body
custom_components_section_platform_heading/body
custom_components_section_platform_callout
custom_components_section_scaffold_heading/body
custom_components_section_scaffold_callout
custom_components_section_scaffold_table_*           (9 rows × 4 cols ≒ 36 entries)
custom_components_section_handedit_heading/body
custom_components_section_handedit_table_*           (8 rows × 2 cols ≒ 16 entries)
custom_components_section_type_map_heading/body
custom_components_section_type_map_callout
custom_components_toc_row_*                          (7 rows)
```

既存 keys は残置、spec 側の参照のみ更新。

## VM 差分

`CustomComponentsViewModel.ts` — 変更なし。

## 検証手順

1. 79873ec plan を読んで本文の trajectory が合ってるか再確認（`git show 79873ec`）
2. 実在の Badge-like component（既存で最も小さい custom — おそらく `TableOfContents` か新規 stub）を 1 つ触って scaffold が plan 通り動くか検証
3. `jui build` → `jui verify --fail-on-diff`
4. ブラウザで `/guides/custom-components` 目視

## 作業見積り

- git 履歴確認 + 実挙動 sampling: 0.5h
- strings.json: 80+ entries ≒ 2.5h
- spec: 1h
- ブラウザ確認 + fix: 1h
- 計 **~5h**

