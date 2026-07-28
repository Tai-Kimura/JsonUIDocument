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

type PlatformCode = "ios" | "android" | "web";

interface SidebarEntry {
  id: string;
  // English label — used as the SSR / first-client-render value. The
  // Sidebar resolves the actual locale via useLocalizedString(labelKey, label)
  // post-mount so we never read StringManager during VM construction (it
  // depends on localStorage and would cause a hydration mismatch — see the
  // matching note in the SidebarSection block below).
  label: string;
  labelKey: string;
  url: string;
  platforms?: PlatformCode[];
}

interface SidebarSection {
  id: string;
  // English label + StringManager key. See SidebarEntry note above.
  label: string;
  labelKey: string;
  iconName: string;
  entries: SidebarEntry[];
}

/**
 * Static catalog — one entry per Sidebar category, in the order they
 * appear. Each row carries the leaf URL, the strings.json key the Sidebar
 * resolves at render time via useLocalizedString, and a hardcoded English
 * label that is used as the SSR / first-client-render fallback. Hardcoding
 * English here is intentional: StringManager.language reads localStorage at
 * module-load time on the client, so calling getString() during VM
 * construction returns "Learn" on the server but "学ぶ" on the client and
 * blows up hydration. The Sidebar runs the locale-aware lookup in a
 * post-mount useEffect instead.
 */
