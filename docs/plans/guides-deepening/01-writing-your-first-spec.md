# 01 · writing-your-first-spec 深堀り

## 現状

既に 5 step + troubleshooting の inline 構造。他 4 本より進んでいる。CodeBlock も step 1/2/3/4/5 に各 1 つずつ入っている。

## 実装現実 vs 現在の記述

| 現状の CodeBlock / 説明 | 実装現実 |
|---|---|
| step1: `counter.spec.json` の枠組み（metadata のみ） | OK。但し `metadata.name` は **PascalCase 必須**（validator が `"Name must be PascalCase: 'login'"` を出す）ことが未記載。 |
| step2: `uiVariables` の declaration | OK。但し `initial` は**自由記述文字列**（`"[]"`, `"0"`, `"\"neutral\""` など）で型チェックされない旨が未記載。`displayLogic` の存在も step2 で触れるべき。 |
| step3: `eventHandlers` | OK。但し **`onX` パターン必須**（正規表現 `/^on[A-Z]/`）で validator が弾く旨が未記載。 |
| step4: `customTypes` | OK。但し `dataFlow.customTypes` は VM / Repo 両方で使われるので "Counter-specific" に限定しない説明が必要。 |
| step5: `jui doc validate-spec …` | **コマンドが間違い**。正しくは `jui doc validate spec --file <path>`（`validate` と `spec` がサブコマンドで分離）。 |
| step5: `jui generate project --file …` | **正しい**。但し生成物が **Layout JSON / ViewModel Base (auto-update) / ViewModel Impl (once-only) / Repository/UseCase Protocol+Impl** の 4 系統あること、Impl は hand-edit 保護される（再実行で上書きしない）ことが未説明。 |
| step5: `jui build --watch` | **`--watch` フラグは jui build には存在しない**（sjui 側に UIKit のみの watch 機能あり）。この行は削除または別コマンドに差し替え。 |
| step5: `jui verify --fail-on-diff` | OK。但し verify が検出する 3 系統（structural diff / orphan data / unregistered custom types）の区別が未記載。 |
| troubleshooting 3 項目 | symptom/fix だけで原因が薄い。validator が吐く **実エラー文字列**を併記すべき。 |

## 目標構造

既存 5 step + trouble はベース維持。以下を加筆：

- **Step 0 (NEW)**: 事前準備 — `jui init` 済み + `jsonui-doc-rules.json` の存在確認 + 既存 screen list を見る方法 (`jui doc validate spec` vs `jui list` 的な確認)
- **Step 1**: 現状通り。**metadata.name が PascalCase 必須**を追記。
- **Step 2**: 現状通り。`initial` が自由文字列で型チェックされない旨 + `displayLogic` の簡単紹介。
- **Step 3**: 現状通り。**`onX` パターン必須**を追記。
- **Step 4**: 現状通り。customTypes が VM/Repo 両方で使える旨を追記。
- **Step 5 (改訂)**: 3 つの sub-block に分割
  - 5a: `jui doc validate spec --file counter.spec.json` — 正しいサブコマンド構造を教える。
  - 5b: `jui generate project --file counter.spec.json` — 4 系統の生成物を table で説明。`--dry-run` と `--force` に触れる。
  - 5c: `jui build` + `jui verify --fail-on-diff` — verify の 3 系統 diff を説明。`--watch` は削除。
- **Step 6 (NEW)**: "spec-as-contract" の運用 — hand-edit すべきファイル / @generated で触ってはいけないファイルの一覧（concrete）。
- **Troubleshooting**: 3 項目を 6 項目に拡張（実エラー文字列ベース）。

## 新設 section の詳細

### Step 0 — Before you start (NEW)

**body**: 「spec を書き始める前に、プロジェクトが `jui init` 済みであること、`docs/screens/json/` ディレクトリが存在すること、既存 spec を眺めてパターンを掴むことを勧める」

**CodeBlock** (bash):
```bash
# Is this a JsonUI project?
cat jui.config.json

# What specs already exist?
find docs/screens/json -name "*.spec.json" | head

# Look at one for shape reference
cat docs/screens/json/learn/hello-world.spec.json
```

### Step 5a — Validate

**body**: 「まず spec が schema に通ることを確認。`jui doc validate` は screen/component 両方をサブコマンドで区別する。」

**CodeBlock** (bash):
```bash
jui doc validate spec --file docs/screens/json/counter.spec.json

# → "is_valid: true" で成功 / "is_valid: false" + errors[] で失敗
# exit 0 = 成功 / exit 1 = エラーあり
```

### Step 5b — Generate

**body**: 「validate が通ったら project scaffold を生成。4 系統のファイルが出る。どれが auto-update でどれが once-only（hand-edit 保護）かを理解しておく。」

**Table** (Label + View で表現、既存の Label を View 横並びで):

| 生成物 | 系統 | 再実行時の扱い |
|---|---|---|
| `Layouts/counter.json` | Layout JSON | 上書き（spec が source of truth） |
| `.../CounterViewModelBase.*` | VM Protocol | 上書き（spec から再生成） |
| `.../CounterViewModel.*` | VM Impl | **once-only**（既存を保護） |
| `.../CounterRepository.*`, `UseCase.*` | Protocol / Impl | 同上（Protocol は上書き、Impl は保護） |

**CodeBlock** (bash):
```bash
# Generate all platforms
jui generate project --file docs/screens/json/counter.spec.json

# Dry-run: see what WOULD be created
jui generate project --file docs/screens/json/counter.spec.json --dry-run

# Web only
jui generate project --file docs/screens/json/counter.spec.json --web-only
```

### Step 5c — Build + verify

**body**: 「毎回の編集後に build、commit 前に verify。verify は 3 系統を diff する。」

