// ViewModel for the site-wide Chrome screen.
//
// Spec: docs/screens/json/chrome.spec.json
// Layout: docs/screens/layouts/chrome.json (renders TopBar + Sidebar)
//
// The VM seeds the static nav catalog in onAppear (resolving every label
// through StringManager), owns per-section collapse state, mobile drawer
// state, and bridges Next.js's usePathname() into `activeUrl` via
// onRouteChange (called from the ChromeMount wrapper).
//
// The NAV_CATALOG constant below mirrors the same category + leaf-page
// enumeration that HomeViewModel uses for its TabView catalogs, but shaped
// for the Sidebar custom component's SidebarSection / SidebarEntry types.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ChromeData } from "@/generated/data/ChromeData";
import { ChromeViewModelBase } from "@/generated/viewmodels/ChromeViewModelBase";
import { StringManager } from "@/generated/StringManager";
import { ColorManager, ColorMode } from "@/generated/ColorManager";

interface SidebarEntry {
  id: string;
  label: string;
  url: string;
}

interface SidebarSection {
  id: string;
  label: string;
  iconName: string;
  entries: SidebarEntry[];
}

/**
 * Static catalog — one entry per Sidebar category, in the order they
 * appear. Each `entries` row carries the leaf URL + the screen-specific
 * strings.json key whose value becomes the displayed row label. We resolve
 * the `titleKey` through StringManager at seed time so the Sidebar itself
 * stays purely presentational.
 */
const NAV_CATALOG: ReadonlyArray<{
  id: "learn" | "concepts" | "spec" | "guides" | "reference" | "platforms" | "tools";
  iconName: string;
  entries: ReadonlyArray<{ id: string; titleKey: string; url: string }>;
}> = [
  {
    id: "learn",
    iconName: "learn",
    entries: [
      { id: "installation",      titleKey: "learn_installation_title",        url: "/learn/installation" },
      { id: "hello-world",       titleKey: "learn_hello_world_title",         url: "/learn/hello-world" },
      { id: "first-screen",      titleKey: "learn_first_screen_title",        url: "/learn/first-screen" },
      { id: "data-binding",      titleKey: "learn_data_binding_basics_title", url: "/learn/data-binding-basics" },
      { id: "what-is-jsonui",    titleKey: "learn_what_is_jsonui_title",      url: "/learn/what-is-jsonui" },
    ],
  },
  {
    id: "concepts",
    iconName: "concepts",
    entries: [
      { id: "why-spec-first",        titleKey: "concepts_why_spec_first_title",        url: "/concepts/why-spec-first" },
      { id: "one-layout-json",       titleKey: "concepts_one_layout_json_title",       url: "/concepts/one-layout-json" },
      { id: "viewmodel-owned-state", titleKey: "concepts_viewmodel_owned_state_title", url: "/concepts/viewmodel-owned-state" },
      { id: "data-binding",          titleKey: "concepts_data_binding_title",          url: "/concepts/data-binding" },
      { id: "hot-reload",            titleKey: "concepts_hot_reload_title",            url: "/concepts/hot-reload" },
    ],
  },
  {
    // Spec section — dedicated to "how to write a spec", with a focus on
    // split mechanics (parent/sub, layoutFile, component_spec, customTypes,
    // cellClasses). Sits between Concepts (design intent) and Guides
    // (task-focused how-tos) per docs/plans/spec-authoring-deep-dive.md Q1.
    id: "spec",
    iconName: "spec",
    entries: [
      { id: "anatomy",        titleKey: "spec_anatomy_title",        url: "/spec/anatomy" },
      { id: "split-overview", titleKey: "spec_split_overview_title", url: "/spec/split-overview" },
    ],
  },
  {
    id: "guides",
    iconName: "guides",
    entries: [
      { id: "writing-your-first-spec", titleKey: "guides_writing_your_first_spec_title", url: "/guides/writing-your-first-spec" },
      { id: "writing-layouts",         titleKey: "guides_writing_layouts_title",         url: "/guides/writing-layouts" },
      { id: "navigation",              titleKey: "guides_navigation_title",              url: "/guides/navigation" },
      { id: "testing",                 titleKey: "guides_testing_title",                 url: "/guides/testing" },
      { id: "localization",            titleKey: "guides_localization_title",            url: "/guides/localization" },
      { id: "custom-components",       titleKey: "guides_custom_components_title",       url: "/guides/custom-components" },
    ],
  },
  {
    id: "reference",
    iconName: "reference",
    entries: [
      { id: "attributes",    titleKey: "reference_attributes_title",    url: "/reference/attributes" },
      { id: "components",    titleKey: "reference_components_title",    url: "/reference/components" },
      { id: "json-schema",   titleKey: "reference_json_schema_title",   url: "/reference/json-schema" },
      { id: "mcp-tools",     titleKey: "reference_mcp_tools_title",     url: "/reference/mcp-tools" },
      { id: "cli-commands",  titleKey: "reference_cli_commands_title",  url: "/reference/cli-commands" },
    ],
  },
  {
    id: "platforms",
    iconName: "platforms",
    entries: [
      { id: "swift",  titleKey: "platforms_swift_title",  url: "/platforms/swift" },
      { id: "kotlin", titleKey: "platforms_kotlin_title", url: "/platforms/kotlin" },
      { id: "react",  titleKey: "platforms_rjui_title",   url: "/platforms/react" },
    ],
  },
  {
    id: "tools",
    iconName: "tools",
    entries: [
      { id: "cli",         titleKey: "tools_cli_title",         url: "/tools/cli" },
      { id: "mcp",         titleKey: "tools_mcp_title",         url: "/tools/mcp" },
      { id: "doc",         titleKey: "tools_doc_title",         url: "/tools/doc" },
      { id: "test-runner", titleKey: "tools_test_runner_title", url: "/tools/test-runner" },
      { id: "agents",      titleKey: "tools_agents_title",      url: "/tools/agents" },
      { id: "helper",      titleKey: "tools_helper_title",      url: "/tools/helper" },
    ],
  },
];

