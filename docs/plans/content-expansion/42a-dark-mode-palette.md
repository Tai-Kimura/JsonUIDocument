# 42a. Dark Mode パレット決定記録（Sumi × Cinnabar）

> Adjunct: [plan 42 (colors-and-theming)](42-colors-and-theming.md)。plan 42 が着手される前に
> `colors.json` の具体的な値を先に凍結しておく目的の決定記録。
>
> 承認: 2026-04-23

---

## 1. Aesthetic direction

**「Sumi × Cinnabar」**: warm-neutral dark foundation + brand blue 保持 + cinnabar 副次アクセント。

却下した候補:
- **Tailwind slate + blue**（`#020617 / #0F172A / #1E293B` + `#60A5FA`）: 量産型の dark mode、POV 無し
- **Pure black + neon**: dev tool としてはアリだが doc site には強すぎる
- **Dracula / Nord 系**: テーマ固有色が強すぎて brand blue と衝突

採用理由:
1. Warm neutral 基底で EN/JA 両方のテキストが馴染む（純 slate は JP が「硬い」）
2. Brand blue `#2563EB` 不変で iOS/Android/Web チュートリアルと一貫
3. Cinnabar（朱）副次アクセントで semantic layer を追加（error / new badge / callout）
4. Cyan focus ring で電子的・技術的味付け、brand blue と役割分離
5. CodeBlock は body より 1 段落とす inkstone black で visual hierarchy 強化

---

## 2. トークン一覧

### 2.1 Foundation（surface / border）

| token | light | dark | 用途 |
|---|---|---|---|
| `surface` | `#FFFFFF` | `#16161A` | カード bg |
| `surface_muted` | `#F9FAFB` | `#0E0E10` | ページ bg |
| `surface_sunken` | `#F3F4F6` | `#1F1F24` | hover / sidebar fill |
| `border` | `#E5E7EB` | `#27272D` | divider |
| `border_strong` | `#D1D5DB` | `#3A3A42` | 強調 divider |

### 2.2 Ink

| token | light | dark | 用途 |
|---|---|---|---|
| `ink` | `#0B1220` | `#F6F5F1` | 本文 text |
| `ink_muted` | `#475467` | `#D1CFC7` | subcopy |
| `ink_subtle` | `#64748B` | `#9E9B92` | caption |
| `ink_faint` | `#94A3B8` | `#6A6760` | hint |

dark の ink はすべて純白を避け、warm off-white（washi 紙の色）。

### 2.3 Accent（brand blue）

| token | light | dark | 用途 |
|---|---|---|---|
| `accent` | `#2563EB` | `#2563EB` | button bg |
| `accent_hover` | `#1D4ED8` | `#3B82F6` | hover（light は darker、dark は lighter） |
| `accent_ink` | `#FFFFFF` | `#FFFFFF` | accent bg 上の text |
| `accent_link` | `#2563EB` | `#60A5FA` | **NEW**：リンク text 色。dark では link 用に明るく（`#2563EB` は dark bg で AA fail） |
| `accent_tint` | `#EEF2FF` | `#1C2A52` | 選択行 bg |

### 2.4 Accent secondary（indigo、カテゴリアイコン等）

| token | light | dark | 用途 |
|---|---|---|---|
| `accent_secondary` | `#6366F1` | `#818CF8` | カテゴリアイコンの warm accent |
| `accent_secondary_tint` | `#E0E7FF` | `#1E1B4B` | pill / badge bg（install_target_card 等） |

### 2.5 Cinnabar / 朱（NEW semantic layer）

| token | light | dark | 用途 |
|---|---|---|---|
| `danger` | `#DC2626` | `#F43F5E` | error / destructive / required field（reference_attribute_row の "required" ラベル） |
| `danger_ink` | `#FFFFFF` | `#FFFFFF` | danger bg 上の text |
| `emphasis` | `#E11D48` | `#FB7185` | "NEW" badge / callout 強調 |

注: light `danger` は既存 layout の `#DC2626`（red-600）に合わせた。dark は `#F43F5E`（rose-500）でないと `#DC2626` が AA fail（2.9:1）なので mode でシフト。

### 2.6 Focus

| token | light | dark | 用途 |
|---|---|---|---|
| `focus` | `#60A5FA` | `#67E8F9` | キーボードフォーカスリング（dark は cyan-300 で電子的な鮮明さ） |

### 2.7 Chrome（topbar / sidebar）

| token | light | dark |
|---|---|---|
| `chrome_fill` | `#0B1220` | `#16161A` |
| `chrome_fill_hover` | `#111827` | `#1F1F24` |
| `chrome_border` | `#1F2937` | `#2F2F36` |
| `chrome_ink` | `#F9FAFB` | `#F6F5F1` |
| `chrome_ink_muted` | `#CBD5F5` | `#D1CFC7` |
| `chrome_ink_subtle` | `#94A3B8` | `#9E9B92` |

Light は既存のまま（暗い chrome / 明るい body）。Dark は surface と同値の `#16161A`（body より 1 段 elevated）。

### 2.8 CodeBlock

| token | light | dark |
|---|---|---|
| `code_bg` | `#F8FAFC` | `#0B0B0D` |
| `code_border` | `#E5E7EB` | `#27272D` |

Dark は surface_muted（`#0E0E10`）より**さらに暗い** inkstone black。

### 2.9 Legacy / misc

| token | light | dark | 用途 |
|---|---|---|---|
| `eyebrow` | `#93C5FD` | `#93C5FD` | eyebrow text。Phase 09 で大半は消えたが learn_index / home に残存 |
| `transparent` | `#00000000` | `#00000000` | breadcrumb_item の background（完全透過） |
| `pure_white` | `#FFFFFF` | `#FFFFFF` | 不変白 |
| `pure_black` | `#000000` | `#000000` | 不変黒 |

