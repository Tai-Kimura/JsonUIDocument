---
title: "Phase 08 — 'What's new' ribbon on home"
status: open
depends_on: [07]
enables: [09]
owner: jsonui-define + jsonui-implement
---

# Phase 08 — Home "What's new" ribbon

## Why

The home page no longer has the 6-tab category switcher (removed in Phase 07). The lower third of the fold is empty. Fill it with a **changelog ribbon** — up to 3–4 cards that tell a returning reader "what landed since your last visit". Low-maintenance (static seed from the ViewModel, no API, no runtime fetch). Gives home a reason to return to; hides the empty slot.

## In scope

1. New cell component: `docs/screens/json/cells/changelog_card.cell.json` + `docs/screens/layouts/cells/changelog_card.json`.
2. New uiVariable on `home.spec.json`: `recentChanges: [ChangelogCard]` + customType.
3. New layout block on `home.json` under the hero, featured, and platforms sections.
4. New seed in `HomeViewModel.ts`: `RECENT_CHANGES` array, hydrated and pushed via `updateData({ recentChanges: this.asCollection(recentChanges) })`.
5. Strings for section heading + subheading + each card's copy.

## Out of scope

- Per-page refactors → Phase 09.

## Cell contract (`ChangelogCard`)

Properties:

| Prop | Type | Description |
|---|---|---|
| `id` | `String` | Cell key. |
| `date` | `String` | Display date (pre-formatted, e.g. "Apr 2026"). |
| `title` | `String` | Card headline. Already localized (VM seeds via StringManager). |
| `blurb` | `String` | 1–2 sentence description. Localized. |
| `ctaLabel` | `String` | Link label. Localized. |
| `ctaUrl` | `String` | Destination. |
| `onTap` | `() -> Void` | Tap handler (calls `router.push(ctaUrl)`). |

### Cell layout (brief, not literal JSON)

Card with rounded corners + white surface + 20px padding + 12px gap between elements:
```
changelog_card
├── Label     (date, 11px, subtle color)
├── Label     (title, 18px, semibold, ink)
├── Label     (blurb, 13px, muted, 2-line clamp)
└── Label     (ctaLabel, 13px, semibold, accent, onClick @{onTap})
```

Reuse `card_surface` style from home's existing cards if present; otherwise add one.

## Spec additions to `home.spec.json`

**uiVariable** — `recentChanges: [ChangelogCard]`, initial `[]`, seeded by `onAppear`.

**customTypes** — add `ChangelogCard` with the properties above.

**Description update** — metadata.description should mention the "What's new" ribbon so it doesn't drift.

## Layout additions to `home.json`

After the existing platforms section and before the footer (if any), add:

```
home_whats_new (View, vertical, matchParent × wrapContent, paddings: [48, 32, 48, 32])
├── Label "@string/home_whats_new_heading"    (32px, bold)
├── Label "@string/home_whats_new_subheading" (15px, muted)
└── Collection (3 cols, cell = cells/changelog_card, data=@{recentChanges})
```

Same width-cap pattern as the featured section (max section width 1120px).

## ViewModel seed

```ts
const RECENT_CHANGES: ReadonlyArray<{
  id: string; date: string; titleKey: string; blurbKey: string; ctaLabelKey: string; ctaUrl: string;
}> = [
  {
    id: "installation-oneliner",
    date: "Apr 2026",
    titleKey: "home_whats_new_installation_oneliner_title",
    blurbKey: "home_whats_new_installation_oneliner_blurb",
    ctaLabelKey: "home_whats_new_installation_oneliner_cta",
    ctaUrl: "/learn/installation",
  },
  // … 2–3 more recent items, hand-curated
];
```

Seeded inside `onAppear`:

```ts
const recentChanges: ChangelogCardCell[] = RECENT_CHANGES.map(r => ({
  id: r.id,
  date: r.date,
  title: StringManager.getString(r.titleKey),
  blurb: StringManager.getString(r.blurbKey),
  ctaLabel: StringManager.getString(r.ctaLabelKey),
  ctaUrl: r.ctaUrl,
  onTap: () => this.navigate(r.ctaUrl),
}));
this.updateData({ recentChanges: this.asCollection(recentChanges) });
```

## Strings

Paste-ready entries for `strings.json` under the `home` namespace:

```json
{
  "home": {
    "whats_new_heading":    { "en": "What's new",                                               "ja": "最近の更新" },
    "whats_new_subheading": { "en": "Recent docs and library changes worth a look.",           "ja": "最近入ったドキュメント／ライブラリの変更。" },
    "whats_new_installation_oneliner_title": { "en": "Installation is now one line",           "ja": "インストールがワンライナーに" },
    "whats_new_installation_oneliner_blurb": { "en": "A single curl installs the CLI, the MCP server, and the agent pack.", "ja": "curl 1 行で CLI、MCP サーバー、エージェント一式が入ります。" },
    "whats_new_installation_oneliner_cta":   { "en": "Read the install guide",                 "ja": "インストールガイドを読む" }
  }
}
```

Add 2–3 more changelog entries following the same shape. Dates stay in English only (short form).

## Acceptance

- `jui build` zero warnings, `jui verify` clean.
- `npx tsc --noEmit` 0 errors.
- Home renders the new ribbon under the platforms section with 3–4 cards; clicking one navigates.
- Language toggle flips all card copy.

## Open questions

- Should the ribbon surface a "See full changelog" footer link? Deferred — add in a follow-up once there's a changelog page.