export class ChromeViewModel extends ChromeViewModelBase {
  private _colorModeUnsubscribe: (() => void) | null = null;

  constructor(
    router: AppRouterInstance,
    getData: () => ChromeData,
    setData: (data: ChromeData | ((prev: ChromeData) => ChromeData)) => void,
  ) {
    super(router, getData, setData);
    this.initializeEventHandlers();
    this.onAppear();
    // Note: do NOT touch ColorManager here — it's a client-only singleton
    // whose currentMode depends on prefers-color-scheme, which resolves to a
    // different value on the client than on the server. Reading it during
    // VM construction would produce a hydration mismatch. ChromeMount calls
    // mountColorMode() from a useEffect instead.
  }

  protected initializeEventHandlers = () => {
    this.updateData({
      onToggleSection: this.onToggleSection as unknown as () => void,
      onToggleMobileMenu: this.onToggleMobileMenu,
      onToggleLanguage: this.onToggleLanguage,
      onToggleColorMode: this.onToggleColorMode,
      onLinkTap: this.onLinkTap as unknown as () => void,
    });
  };

  // Attach the ColorManager subscription and do the first sync from a post-
  // mount useEffect — deferring avoids the SSR/client hydration mismatch
  // described in the constructor.
  mountColorMode = (): (() => void) => {
    this.updateData({ currentColorMode: ColorManager.currentMode });
    this._colorModeUnsubscribe = ColorManager.subscribe(() => {
      this.updateData({ currentColorMode: ColorManager.currentMode });
    });
    return () => {
      this._colorModeUnsubscribe?.();
      this._colorModeUnsubscribe = null;
    };
  };

  onAppear = (): void => {
    this.updateData({
      navItems: this.buildNavItems(),
      currentLanguage: StringManager.language,
    });
  };

  onRouteChange = (url: string): void => {
    const section = NAV_CATALOG.find((s) =>
      s.entries.some((e) => e.url === url),
    );
    const prevCollapsed = this.data.collapsedIds ?? [];
    const nextCollapsed = section
      ? prevCollapsed.filter((id: string) => id !== section.id)
      : prevCollapsed;
    this.updateData({ activeUrl: url, collapsedIds: nextCollapsed });
  };

  onToggleSection = (id: string): void => {
    const cur = (this.data.collapsedIds ?? []) as string[];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    this.updateData({ collapsedIds: next });
  };

  onToggleMobileMenu = (): void => {
    this.updateData({ mobileOpen: !this.data.mobileOpen });
  };

  onToggleLanguage = (): void => {
    const next = StringManager.language === "en" ? "ja" : "en";
    StringManager.setLanguage(next);
    this.onAppear();
    if (typeof window !== "undefined") {
      window.localStorage.setItem("jsonui-language", next);
      window.dispatchEvent(new CustomEvent("chrome:languagechange"));
    }
  };

  // Flip ColorManager between light and dark. Opting out of followSystemMode
  // here is intentional: once the user expresses a preference, we stop
  // tracking the OS until they next reload with no stored choice.
  onToggleColorMode = (): void => {
    ColorManager.followSystemMode = false;
    const next: ColorMode =
      ColorManager.currentMode === "dark" ? "light" : "dark";
    ColorManager.setMode(next);
  };

  onLinkTap = (_url: string): void => {
    if (this.data.mobileOpen) {
      this.updateData({ mobileOpen: false });
    }
  };

  private buildNavItems = (): SidebarSection[] => {
    return NAV_CATALOG.map((section) => ({
      id: section.id,
      label: StringManager.getString(`chrome_nav_${section.id}_label`),
      iconName: section.iconName,
      entries: section.entries.map((e) => ({
        id: e.id,
        label: StringManager.getString(e.titleKey),
        url: e.url,
      })),
    }));
  };
}
