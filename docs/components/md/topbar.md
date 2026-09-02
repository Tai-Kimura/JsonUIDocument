# TopBar

**Category:** navigation

Site-wide sticky header. Renders as a 56px fixed bar at the viewport top containing (left→right): a hamburger button that is only visible under 1024px (fires onToggleMobileMenu), a brand mark linking to brandHref (usually '/'), a flexible spacer, the Search trigger instance (reuses the existing Search component), and a language toggle pill that fires onToggleLanguage. Component self-localizes its aria labels via StringManager; the language-toggle label flips between the two configured language display strings based on currentLanguage.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `brandLabel` | `String` | No | `-` | Brand mark label. Passed through StringManager (snake_case key) so the chrome namespace localizes it. |
| `brandHref` | `String` | No | `-` | Where the brand link navigates. Almost always '/' — exposed as a prop so a future embedded variant can point elsewhere. |
| `currentLanguage` | `String` | Yes | `-` | 'en' or 'ja'. Drives the language toggle's display label (shows the OTHER language as an invitation to switch). |
| `currentColorMode` | `String` | No | `-` | Current ColorManager mode — 'light' or 'dark'. Drives which icon (sun / moon) shows on the theme toggle button. If omitted the component defaults to 'light' for SSR safety. |

## Structure

### Components

| Type | ID | Description |
|------|----|--------------|
| `View` | `topbar_root` | <header> element — the site top bar. |

## Usage

### Example

```json
{'layoutSnippet': '{\n  "type": "TopBar",\n  "brandLabel": "chrome_brand_name",\n  "currentLanguage": "@{currentLanguage}",\n  "onToggleLanguage": "@{onToggleLanguage}",\n  "onToggleMobileMenu": "@{onToggleMobileMenu}"\n}'}
```