**CodeBlock** (bash):
```bash
# Regenerate all platforms' layouts / strings / ViewModelBase
jui build

# Before committing — assert spec/layout drift = 0
jui verify --fail-on-diff

# Diagnose a single spec with detail
jui verify --file docs/screens/json/counter.spec.json --detail
```

**本文 (strings.json) で説明する 3 系統 diff**:
- **Structural diff**: spec の components/layout と生成された Layout JSON のツリー差分
- **Orphan data**: Layout JSON の `data[]` に存在するが spec の `uiVariables` / `eventHandlers` に宣言されていないもの → spec に追記 or Layout から削除
- **Unregistered custom types**: spec 内 `type: "Foo"` で `.jsonui-type-map.json` に未登録のもの → `.jsonui-type-map.json` に追記

### Step 6 — Which files to hand-edit (NEW)

**body**: 「Spec 経由で再生成される部分と、自分で書き続ける部分の境界を明示する。」

**CodeBlock** (text — small tree):
```text
docs/
  screens/
    json/
      counter.spec.json          ← YOU author this
    layouts/
      counter.json                ← @generated from spec — DO NOT EDIT
      Resources/
        strings.json              ← YOU author keys (both en/ja)
jsonui-doc-web/src/
  generated/                      ← @generated — DO NOT EDIT
    viewmodels/CounterViewModelBase.ts
    hooks/useCounterViewModel.ts
    data/CounterData.ts
    StringManager.ts
  viewmodels/                     ← YOU author
    CounterViewModel.ts
  app/counter/                    ← YOU author
    page.tsx
```

### Troubleshooting の改訂

3 項目 → 6 項目。symptom / cause / fix で揃える。実エラー文字列を quote。

1. `"Name must be PascalCase: 'counter'"` — `metadata.name` を `Counter` に。
2. `"ID must be snake_case: 'myButtonId'"` — component `id` を snake_case に。
3. `"Variable name must be camelCase: 'my_var'"` — `uiVariables[].name` を camelCase に。
4. `"Invalid component type: 'Card'"` — built-in 名を使うか、custom なら `docs/components/json/card.component.json` を追加。
5. `jui verify` が "Orphan data: `foo` not declared in uiVariables" — `stateManagement.uiVariables` に追加 or Layout JSON の手編集を捨てて build し直し。
6. `jui generate` が "Duplicate component ID: 'button_id'" — Layout 内で同じ id を二度使っている。

## Spec 編集差分

`docs/screens/json/guides/writing-your-first-spec.spec.json`:
- TOC に `toc_step0`, `toc_step5a`, `toc_step5b`, `toc_step5c`, `toc_step6` を追加（既存 step5 を 3 分割、step0 と step6 を新規）
- `section_step1..5` は維持、`section_step0` / `section_step5a` / `section_step5b` / `section_step5c` / `section_step6` を新規 section として body_column に追加
- troubleshooting は `trouble_1..3` → `trouble_1..6` に拡張。各 symptom/fix の Label をそのまま 3 組追加

**注**: section 追加は layoutFile 側の JSON を手編集せず、spec の `structure.components[]` に記述 → `jui build` で layoutFile を再生成させる設計。現状の spec は `structure.components: []` + `structure.layout: {}` で layoutFile 指定 mode なので、この 5 本のガイドは **layout JSON を spec から再生成するよりも、layout JSON を直接メンテ** している。方針を `jsonui-define` agent に確認必要。

→ **暫定方針**: 現行の layout-file-first 運用を続け、spec は "何が載っているか" のメタ情報のみ保持、strings.json と layout JSON を hand-ish に伸ばす（@generated 扱いだが、現 運用で既にそうなっている）。運用の正当性は 00-overview のオープン質問 1 に従う。

## strings.json 新設キー

`writing_your_first_spec` namespace 配下に以下を追加（全て `{ en, ja }`）:

- `step0_heading`, `step0_body`
- `step5a_heading`, `step5a_body`
- `step5b_heading`, `step5b_body`, `step5b_table_<col>` x n
- `step5c_heading`, `step5c_body`, `step5c_bullet_structural`, `step5c_bullet_orphan`, `step5c_bullet_unregistered`
- `step6_heading`, `step6_body`
- `trouble_4_symptom`, `trouble_4_fix`, `trouble_5_symptom`, `trouble_5_fix`, `trouble_6_symptom`, `trouble_6_fix`
- `toc_row_step0`, `toc_row_step5a`, `toc_row_step5b`, `toc_row_step5c`, `toc_row_step6`

既存キーは改変しない（`step1_..step5_`, `trouble_1_..trouble_3_`, `toc_row_step1..5`, `toc_row_trouble`）。step5 は `step5a/b/c` に分割するので `step5_heading`/`step5_body` は**非推奨化して温存**（他から参照されないことを確認したら後続 plan で削除）。

## VM 差分

`WritingYourFirstSpecViewModel.ts` は `nextReadLinks` を配るだけ。変更不要。

## 検証手順

1. `.jsonui-doc-rules.json` が `section_step0`, `section_step5a` 等を許可しているか確認
2. `jui doc validate spec --file docs/screens/json/guides/writing-your-first-spec.spec.json` が pass
3. strings.json 追記後 `jui build` で warning 0
4. `jui verify --fail-on-diff` が pass
5. ブラウザ `/guides/writing-your-first-spec` を開いて 6 step + 6 trouble + 新 TOC を目視

## 作業見積り

- strings.json 編集: 20 keys × en+ja ≒ 40 entries ≒ 1h
- spec / layout 編集: 0.5h
- ブラウザ確認 + fix loop: 0.5h
- 計 **~2h**（他 4 本より軽い、既に骨格はできているため）

