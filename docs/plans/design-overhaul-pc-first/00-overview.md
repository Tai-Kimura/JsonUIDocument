---
title: "PC-first design overhaul — overview"
status: open
owner: docs-web
last_updated: 2026-04-23
---

# PC-first design overhaul — overview

## TL;DR

The docs site currently reads as a mobile / marketing landing page on a 1440px+ viewport. Hero bands stretch edge-to-edge, chrome lives only on home, and navigation between sections is a bottom `TabView` meant for a phone. We are converting it into a PC-first developer docs site — Stripe / Vercel / Linear silhouette — with a **persistent left sidebar**, a **site-wide top bar**, and tighter content widths.

The previous attempt landed the chrome as hand-written React under `src/components/chrome/**`. That broke the dogfood principle — this site exists to demonstrate JsonUI, so every reusable piece belongs on the spec → converter → generated-TSX pipeline. This overhaul throws away that hand-written chrome and rebuilds it the correct way.

## Why multiple plans

The overhaul is large and touches specs, layouts, VMs, custom component specs, converters, SVG assets, strings, and RootLayout wiring. One giant plan is unreviewable. Each file below is a **self-contained work unit** an agent can pick up and finish in a single session.

## Phase map

```
 01 chrome-rollback   ─┐
                       ├─▶ 02 icon-assets ─┐
                       │                   ├─▶ 03 sidebar-component ─┐
                       │                   │                         ├─▶ 05 chrome-screen ─▶ 06 rootlayout-integration
                       │                   └─▶ 04 topbar-component ──┘
                       │
                       └─▶ 07 home-strip-down ──▶ 08 home-whats-new
                                                   │
                                                   ├─▶ 09 page-header-refactor ─▶ 10 toc-to-rail
                                                   │
                                                   └─▶ 11 string-cleanup ─▶ 12 category-index-routes
```

## Plan files

| # | File | Scope | Primary executor |
|---|---|---|---|
| 01 | [01-chrome-rollback.md](01-chrome-rollback.md) | Delete hand-written `src/components/chrome/**`, restore RootLayout to a plain passthrough, keep design tokens | web |
| 02 | [02-icon-assets.md](02-icon-assets.md) | Author 12 SVG icons under `docs/screens/images/`; `jui build` distributes them | design + web |
| 03 | [03-sidebar-component.md](03-sidebar-component.md) | Sidebar as a JsonUI custom component (spec + converter + React impl) | jsonui-define + jsonui-implement |
| 04 | [04-topbar-component.md](04-topbar-component.md) | TopBar as a JsonUI custom component (spec + converter + React impl) | jsonui-define + jsonui-implement |
| 05 | [05-chrome-screen.md](05-chrome-screen.md) | Chrome screen spec + layout + ViewModel that composes TopBar + Sidebar and seeds the nav catalog | jsonui-define + jsonui-implement |
| 06 | [06-rootlayout-integration.md](06-rootlayout-integration.md) | Next.js `RootLayout` wires the generated Chrome and reserves CSS space for it | web |
| 07 | [07-home-strip-down.md](07-home-strip-down.md) | Remove TabView / inline Search / inline lang toggle / currentLanguage debug label from home spec, layout, VM | jsonui-define + jsonui-implement |
| 08 | [08-home-whats-new.md](08-home-whats-new.md) | "What's new" ribbon on home: new cell spec + CollectionDataSource + ViewModel seed | jsonui-define + jsonui-implement |
| 09 | [09-page-header-refactor.md](09-page-header-refactor.md) | Drop the dark hero band + per-page lang toggle on 28 content pages | jsonui-define + jsonui-implement |
| 10 | [10-toc-to-rail.md](10-toc-to-rail.md) | Move `TableOfContents` to a sticky right rail on pages that author one | jsonui-define + jsonui-implement |
| 11 | [11-string-cleanup.md](11-string-cleanup.md) | Remove orphaned `*_lang_toggle` / `onToggleLanguage` keys from strings.json after Phase 09 lands | jsonui-define |
| 12 | [12-category-index-routes.md](12-category-index-routes.md) | Add `/learn`, `/guides`, ... routes that render the existing `*_index.json` screens | web |

## Audit — what reads as mobile / 2024-marketing on PC

Citations use `path:line`.

### Hero / chrome

- `docs/screens/layouts/home.json:9–228` — the whole screen is a single vertical `Scroll` with full-width hero bands (`#0B1220`) and a `TabView` pinned at 64px at the bottom. The `TabView` is a bottom-tabbar pattern: it works on a phone, not on a laptop where 6 categories deserve a persistent left rail, not 6 thumb-targets at the bottom of the viewport.
  - `home.json:206–224` — `TabView` with 6 tabs (`nav_learn`, `nav_guides`, `nav_reference`, `nav_platforms`, `nav_tools`, `nav_concepts`).
  - `home.json:33–128` — hero section stretches edge-to-edge with 44px title; no max-content-width, so on a 1920px monitor the copy wraps at 90+ characters — unreadable line length.
  - `home.json:49–56` — Search lives inline inside the hero, only visible on home.
  - `home.json:57–63` — language toggle is inline inside the hero. Every other page re-declares its own lang toggle, duplicating copy 28 times.

### Per-page headers

Every content page duplicates a near-identical header (example: `docs/screens/layouts/learn/installation.json:36–106` — dark hero, 44px headline, language toggle, CTA block). On a laptop this produces a repetitive 300px dark slab every page load.

### Body widths

Content max-widths are not capped. On 1920px the 3-column `Collection` cards inflate and body copy wraps at 90+ characters.

### Navigation IA

Home's `TabView` is the only way to reach the category indexes. `/learn`, `/guides`, etc. return 404. Category indexes exist as `*_index.json` but have no URL of their own (Phase 12 fixes this).

## Rollout order

1. **Phase 01** — rollback. Tiny, reversible, leaves the site visually naked but working.
2. **Phase 02 → 04** — authorable building blocks: icon SVGs, Sidebar component, TopBar component. These can land in any order after Phase 02, but Phase 05 depends on all three.
3. **Phase 05** — Chrome screen composes them.
4. **Phase 06** — RootLayout mounts the generated Chrome. At this point the site has a sidebar + topbar again, this time spec-driven.
5. **Phase 07** → **Phase 08** — home cleanup + "what's new".
6. **Phase 09 → 11** — per-page header refactor, TOC-to-rail, string cleanup. Phases 09 & 10 are mechanically similar and can share one agent session per layout.
7. **Phase 12** — category-index routes (pure web work, last).

Each phase has its own gates (`jui build` zero warnings, `jui verify --fail-on-diff` clean, `tsc` clean, `next build` succeeds). The next plan is only safe to start when the previous phase's gates pass.

## Open questions

- **Does JsonUI support a "children slot" in custom components?** The Chrome screen (Phase 05) wants Sidebar + TopBar as siblings of a `{children}` placeholder, but JsonUI-generated components don't natively accept children. Phase 05's answer: Chrome only renders Sidebar + TopBar (no children). RootLayout renders `<Chrome />` as a sibling of `<main>{children}</main>`, and CSS reserves the page-content area. See Phase 05 §3.
- **Sidebar responsive behavior on narrow viewports.** PC-first means ≥1024px primary target, but a simple "sidebar hides behind a menu button" fallback below 1024px is expected. Handled in Phase 03.
- **Where does the nav catalog live?** Static catalog seeded by `ChromeViewModel` (Phase 05) from the same category lists that drive home's catalog entries. No runtime `search-index.json` fetch — keeps the chrome SSR-clean.
