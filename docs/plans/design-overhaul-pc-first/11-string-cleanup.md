---
title: "Phase 11 — Strings cleanup after chrome migration"
status: open
depends_on: [07, 09]
enables: [12]
owner: jsonui-define
---

# Phase 11 — Strings cleanup

## Why

Phases 07 + 09 orphaned a class of strings (`*_lang_toggle`, `onToggleLanguage`-related copy, TabView labels, `current_language` debug labels). None of the generated components reference them anymore, but they still live in `docs/screens/layouts/Resources/strings.json`. Sweep them now.

Also: the chrome itself needs its new `chrome` + extended `search` namespace entries registered. Phases 03–05 pre-declared those in their own plans; this phase consolidates the paste.

## In scope

1. Register all `chrome` + `nav_*_label` / `_blurb` + `home_whats_new_*` keys in `strings.json` (source of truth: `docs/screens/layouts/Resources/strings.json`, NOT the distributed copy at `jsonui-doc-web/src/Layouts/Resources/strings.json`).
2. Delete orphaned keys after confirming no generated component references them.
3. Run `jsonui-localize` sweep if needed for any unseeded JA translations.

## Out of scope

- Any spec / layout / VM edits — those all landed in Phases 03–09.

## Keys to add (consolidated from 03/04/05)

```json
{
  "chrome": {
    "brand_name":              { "en": "JsonUI",                               "ja": "JsonUI" },
    "brand_tagline":           { "en": "Docs",                                  "ja": "ドキュメント" },
    "search_placeholder":      { "en": "Search docs",                           "ja": "ドキュメントを検索" },
    "topbar_aria_label":       { "en": "Site header",                           "ja": "サイトヘッダー" },
    "lang_toggle_aria_label":  { "en": "Switch language",                       "ja": "言語を切り替え" },
    "lang_toggle_label_en":    { "en": "日本語",                                 "ja": "日本語" },
    "lang_toggle_label_ja":    { "en": "English",                               "ja": "English" },
    "sidebar_aria_label":      { "en": "Documentation navigation",              "ja": "ドキュメントナビゲーション" },
    "collapse_aria_label":     { "en": "Collapse section",                      "ja": "セクションを閉じる" },
    "expand_aria_label":       { "en": "Expand section",                        "ja": "セクションを開く" },
    "mobile_menu_open":        { "en": "Open navigation",                       "ja": "ナビゲーションを開く" },
    "mobile_menu_close":       { "en": "Close navigation",                      "ja": "ナビゲーションを閉じる" },
    "nav_learn_label":         { "en": "Learn",                                 "ja": "学ぶ" },
    "nav_learn_blurb":         { "en": "Stand up your first JsonUI screen.",    "ja": "最初の JsonUI 画面を通しで作る。" },
    "nav_guides_label":        { "en": "Guides",                                "ja": "ガイド" },
    "nav_guides_blurb":        { "en": "Recipes for common problems.",          "ja": "実務で頻出の問題の処方箋。" },
    "nav_concepts_label":      { "en": "Concepts",                              "ja": "コンセプト" },
    "nav_concepts_blurb":      { "en": "Why JsonUI is shaped the way it is.",   "ja": "JsonUI がなぜこの形なのか。" },
    "nav_reference_label":     { "en": "Reference",                             "ja": "リファレンス" },
    "nav_reference_blurb":     { "en": "Attributes, components, CLI, MCP, JSON Schema.", "ja": "属性・コンポーネント・CLI・MCP・JSON Schema の網羅。" },
    "nav_platforms_label":     { "en": "Platforms",                             "ja": "プラットフォーム" },
    "nav_platforms_blurb":     { "en": "How the generator emits Swift/Kotlin/React.", "ja": "Swift / Kotlin / React をどう生成するか。" },
    "nav_tools_label":         { "en": "Tools",                                 "ja": "ツール" },
    "nav_tools_blurb":         { "en": "CLI, MCP, helper, test runner, agents.", "ja": "CLI / MCP / ヘルパー / テストランナー / エージェント。" }
  }
}
```

All the `home.whats_new_*` keys land in the `home` namespace (see Phase 08 for paste).

## Keys to delete

Grep-driven — run these from the repo root after Phases 07 + 09 are in:

```bash
# Find orphaned lang-toggle entries — these should all be deletable.
grep -r "lang_toggle\|onToggleLanguage\|current_language_title" \
  docs/screens/layouts/Resources/strings.json

# Confirm no layout / VM / generated component still references them.
grep -r "lang_toggle\|onToggleLanguage" docs/screens/layouts/
grep -r "onToggleLanguage" jsonui-doc-web/src/viewmodels/
```

Expected orphans (check and delete):

- `home.hero_lang_toggle`
- `home.nav_learn` / `nav_guides` / `nav_reference` / `nav_platforms` / `nav_tools` / `nav_concepts` (the TabView labels; chrome uses `chrome.nav_*_label` now — different keys)
- `home.current_language_title` (if present)
- `learn_installation.lang_toggle` and the same key on 27 other namespaces

Do NOT delete:
- `home.search_placeholder` — TopBar's Search still defaults to this key (see `Search.tsx:140`).

## Styles cleanup

After Phase 09, the `page_header` style in `styles.json` is unreferenced. Delete it in this phase (or keep it marked `@deprecated` for one release — project call).

## Acceptance

- `validate-strings` → OK.
- `jui build` zero warnings.
- No grep match for `*_lang_toggle` in generated TSX under `jsonui-doc-web/src/generated/`.
- JSON validity: `jq '.' docs/screens/layouts/Resources/strings.json > /dev/null` passes.

## Open questions

- Should orphans linger for one release before deletion (semver-ish) or be removed immediately? This is an internal docs site, not a library, so immediate deletion is fine. Proposal: delete now.