### 2.10 追加 tap / secondary-strong（初回 jui build で発見）

| token | light | dark | 用途 |
|---|---|---|---|
| `accent_tap` | `#EFF6FF` | `#1E3A8A` | `tapBackground` — breadcrumb_item / tab_header の押下ハイライト（tint と違い transient） |
| `accent_secondary_strong` | `#4F46E5` | `#6366F1` | indigo-600 — reference_code_example / reference_related_pill の fontColor（accent_secondary より濃い text 色） |

---

## 3. Contrast 検証（WCAG 2.1）

| ペア | 比 | 判定 |
|---|---|---|
| **dark ink** `#F6F5F1` / **dark surface_muted** `#0E0E10` | 18.2 : 1 | AAA |
| dark ink_muted `#D1CFC7` / dark surface_muted | 13.2 : 1 | AAA |
| dark ink_subtle `#9E9B92` / dark surface_muted | 7.3 : 1 | AAA |
| dark ink_faint `#6A6760` / dark surface_muted | 3.4 : 1 | AA (large) |
| dark **accent_link** `#60A5FA` / dark surface_muted | 7.6 : 1 | AAA |
| dark accent_hover `#3B82F6` / dark surface_muted | 5.3 : 1 | AA |
| dark **accent_ink white** / dark accent `#2563EB` | 8.6 : 1 | AAA |
| dark **danger** `#F43F5E` / dark surface_muted | 5.3 : 1 | AA |
| dark emphasis `#FB7185` / dark surface_muted | 7.0 : 1 | AAA |
| dark focus `#67E8F9` / dark surface_muted | 12.9 : 1 | AAA |

注意:
- `accent` `#2563EB` は dark bg 上の **text として直置きすると 3.8 : 1 で AA fail**。text では必ず `accent_link` を使う。`accent` は button bg 専用。
- `ink_faint` は意図的に低コントラスト（hint 用）。normal body text には使わない。

---

## 4. JSON スキーマ（upstream colors-multitheme 準拠）

`docs/screens/layouts/Resources/colors.json` に landed。初回 `jui build` で全 hex が自動的に semantic key に置換され、dark palette も preserve された。

---

## 5. 既存 layout のマイグレーション対象

`grep -rohE '#[0-9A-Fa-f]{6}' docs/screens/layouts` で抽出した既存 hex。各 hex → token の mapping:

| hex | 出現数 | → token | 備考 |
|---|---|---|---|
| `#0B1220` | 360 | `ink` / `chrome_fill` | 位置により使い分け（本文 text か topbar bg か） |
| `#475467` | 242 | `ink_muted` | |
| `#F9FAFB` | 204 | `surface_muted` / `chrome_ink` | |
| `#64748B` | 94 | `ink_subtle` | |
| `#FFFFFF` | 78 | `surface` / `accent_ink` / `danger_ink` / `pure_white` | button text か card bg か |
| `#F3F4F6` | 70 | `surface_sunken` | |
| `#94A3B8` | 29 | `ink_faint` / `chrome_ink_subtle` | |
| `#6366F1` | 29 | `accent_secondary` | カテゴリアイコン |
| `#2563EB` | 23 | `accent` / `accent_link` | button bg か text か |
| `#E5E7EB` | 11 | `border` / `code_border` | |
| `#CBD5F5` | 9 | `chrome_ink_muted` | |
| `#93C5FD` | 7 | `eyebrow` | learn_index / home eyebrow text |
| `#EEF2FF` | 3 | `accent_tint` | |
| `#E0E7FF` | 3 | `accent_secondary_tint` | pill bg |
| `#EFF6FF` | 2 | `accent_tap` | breadcrumb / tab_header の tapBackground（hover 専用の soft tint、accent_tint と区別） |
| `#4F46E5` | 2 | `accent_secondary_strong` | reference_code_example / reference_related_pill の fontColor（indigo-600 text） |
| `#00000000` | 1 | `transparent` | breadcrumb_item background（完全透過） |
| `#DC2626` | 1 | `danger` | 新 token に集約 |
| `#1F2937` | 1 | `chrome_border` | |
| `#0F172A` | 1 | `ink` | one-off、slate-900。ink に寄せる |
| `#000000` | 1 | `pure_black` | 不変リテラル、置換不要 |

**移行戦略**:
1. `jui build` の自動マイグレーションで既存 hex がそのまま `light` palette に昇格（キー名は未割り当て）
2. Phase 1 landing 後、マニュアルで上記 mapping に従い **hex → token 名** の置換 PR を切る
   - `jui build --extract-into=dark` は使わない（dark 側は手書きで始める）
3. 置換後に `jui build` で warning が 0 になっていること確認
4. dark palette はこの plan の §2 をそのまま `colors.json` に書き込み

---

## 6. 将来拡張のフック

- **Tailwind 連携** — `jsonui-doc-web/tailwind.config.js` にもこのトークン名で CSS variable を吐く or extend.colors にマップする。現状 `globals.css` に `--color-*` が直書きされているので、themed 対応で「`globals.css` → colors.json から自動生成」に移行する（別セッション）。
- **Shiki theme 入れ替え** — `code_bg: #0B0B0D` に合わせ、dark は `one-dark-pro` ベースで `keyword` を `#F43F5E`（cinnabar）に override した bespoke theme を書く。CodeBlock カスタムコンポーネントの props で theme 名を切替。
- **Print stylesheet** — print 時は強制 light mode + ink 真黒のシンプル PDF 向けパレット（別議論）。

---

## 7. 変更履歴

| date | 変更 | 備考 |
|---|---|---|
| 2026-04-23 | 初版、承認 | Sumi × Cinnabar direction 確定 |
