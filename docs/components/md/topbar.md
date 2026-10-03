# TopBar

**Category:** navigation

Site-wide sticky header. Renders as a 56px fixed bar at the viewport top containing (left→right): a hamburger button that is only visible under 1024px (fires onToggleMobileMenu), a brand mark linking to brandHref (usually '/'), a flexible spacer, the Search trigger instance (reuses the existing Search component), and a language toggle pill that fires onToggleLanguage. Component self-localizes its aria labels via StringManager; the language-toggle label flips between the two configured language display strings based on currentLanguage.

| | |
|---|---|
| Name | `TopBar` |
| Created | 2026-04-23 |
| Updated | 2026-04-23 |

## Props

| Name | Type | Required | Default | Description | Notes |
|------|------|----------|---------|-------------|-------|
| `brandLabel` | `String` | No | `-` | Brand mark label. Passed through StringManager (snake_case key) so the chrome namespace localizes it. | - |
| `brandHref` | `String` | No | `-` | Where the brand link navigates. Almost always '/' — exposed as a prop so a future embedded variant can point elsewhere. | - |
| `currentLanguage` | `String` | Yes | `-` | 'en' or 'ja'. Drives the language toggle's display label (shows the OTHER language as an invitation to switch). | - |
| `currentColorMode` | `String` | No | `-` | Current ColorManager mode — 'light' or 'dark'. Drives which icon (sun / moon) shows on the theme toggle button. If omitted the component defaults to 'light' for SSR safety. | - |

## Structure

### Layout Structure

```
topbar_root
```

### Components

| Type | ID | Bound To Prop | Description | Notes |
|------|----|---------------|-------------|-------|
| `View` | `topbar_root` | `-` | <header> element — the site top bar. | - |

## Usage

### Example

```json
{'layoutSnippet': '{\n  "type": "TopBar",\n  "brandLabel": "chrome_brand_name",\n  "currentLanguage": "@{currentLanguage}",\n  "onToggleLanguage": "@{onToggleLanguage}",\n  "onToggleMobileMenu": "@{onToggleMobileMenu}"\n}'}
```

## Notes

- The Search trigger inside the TopBar is the existing Search component. TopBar renders it without passing a placeholder so Search self-localizes against StringManager.getString('home_search_placeholder') (its built-in fallback).
- Language toggle label: the VM passes currentLanguage; the component shows the OTHER language name as a prompt to switch. Localized copy for both labels lives in the chrome namespace (chrome_lang_toggle_label_en / _ja).
- Component imports StringManager directly for aria labels (same pattern as Search). No aria-label prop is surfaced — callers should trust the component's internal localization.
- Hamburger button visibility is CSS media-query driven (visible only under 1024px). No prop controls it.
- The component sits at z-index 40 in the chrome stack. It renders above the sidebar (z-35) so brand + search + language remain clickable while the sidebar drawer is open on narrow viewports.

<!-- jsonui-doc-producer: jsonui-doc:component -->
