---
title: "Phase 05 — Chrome screen: spec, layout, and ViewModel"
status: open
depends_on: [03, 04]
enables: [06]
owner: jsonui-define + jsonui-implement
---

# Phase 05 — Chrome screen

## Why

With Sidebar + TopBar authored as custom components, the next step is the **composition** — a JsonUI screen that places them together, seeds the nav catalog, and owns the collapse / language state. The generated Chrome.tsx becomes the single client component RootLayout mounts (Phase 06).

## In scope

1. `docs/screens/json/chrome.spec.json` — screen spec (metadata, uiVariables, eventHandlers, customTypes, relatedFiles).
2. `docs/screens/layouts/chrome.json` — layout composing TopBar + Sidebar.
3. `jsonui-doc-web/src/viewmodels/ChromeViewModel.ts` — hand-written ViewModel body (scaffolded via `jui g project`, body is ours to author).

## Out of scope

- `RootLayout.tsx` wiring → Phase 06.
- Per-page removal of lang toggles → Phase 09.
- "What's new" on home → Phase 08.

## Spec contract (`chrome.spec.json`)

### metadata

- `name`: `"Chrome"`, `displayName`: `"Site chrome"`, `layoutFile`: `"chrome"`.
- `platforms`: `["web"]` (for now — iOS/Android chrome could follow the same spec with platform-specific layouts later).

### stateManagement

**uiVariables**:

| Name | Type | Initial | Description |
|---|---|---|---|
| `navItems` | `[SidebarSection]` | `[]` | 6-section catalog seeded by `onAppear`. Each section has id, label, iconName, and the list of pages it owns. |
| `activeUrl` | `String` | `""` | Mirrors `usePathname()`. Seeded by the hook layer, updated via `onRouteChange(url)`. |
| `collapsedIds` | `[String]` | `[]` | Section ids the user has collapsed. Auto-expands the containing section of `activeUrl` when it changes. |
| `mobileOpen` | `Bool` | `false` | Whether the mobile drawer is open. |
| `currentLanguage` | `String` | `"en"` | Mirror of `StringManager.language` so the language toggle label flips reactively. |

**eventHandlers**:

| Name | Params | Description |
|---|---|---|
| `onAppear` | — | Build `navItems` from the static catalog. Seeds `currentLanguage`. |
| `onRouteChange` | `url: String` | Push `url` → `activeUrl`. Auto-expand the containing section. Called from the hook layer when `usePathname()` changes. |
| `onToggleSection` | `id: String` | Toggle membership in `collapsedIds`. |
| `onToggleMobileMenu` | — | Flip `mobileOpen`. |
| `onToggleLanguage` | — | `StringManager.setLanguage(next)`; re-run `onAppear` so every label re-resolves; set `currentLanguage`. |
| `onLinkTap` | `url: String` | On mobile, close the drawer. No preventDefault. |

### customTypes

