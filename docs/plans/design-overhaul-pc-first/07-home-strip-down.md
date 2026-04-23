---
title: "Phase 07 — Strip the TabView / inline Search / lang toggle from home"
status: open
depends_on: [06]
enables: [08]
owner: jsonui-define + jsonui-implement
---

# Phase 07 — Home strip-down

## Why

Home used to do double duty as "landing page" + "navigation surface". With the sidebar + top bar now owning navigation (Phases 03–06), home goes back to being a landing page. Every surface that duplicated or substituted for chrome comes out.

## In scope

Edit `docs/screens/json/home.spec.json`, `docs/screens/layouts/home.json`, and `jsonui-doc-web/src/viewmodels/HomeViewModel.ts` to remove:

1. The inline `Search` widget inside `home_hero` (`home.json:49–56`).
2. The `home_lang_toggle` button inside `home_hero` (`home.json:57–63`).
3. The `home_current_language` debug label (`home.json:118–127`).
4. The full `TabView` block (`home.json:206–224`), including its tab definitions for `nav_learn` / `nav_guides` / `nav_reference` / `nav_platforms` / `nav_tools` / `nav_concepts`.
5. The `selectedTabIndex` data field and the corresponding uiVariable in `home.spec.json`.

Also in the ViewModel (`HomeViewModel.ts`): drop the `setSelectedTabIndex` handler, the `searchPlaceholder` seed line, the `onToggleLanguage` handler (top bar owns it now), and the per-tab catalog maps (`LEARN_ENTRIES`, `GUIDES_ENTRIES`, …) if they're now unreferenced. Keep `FEATURED_LINKS` + `PLATFORM_CARDS`.

## Out of scope

- The "What's new" ribbon that replaces the TabView slot → Phase 08.
- Per-page dark-hero removal → Phase 09.
- TOC-to-rail → Phase 10.

## Work items (high-level)

1. **Spec edit** — `home.spec.json`:
   - Remove uiVariables: `selectedTabIndex`, `searchPlaceholder` (self-localized by Search now), `currentLanguage` (top bar owns it; home doesn't need the mirror).
   - Remove eventHandlers: `setSelectedTabIndex`, `onToggleLanguage`.
   - Keep: `featuredLinks`, `platformCards`, `learnIndexData` … wait — those are TabView collection sources. If the TabView is removed, those collections have no consumer. Remove them too if no other surface references them.
   - Update the `dataFlow.diagram` to reflect the simplified state surface.

2. **Layout edit** — `home.json`:
   - Delete the `home_hero` children at lines 49–63 (Search + lang toggle).
   - Delete the `home_current_language` block (lines 118–127).
   - Delete the entire `home_tabview` block (lines 206–224).
   - In the `data` block, remove `selectedTabIndex`, `searchPlaceholder`, `currentLanguage`, `onToggleLanguage` declarations.

3. **ViewModel edit** — `HomeViewModel.ts`:
   - Delete `setSelectedTabIndex`, `onToggleLanguage`.
   - Delete the 6 catalog constant arrays if the spec no longer declares `learnIndexData` etc.
   - Keep `featuredLinks`, `platformCards`, `hydrateFeaturedLink`, `hydratePlatformCard`, `onHeroInstallTap` / `onHeroAiAgentsTap` / `onHeroShowcaseTap`.
   - Update `onAppear` accordingly.

4. **Hero cap** — while we're here, add a wrapper `View` around `home_hero`'s inner content (inside the existing `home_hero_inner` block) that caps its width: `width: "matchParent"`, `maxWidth: 720`, `alignCenter: true`. This keeps the hero readable at 1920px without turning into a second refactor phase.

## Strings

Running into key orphans is handled by Phase 11. Don't delete any strings in this phase — they stay in `strings.json` for one release, then Phase 11 sweeps them.

Orphans introduced by this phase:
- `home.hero_lang_toggle`
- `home.current_language_title` (if authored; check before declaring it orphaned)
- `home.nav_learn` / `_guides` / `_reference` / `_platforms` / `_tools` / `_concepts` (TabView labels)
- `home.search_placeholder` — becomes unused once the inline Search is gone AND the TopBar's Search (which reads this same key as its default; see `Search.tsx:140`) continues to use it. Conclusion: key stays — TopBar needs it. Double-check and leave in.

## Acceptance

- `jui build` zero warnings, no drift.
- `jui verify --fail-on-diff` clean.
- `npx tsc --noEmit` 0 errors.
- `npm run build` succeeds.
- Home renders: hero (capped width) + featured cards + platform cards + (empty gap where "What's new" will land in Phase 08). No floating / inline Search, no inline language toggle, no bottom tabbar.

## Open questions

- Should the hero `home_hero_cta_secondary` / `_tertiary` buttons survive the strip-down? Proposal: keep both. The hero still wants a 2-button CTA cluster ("Install" + "Explore agents"). Only the inline Search and language toggle go.