const NAV_CATALOG: ReadonlyArray<{
  id: "learn" | "concepts" | "spec" | "guides" | "reference" | "platforms" | "tools";
  iconName: string;
  labelEn: string;
  entries: ReadonlyArray<{ id: string; titleKey: string; titleEn: string; url: string; platforms?: PlatformCode[] }>;
}> = [
  {
    id: "learn",
    iconName: "learn",
    labelEn: "Learn",
    entries: [
      { id: "installation",      titleKey: "learn_installation_title",        titleEn: "Install JsonUI in one line",                     url: "/learn/installation" },
      { id: "hello-world",       titleKey: "learn_hello_world_title",         titleEn: "Hello, JsonUI — your first screen in five minutes", url: "/learn/hello-world" },
      { id: "first-screen",      titleKey: "learn_first_screen_title",        titleEn: "Your first screen",                              url: "/learn/first-screen" },
      { id: "data-binding",      titleKey: "learn_data_binding_basics_title", titleEn: "Data binding basics",                            url: "/learn/data-binding-basics" },
      { id: "what-is-jsonui",    titleKey: "learn_what_is_jsonui_title",      titleEn: "What is JsonUI?",                                url: "/learn/what-is-jsonui" },
    ],
  },
  {
    id: "concepts",
    iconName: "concepts",
    labelEn: "Concepts",
    entries: [
      { id: "why-spec-first",        titleKey: "concepts_why_spec_first_title",        titleEn: "Why spec-first",             url: "/concepts/why-spec-first" },
      { id: "one-layout-json",       titleKey: "concepts_one_layout_json_title",       titleEn: "One Layout JSON per screen", url: "/concepts/one-layout-json" },
      { id: "viewmodel-owned-state", titleKey: "concepts_viewmodel_owned_state_title", titleEn: "ViewModel-owned state",      url: "/concepts/viewmodel-owned-state" },
      { id: "data-binding",          titleKey: "concepts_data_binding_title",          titleEn: "Data binding as contract",   url: "/concepts/data-binding" },
      { id: "hot-reload",            titleKey: "concepts_hot_reload_title",            titleEn: "Hot reload everywhere",      url: "/concepts/hot-reload" },
      { id: "responsive-design",        titleKey: "concepts_responsive_design_title",        titleEn: "Responsive design",                       url: "/concepts/responsive-design" },
      { id: "screen-composition",       titleKey: "concepts_screen_composition_title",       titleEn: "Screen composition",                      url: "/concepts/screen-composition" },
      { id: "screen-identity",          titleKey: "concepts_screen_identity_title",          titleEn: "Screen identity and navigation assertion", url: "/concepts/screen-identity" },
      { id: "data-models-from-openapi",     titleKey: "concepts_data_models_from_openapi_title",     titleEn: "Data models from OpenAPI (DTO + Domain)", url: "/concepts/data-models-from-openapi" },
      { id: "implementation-contract-check", titleKey: "concepts_implementation_contract_check_title", titleEn: "Implementation contract check",           url: "/concepts/implementation-contract-check" },
      { id: "db-schema-check",               titleKey: "concepts_db_schema_check_title",               titleEn: "DB schema check (docs/db ⇔ live DB)",     url: "/concepts/db-schema-check" },
    ],
  },
  {
    // Spec section — dedicated to "how to write a spec", with a focus on
    // split mechanics (parent/sub, layoutFile, component_spec, customTypes,
    // cellClasses). Sits between Concepts (design intent) and Guides
    // (task-focused how-tos).
    id: "spec",
    iconName: "spec",
    labelEn: "Spec",
    entries: [
      { id: "anatomy",              titleKey: "spec_anatomy_title",              titleEn: "The anatomy of a screen spec",  url: "/spec/anatomy" },
      { id: "split-overview",       titleKey: "spec_split_overview_title",       titleEn: "Five ways to split a spec",     url: "/spec/split-overview" },
      { id: "layout-file",          titleKey: "spec_layout_file_title",          titleEn: "Separating the layout file",    url: "/spec/layout-file" },
      { id: "parent-sub-spec",      titleKey: "spec_parent_sub_spec_title",      titleEn: "Parent + sub specs",            url: "/spec/parent-sub-spec" },
      { id: "component-spec",       titleKey: "spec_component_spec_title",       titleEn: "Component specs",               url: "/spec/component-spec" },
      { id: "custom-types",         titleKey: "spec_custom_types_title",         titleEn: "Custom types",                  url: "/spec/custom-types" },
      { id: "cell-classes",         titleKey: "spec_cell_classes_title",         titleEn: "Collection cell classes",       url: "/spec/cell-classes" },
      { id: "validation-and-drift", titleKey: "spec_validation_and_drift_title", titleEn: "Validation + drift detection",  url: "/spec/validation-and-drift" },
    ],
  },
  {
    id: "guides",
    iconName: "guides",
    labelEn: "Guides",
    entries: [
      { id: "writing-your-first-spec", titleKey: "guides_writing_your_first_spec_title", titleEn: "Writing your first spec",     url: "/guides/writing-your-first-spec" },
      { id: "api-data-models",         titleKey: "guides_api_data_models_title",         titleEn: "API data models (cookbook)",  url: "/guides/api-data-models" },
      { id: "verifying-implementation-against-docs", titleKey: "guides_verifying_implementation_against_docs_title", titleEn: "Verifying implementation against docs", url: "/guides/verifying-implementation-against-docs" },
      { id: "writing-layouts",         titleKey: "guides_writing_layouts_title",         titleEn: "Writing layouts",             url: "/guides/writing-layouts" },
      { id: "navigation",              titleKey: "guides_navigation_title",              titleEn: "Navigation between screens", url: "/guides/navigation" },
      { id: "testing",                 titleKey: "guides_testing_title",                 titleEn: "Writing screen tests",        url: "/guides/testing" },
      { id: "api-mock",                titleKey: "guides_api_mock_title",                titleEn: "Mocking APIs in tests",       url: "/guides/api-mock" },
      { id: "localization",            titleKey: "guides_localization_title",            titleEn: "Adding a new language",       url: "/guides/localization" },
      { id: "colors",                  titleKey: "guides_colors_title",                  titleEn: "Colors and theming",          url: "/guides/colors" },
      { id: "custom-components",       titleKey: "guides_custom_components_title",       titleEn: "Building a custom component", url: "/guides/custom-components" },
      { id: "developer-menu",          titleKey: "guides_developer_menu_title",          titleEn: "Developer menu",              url: "/guides/developer-menu", platforms: ["ios", "android"] },
    ],
  },
  {
    id: "reference",
    iconName: "reference",
    labelEn: "Reference",
    entries: [
      { id: "attributes",    titleKey: "reference_attributes_title",    titleEn: "Attribute reference",   url: "/reference/attributes" },
      { id: "components",    titleKey: "reference_components_title",    titleEn: "Component reference",   url: "/reference/components" },
      { id: "json-schema",   titleKey: "reference_json_schema_title",   titleEn: "JSON Schema",            url: "/reference/json-schema" },
      { id: "mcp-tools",     titleKey: "reference_mcp_tools_title",     titleEn: "MCP tool API",           url: "/reference/mcp-tools" },
      { id: "cli-commands",  titleKey: "reference_cli_commands_title",  titleEn: "CLI command reference", url: "/reference/cli-commands" },
      { id: "test-tooling", titleKey: "reference_test_tooling_title", titleEn: "Test tooling reference", url: "/reference/test-tooling" },
      { id: "generated-code", titleKey: "reference_generated_code_title", titleEn: "Generated code", url: "/reference/generated-code" },
    ],
  },
  {
    id: "platforms",
    iconName: "platforms",
    labelEn: "Platforms",
    entries: [
      { id: "swift",  titleKey: "platforms_swift_title",  titleEn: "SwiftJsonUI",  url: "/platforms/swift" },
      { id: "kotlin", titleKey: "platforms_kotlin_title", titleEn: "KotlinJsonUI", url: "/platforms/kotlin" },
      { id: "react",  titleKey: "platforms_rjui_title",   titleEn: "ReactJsonUI",  url: "/platforms/react" },
    ],
  },
  {
    id: "tools",
    iconName: "tools",
    labelEn: "Tools",
    entries: [
      { id: "cli",         titleKey: "tools_cli_title",         titleEn: "jsonui-cli",                url: "/tools/cli" },
      { id: "mcp",         titleKey: "tools_mcp_title",         titleEn: "jsonui-mcp-server",         url: "/tools/mcp" },
      { id: "doc",         titleKey: "tools_doc_title",         titleEn: "jsonui-doc",                url: "/tools/doc" },
      { id: "test-runner", titleKey: "tools_test_runner_title", titleEn: "jsonui-test-runner",        url: "/tools/test-runner" },
      { id: "agents",      titleKey: "tools_agents_title",      titleEn: "Agents for Claude / Codex", url: "/tools/agents" },
      { id: "helper",      titleKey: "tools_helper_title",      titleEn: "jsonui-helper (VS Code)",   url: "/tools/helper" },
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
    });
    // Note: currentLanguage is intentionally NOT seeded here. The
    // StringManager singleton reads localStorage in its constructor, so
    // its `.language` getter returns "en" on the server but the persisted
    // value (e.g. "ja") on the client immediately. Reading it during VM
    // construction would push a divergent currentLanguage into the first
    // client render and trigger a hydration mismatch on TopBar's language
    // toggle. ChromeMount calls mountLanguage() from a useEffect instead,
    // mirroring the mountColorMode pattern used for ColorManager.
  };

  // Pull the persisted language out of StringManager and apply it to the VM
  // state. Must be called from a post-mount useEffect, never during render.
  mountLanguage = (): void => {
    if (this.data.currentLanguage !== StringManager.language) {
      this.updateData({ currentLanguage: StringManager.language });
    }
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
    this.mountLanguage();
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

  // Pure derivation — no StringManager calls so the output is identical on
  // server and on first client render. The Sidebar component uses
  // useLocalizedString(labelKey, label) post-mount to substitute the
  // persisted language. See the SidebarSection comment block at the top of
  // this file for the full reasoning.
  private buildNavItems = (): SidebarSection[] => {
    return NAV_CATALOG.map((section) => ({
      id: section.id,
      label: section.labelEn,
      labelKey: `chrome_nav_${section.id}_label`,
      iconName: section.iconName,
      entries: section.entries.map((e) => ({
        id: e.id,
        label: e.titleEn,
        labelKey: e.titleKey,
        url: e.url,
        ...(e.platforms ? { platforms: [...e.platforms] } : {}),
      })),
    }));
  };
}