Same shapes as Phase 03 §Custom types (`SidebarSection`, `SidebarEntry`). Re-declare here so the screen spec is self-contained (component and screen specs don't share type tables).

### dataFlow.diagram

```
flowchart TD
  VIEW[ChromeView] --> VM[ChromeViewModel]
  VM -- navItems --> VIEW
  VM -- activeUrl --> VIEW
  VM -- collapsedIds --> VIEW
  VM -- mobileOpen --> VIEW
  VM -- currentLanguage --> VIEW
  VIEW -- onAppear --> VM
  VIEW -- onRouteChange(url) --> VM
  VIEW -- onToggleSection(id) --> VM
  VIEW -- onToggleMobileMenu --> VM
  VIEW -- onToggleLanguage --> VM
  VIEW -- onLinkTap(url) --> VM
```

## Layout (`chrome.json`)

Skeleton (brief, not literal JSON — `jsonui-implement` authors the actual file):

```
chrome (root View)
├── data block
│     navItems: Array, activeUrl: String, collapsedIds: Array,
│     mobileOpen: Bool, currentLanguage: String,
│     onToggleSection: () -> Void, onToggleLanguage: () -> Void,
│     onToggleMobileMenu: () -> Void, onLinkTap: () -> Void
├── TopBar
│     brandLabel="chrome_brand_name"
│     currentLanguage="@{currentLanguage}"
│     onToggleLanguage="@{onToggleLanguage}"
│     onToggleMobileMenu="@{onToggleMobileMenu}"
└── Sidebar
      items="@{navItems}"
      activeUrl="@{activeUrl}"
      collapsedIds="@{collapsedIds}"
      onToggleSection="@{onToggleSection}"
      onLinkTap="@{onLinkTap}"
```

Root View uses `orientation: vertical` but both TopBar and Sidebar will `position: fixed` in their own CSS, so the vertical-stack ordering is semantic only. Do NOT include a slot for page content — the generated Chrome.tsx renders only these two children. Page content lives beside Chrome in RootLayout, reserved by CSS padding (Phase 06).

## ViewModel body

File: `jsonui-doc-web/src/viewmodels/ChromeViewModel.ts`.

### Structure

```ts
export class ChromeViewModel extends ChromeViewModelBase {
  constructor(router, getData, setData) {
    super(router, getData, setData);
    this.initializeEventHandlers();
    this.onAppear();
  }

  protected initializeEventHandlers = () => {
    this.updateData({
      onToggleSection: this.onToggleSection,
      onToggleMobileMenu: this.onToggleMobileMenu,
      onToggleLanguage: this.onToggleLanguage,
      onLinkTap: this.onLinkTap,
    });
  };

  onAppear = () => {
    this.updateData({
      navItems: this.buildNavItems(),
      currentLanguage: StringManager.language,
    });
  };

  onRouteChange = (url: string): void => {
    const prev = this.data;
    const section = NAV_CATALOG.find(s => s.entries.some(e => e.url === url));
    const nextCollapsed = section
      ? (prev.collapsedIds ?? []).filter(id => id !== section.id)
      : (prev.collapsedIds ?? []);
    this.updateData({ activeUrl: url, collapsedIds: nextCollapsed });
  };

  onToggleSection = (id: string): void => {
    const cur = this.data.collapsedIds ?? [];
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    this.updateData({ collapsedIds: next });
  };

  onToggleMobileMenu = (): void => {
    this.updateData({ mobileOpen: !this.data.mobileOpen });
  };

  onToggleLanguage = (): void => {
    const next = StringManager.language === "en" ? "ja" : "en";
    StringManager.setLanguage(next);
    this.onAppear(); // re-seed labels in the new language
  };

  onLinkTap = (_url: string): void => {
    if (this.data.mobileOpen) this.updateData({ mobileOpen: false });
  };

  private buildNavItems = (): SidebarSection[] => {
    return NAV_CATALOG.map(section => ({
      id: section.id,
      label: this.s(`nav_${section.id}_label`),
      iconName: section.id,       // "learn" -> consumer prepends icon_ → /images/icon_learn.svg
      entries: section.entries.map(e => ({
        id: e.id,
        label: StringManager.getString(e.titleKey),
        url: e.url,
      })),
    }));
  };

  private s = (suffix: string) => StringManager.getString(`chrome_${suffix}`);
}

// Static catalog — id must match the SVG basename convention from Phase 02.
const NAV_CATALOG: ReadonlyArray<{
  id: "learn" | "guides" | "concepts" | "reference" | "platforms" | "tools";
  entries: ReadonlyArray<{ id: string; titleKey: string; url: string }>;
}> = [
  { id: "learn", entries: [
    { id: "installation",  titleKey: "learn_installation_title",    url: "/learn/installation" },
    { id: "hello-world",   titleKey: "learn_hello_world_title",     url: "/learn/hello-world" },
    // … one line per leaf page, same pattern
  ] },
  // … 5 more sections
];
```

Follow `HomeViewModel`'s `LEARN_ENTRIES` etc. arrays — those already enumerate every leaf page and can be copied verbatim into `NAV_CATALOG` here. The hand-written chrome's `navCatalog.ts` (deleted in Phase 01) also captured the exact shape — refer to git history if the agent needs a reference copy.

## Hook wiring

The generated hook (`useChromeViewModel.ts`) calls `useRouter()` + `usePathname()`. The Chrome screen's page component (which wraps the generated Chrome.tsx) watches `pathname` and calls `vm.onRouteChange(pathname)` inside a `useEffect`. That's the bridge from Next.js routing into ViewModel state.

This integration is a `ChromeWrapper.tsx` file the agent creates — a thin client-side wrapper that:
1. Instantiates the ViewModel via the generated hook.
2. Runs `useEffect(() => vm.onRouteChange(pathname), [pathname])`.
3. Renders `<ChromeView data={data} />` (the generated component).

Place it at `jsonui-doc-web/src/components/chrome/ChromeWrapper.tsx`. Only this wrapper needs `"use client"`; everything else inside the generated tree inherits.

## Acceptance

- `jui build` zero warnings.
- `jui verify --fail-on-diff` clean.
- `npx tsc --noEmit` 0 errors.
- A render probe: temporarily mount `<ChromeWrapper />` inside a test page and confirm the sidebar + top bar render with localized labels, collapsible sections work, language toggle flips every label (including entries under each section), and active-route highlighting responds to `usePathname()` changes.

## Open questions

- None after Phase 03/04 decisions. If the render probe reveals a flash of un-seeded chrome during hydration, consider server-rendering the initial nav catalog via a `getInitialData()` hook — deferred to a follow-up.
