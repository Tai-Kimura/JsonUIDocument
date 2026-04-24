// ViewModel for Tools > jsonui-doc (/tools/doc).
//
// Spec: docs/screens/json/tools/doc.spec.json
// Hand-written (no ViewModelBase — sibling tools pages use the same
// direct-class pattern; a generated base is only emitted for index
// screens on this site).
//
// Mirrors HelloWorldViewModel's T6 tab pattern so the /tools/doc sample
// switcher behaves identically to the /learn/hello-world platform
// switcher — same buildSampleTabs palette-swap shape, same
// `onSelect = () => this.onSelectSampleTab(id)` wiring.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DocData } from "@/generated/data/DocData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface CommandRowCell {
  id: string;
  commandKey: string;
  descriptionKey: string;
  flagsKey: string;
}

interface FigmaThrottleRowCell {
  id: string;
  planKey: string;
  limitKey: string;
  intervalKey: string;
}

interface TabHeaderCell {
  id: string;
  labelKey: string;
  bgColor: string;
  fgColor: string;
  borderColor: string;
  onSelect: () => void;
}

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

// Static catalog definitions. Every string field is a key; resolved to
// en/ja text via StringManager inside onAppear so the language toggle
// picks up changes.
const COMMAND_INIT_ENTRIES: ReadonlyArray<{ id: string; keyPrefix: string }> = [
  { id: "init_spec",      keyPrefix: "cmd_init_spec" },
  { id: "init_component", keyPrefix: "cmd_init_component" },
];

const COMMAND_VALIDATE_ENTRIES: ReadonlyArray<{ id: string; keyPrefix: string }> = [
  { id: "validate_spec",      keyPrefix: "cmd_validate_spec" },
  { id: "validate_component", keyPrefix: "cmd_validate_component" },
];

const COMMAND_GENERATE_ENTRIES: ReadonlyArray<{ id: string; keyPrefix: string }> = [
  { id: "generate_html",      keyPrefix: "cmd_generate_html" },
  { id: "generate_mermaid",   keyPrefix: "cmd_generate_mermaid" },
  { id: "generate_adapter",   keyPrefix: "cmd_generate_adapter" },
  { id: "generate_doc",       keyPrefix: "cmd_generate_doc" },
  { id: "generate_spec",      keyPrefix: "cmd_generate_spec" },
  { id: "generate_component", keyPrefix: "cmd_generate_component" },
];

const COMMAND_FIGMA_ENTRIES: ReadonlyArray<{ id: string; keyPrefix: string }> = [
  { id: "figma_fetch",  keyPrefix: "cmd_figma_fetch" },
  { id: "figma_images", keyPrefix: "cmd_figma_images" },
];

const FIGMA_THROTTLE_ENTRIES: ReadonlyArray<{ id: string; keyPrefix: string }> = [
  { id: "throttle_starter",    keyPrefix: "throttle_starter" },
  { id: "throttle_pro",        keyPrefix: "throttle_pro" },
  { id: "throttle_org",        keyPrefix: "throttle_org" },
  { id: "throttle_enterprise", keyPrefix: "throttle_enterprise" },
];

const NEXT_READ_ENTRIES: ReadonlyArray<{
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
}> = [
  {
    id: "next_mcp",
    titleKey: "next_mcp_title",
    descriptionKey: "next_mcp_description",
    url: "/tools/mcp",
  },
  {
    id: "next_cli_reference",
    titleKey: "next_cli_reference_title",
    descriptionKey: "next_cli_reference_description",
    url: "/reference/cli-commands",
  },
];

// Literal contents of docs/screens/json/learn/hello-world.spec.json at
// author time. Refresh with a manual re-paste when the source spec
// changes. `jui verify` catches drift on the generated HTML side; the
// JSON side is a copy that has to be updated by hand.
const HELLO_WORLD_SPEC_JSON = `{
  "type": "screen_spec",
  "version": "1.0",
  "metadata": {
    "name": "LearnHelloWorld",
    "displayName": "Hello World",
    "description": "Learn > Hello World. The five-minute first-screen tutorial. Beginners (audience A) land here from the home hero CTA (/learn/hello-world) and must see text on screen within 5 minutes on at least one of Swift / Kotlin / React. Page is one vertical ScrollView whose per-platform quickstart section is an inline tab switcher driven by activeTab + a Collection of tab headers (T6 pattern, not a root TabView). v1 seeds all content statically in the ViewModel; a DocContentRepository can be added later without changing the public ViewModel contract.",
    "platforms": [
      "web"
    ],
    "layoutFile": "learn/hello-world",
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22"
  },
  "structure": {
    "components": [],
    "layout": {},
    "collection": null,
    "tabView": null
  },
  "stateManagement": {
    "states": [],
    "uiVariables": [
      {
        "name": "breadcrumbItems",
        "type": "[BreadcrumbItem]",
        "initial": "[]",
        "description": "Two-entry breadcrumb row: Learn / Hello World. Seeded by onAppear."
      },
      {
        "name": "prerequisites",
        "type": "[Prerequisite]",
        "initial": "[]",
        "description": "Three required-tool rows (Node, macOS or JDK, a browser) rendered above the platform tabs. Seeded by onAppear."
      },
      {
        "name": "commonSteps",
        "type": "[QuickstartStep]",
        "initial": "[]",
        "description": "Steps that are identical across Swift / Kotlin / React: install the CLI, create a platform project (prose-only pointer), run \`jui init\` with the right flag, author the layout, \`jui build\` + \`jui verify --fail-on-diff\`. Rendered above the platform tabs so readers only see platform-specific commands once they pick their stack."
      },
      {
        "name": "platformTabs",
        "type": "[PlatformTab]",
        "initial": "[]",
        "description": "Tab-header data for the inline platform switcher. Exactly three entries: Swift / Kotlin / React. Each entry carries its own ordered [QuickstartStep] list of *platform-specific* steps only (ViewModel wiring + running the app + live-reload via \`jui hotload listen\` for mobile); the common install / init / author / build steps live in \`commonSteps\`."
      },
      {
        "name": "activeTab",
        "type": "String",
        "initial": "react",
        "description": "Id of the currently selected platform tab ('swift' | 'kotlin' | 'react'). Defaults to 'react' because the documentation site itself ships web-only (platforms: ['web']) and React is the fastest route to a running Hello World for a web-only reader. Bound by visibility expressions in the layout to reveal exactly one platform's steps."
      },
      {
        "name": "nextSteps",
        "type": "[NextStepLink]",
        "initial": "[]",
        "description": "Two to three follow-up tutorial cards rendered below the platform tabs (Guides index, First screen, Data binding basics). Seeded by onAppear."
      }
    ],
    "eventHandlers": [
      {
        "name": "onAppear",
        "description": "Populate breadcrumbItems, prerequisites, commonSteps (5 cross-platform steps: install / create-platform / jui init / author / build+verify), platformTabs (each with a short platform-specific [QuickstartStep] list covering VM + run + live-reload), and nextSteps with the static v1 catalog. All user-visible strings inside those catalogs are @string/... keys so localization flows through StringManager."
      },
      {
        "name": "onSelectTab",
        "params": [
          {
            "name": "id",
            "type": "String"
          }
        ],
        "description": "Switch the inline platform switcher (T6 pattern). Sets activeTab to 'swift' | 'kotlin' | 'react'. The tab-header Collection binds each row's onClick to this handler; the bound id comes from the row's PlatformTab.id."
      },
      {
        "name": "onNavigate",
        "params": [
          {
            "name": "url",
            "type": "String"
          }
        ],
        "description": "Handle taps on a NextStepLink card or an in-page breadcrumb entry. The bound URL is supplied per row by Collection binding."
      }
    ],
    "displayLogic": [
      {
        "condition": "activeTab == 'swift'",
        "effects": [
          {
            "element": "platform_panel_swift",
            "state": "visible",
            "variableName": "swiftPanelVisibility"
          }
        ]
      },
      {
        "condition": "activeTab == 'kotlin'",
        "effects": [
          {
            "element": "platform_panel_kotlin",
            "state": "visible",
            "variableName": "kotlinPanelVisibility"
          }
        ]
      },
      {
        "condition": "activeTab == 'react'",
        "effects": [
          {
            "element": "platform_panel_react",
            "state": "visible",
            "variableName": "reactPanelVisibility"
          }
        ]
      }
    ]
  },
  "dataFlow": {
    "diagram": "flowchart TD\\n    VIEW[LearnHelloWorldView] --> VM[LearnHelloWorldViewModel]\\n    VM -- breadcrumbItems --> VIEW\\n    VM -- prerequisites --> VIEW\\n    VM -- platformTabs --> VIEW\\n    VM -- activeTab --> VIEW\\n    VM -- nextSteps --> VIEW\\n    VIEW -- onAppear --> VM\\n    VIEW -- onSelectTab(id) --> VM\\n    VIEW -- onNavigate(url) --> VM",
    "repositories": [],
    "useCases": [],
    "apiEndpoints": [],
    "viewModel": {
      "methods": [
        {
          "name": "onAppear",
          "description": "Seed breadcrumbItems (2 rows: Learn › Hello World), prerequisites (3 required tools), commonSteps (5 cross-platform steps rendered above the tab switcher), platformTabs (Swift / Kotlin / React — each with a short platform-specific [QuickstartStep] list for VM + run + live-reload), and nextSteps (2–3 follow-up cards) from module-scope static catalogs. Every string is resolved through StringManager with the learn_hello_world_ prefix. activeTab is left at its initial 'react' value."
        },
        {
          "name": "onSelectTab",
          "params": [{ "name": "id", "type": "String" }],
          "description": "Set \`activeTab\` to the tapped PlatformTab.id ('swift' | 'kotlin' | 'react'). The displayLogic block derives three *PanelVisibility strings from activeTab so exactly one platform's steps are visible at a time; the VM doesn't set those explicitly — the generated component does via the layout's visibility bindings."
        },
        {
          "name": "onNavigate",
          "params": [{ "name": "url", "type": "String" }],
          "description": "router.push(url). Hit by NextStepLink and BreadcrumbItem taps."
        }
      ],
      "vars": [
        { "name": "breadcrumbItems",         "type": "Array(BreadcrumbItem)", "observable": true, "description": "2-row breadcrumb." },
        { "name": "prerequisites",           "type": "Array(Prerequisite)",   "observable": true, "description": "3 required-tool rows rendered above the tabs." },
        { "name": "commonSteps",             "type": "Array(QuickstartStep)", "observable": true, "description": "5 cross-platform steps rendered above the platform tabs." },
        { "name": "platformTabs",            "type": "Array(PlatformTab)",    "observable": true, "description": "3 tab-header rows; each owns its own *platform-specific* steps list (ViewModel + run + live-reload)." },
        { "name": "activeTab",               "type": "String",                "observable": true, "description": "Currently visible tab id. Defaults to 'react' (the web-shipping platform)." },
        { "name": "nextSteps",               "type": "Array(NextStepLink)",   "observable": true, "description": "2–3 follow-up tutorial cards below the platform panels." },
        { "name": "swiftPanelVisibility",    "type": "String",                "observable": true, "description": "Derived visibility from displayLogic; set by the layout's binding, not the VM." },
        { "name": "kotlinPanelVisibility",   "type": "String",                "observable": true, "description": "Same as above." },
        { "name": "reactPanelVisibility",    "type": "String",                "observable": true, "description": "Same as above." }
      ]
    },
    "customTypes": [
      {
        "name": "BreadcrumbItem",
        "properties": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "labelKey",
            "type": "String"
          },
          {
            "name": "url",
            "type": "String?"
          }
        ]
      },
      {
        "name": "Prerequisite",
        "properties": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "titleKey",
            "type": "String"
          },
          {
            "name": "descriptionKey",
            "type": "String"
          },
          {
            "name": "iconName",
            "type": "String"
          }
        ]
      },
      {
        "name": "QuickstartStep",
        "properties": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "number",
            "type": "Int"
          },
          {
            "name": "titleKey",
            "type": "String"
          },
          {
            "name": "instructionKey",
            "type": "String"
          },
          {
            "name": "code",
            "type": "String?"
          },
          {
            "name": "language",
            "type": "String?"
          },
          {
            "name": "filename",
            "type": "String?"
          },
          {
            "name": "showLineNumbers",
            "type": "Bool"
          }
        ]
      },
      {
        "name": "PlatformTab",
        "properties": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "labelKey",
            "type": "String"
          },
          {
            "name": "iconName",
            "type": "String"
          },
          {
            "name": "steps",
            "type": "[QuickstartStep]"
          }
        ]
      },
      {
        "name": "NextStepLink",
        "properties": [
          {
            "name": "id",
            "type": "String"
          },
          {
            "name": "titleKey",
            "type": "String"
          },
          {
            "name": "descriptionKey",
            "type": "String"
          },
          {
            "name": "url",
            "type": "String"
          }
        ]
      }
    ]
  },
  "userActions": [
    {
      "action": "Select a platform tab (Swift / Kotlin / React)",
      "processing": "onSelectTab(id) is invoked with the bound PlatformTab.id. ViewModel sets activeTab, and the displayLogic entries flip the matching platform_panel_* visibility."
    },
    {
      "action": "Copy a code example",
      "processing": "Handled inside the CodeBlock converter itself (built-in copy button). The optional onCopy event on CodeBlock is not wired here; copying does not depend on it."
    },
    {
      "action": "Tap a Next step card",
      "processing": "onNavigate(url) is invoked with the bound NextStepLink.url from the Collection row."
    },
    {
      "action": "Tap the Learn breadcrumb",
      "processing": "onNavigate(url) is invoked with BreadcrumbItem.url ('/learn')."
    }
  ],
  "validation": {
    "clientSide": [],
    "serverSide": []
  },
  "transitions": [
    {
      "trigger": "onNavigate(url)",
      "condition": "url is any spec-mapped URL",
      "destination": "Target spec screen resolved from url",
      "description": "Client-side navigation via router.push(url). Expected v1 destinations: /learn, /learn/first-screen, /learn/data-binding-basics, /guides, /tools/agents/overview."
    }
  ],
  "relatedFiles": [
    {
      "type": "Layout",
      "path": "docs/screens/layouts/learn/hello-world.json",
      "description": "Hello World layout. Single ScrollView at the root with breadcrumb, title, lead, prerequisites Collection, inline platform tab switcher (T6 pattern), three platform panels (one visible at a time via displayLogic), and Next steps Collection."
    },
    {
      "type": "ViewModel",
      "path": "jsonui-doc-web/src/viewmodels/LearnHelloWorldViewModel.ts",
      "description": "Generated by jui g project. Exposes currentLanguage, breadcrumbItems, prerequisites, platformTabs, activeTab, nextSteps; implements onAppear / onSelectTab / onNavigate / onToggleLanguage."
    },
    {
      "type": "View",
      "path": "jsonui-doc-web/src/app/learn/hello-world/page.tsx",
      "description": "Next.js App Router page. Dynamic-imports the generated LearnHelloWorldView (thin wrapper; navigation lives in jsonui-navigation-web)."
    },
    {
      "type": "Model",
      "path": "jsonui-doc-web/src/models/QuickstartStep.ts",
      "description": "Generated TypeScript type for QuickstartStep and the four other custom types declared in dataFlow.customTypes."
    }
  ],
  "notes": [
    "This is the target of the home hero CTA. KPI from docs/plans/00-overview.md §5: a reader must reach 'text on screen' within 5 minutes on at least one of Swift / Kotlin / React.",
    "TabView rule deviation (docs/plans/17-spec-templates.md §T8): the three platform variants are content within a single topic, not separate top-level sections. The spec therefore uses the T6 inline-tab pattern (activeTab: String + Collection + cellClasses: ['cells/tab_header']) inside a root ScrollView rather than a root TabView. Home already hosts the site-level TabView; this page sits inside one of its tabs.",
    "metadata.platforms = ['web'] mirrors the documentation-site deployment surface (jui.config.json only registers the web platform). The *content* inside the three tabs still covers Swift / Kotlin / React because those are what the reader is learning about, not what this page is rendered to.",
    "Standard components + CodeBlock only. CodeBlock is the one custom type referenced (registered in .jsonui-doc-rules.json and specified at docs/components/json/codeblock.component.json).",
    "All user-visible strings flow through @string/learn_hello_world_* keys into Resources/strings.json for en+ja localization. No paragraph exceeds ~100 chars, so docs/content/{en,ja}/ is not needed for v1; if later copy grows past that, the implementer can migrate paragraphs to docs/content/{en,ja}/learn/hello-world.json without changing this spec.",
    "v1 seeds breadcrumbItems / prerequisites / platformTabs / nextSteps in onAppear with hardcoded @string/... keys. Adding a DocContentRepository later is a pure additive change and does not alter the ViewModel's public contract.",
    "activeTab defaults to 'react' because web-only readers (the default audience of this site) can reach a running Hello World fastest via rjui + Next.js; Swift and Kotlin tabs still render their CodeBlocks identically and are one click away.",
    "QuickstartStep.code is optional because Step 5 ('What you should see') is a prose-only step without a CodeBlock; all other steps will carry code + language + filename at layout authoring time."
  ]
}
`;

export class DocViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => DocData;
  protected _setData: (
    data: DocData | ((prev: DocData) => DocData),
  ) => void;

  private _activeSampleTab: string = "html";

  get data(): DocData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => DocData,
    setData: (data: DocData | ((prev: DocData) => DocData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    // Auto-populate on construction so a page visit renders with content
    // without a manual onAppear trigger from the view.
    this.onAppear();
  }

  updateData = (updates: Partial<DocData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<DocData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateTools: () => this.navigate("/"),
      onNavigateSampleLive: () => this.navigate("/learn/hello-world"),
    });
  };

  onAppear = (): void => {
    const commandInitRows: CommandRowCell[] = COMMAND_INIT_ENTRIES.map((e) =>
      this.buildCommandRow(e.id, e.keyPrefix),
    );
    const commandValidateRows: CommandRowCell[] = COMMAND_VALIDATE_ENTRIES.map((e) =>
      this.buildCommandRow(e.id, e.keyPrefix),
    );
    const commandGenerateRows: CommandRowCell[] = COMMAND_GENERATE_ENTRIES.map((e) =>
      this.buildCommandRow(e.id, e.keyPrefix),
    );
    const commandFigmaRows: CommandRowCell[] = COMMAND_FIGMA_ENTRIES.map((e) =>
      this.buildCommandRow(e.id, e.keyPrefix),
    );

    const figmaThrottleRows: FigmaThrottleRowCell[] = FIGMA_THROTTLE_ENTRIES.map((e) => ({
      id: e.id,
      planKey: this.s(`${e.keyPrefix}_plan`),
      limitKey: this.s(`${e.keyPrefix}_limit`),
      intervalKey: this.s(`${e.keyPrefix}_interval`),
    }));

    const nextReadLinks: NextReadCell[] = NEXT_READ_ENTRIES.map((e) => ({
      id: e.id,
      titleKey: this.s(e.titleKey),
      descriptionKey: this.s(e.descriptionKey),
      url: e.url,
      onNavigate: () => this.navigate(e.url),
    }));

    const sampleTabs: TabHeaderCell[] = this.buildSampleTabs(this._activeSampleTab);

    this.updateData({
      commandInitRows: this.asCollection(commandInitRows),
      commandValidateRows: this.asCollection(commandValidateRows),
      commandGenerateRows: this.asCollection(commandGenerateRows),
      commandFigmaRows: this.asCollection(commandFigmaRows),
      figmaThrottleRows: this.asCollection(figmaThrottleRows),
      sampleTabs: this.asCollection(sampleTabs),
      nextReadLinks: this.asCollection(nextReadLinks),
      helloWorldSpecJson: HELLO_WORLD_SPEC_JSON,
      ...this.panelVisibilityFor(this._activeSampleTab),
    });
  };

  onSelectSampleTab = (id: string): void => {
    this._activeSampleTab = id;
    this.updateData({
      sampleTabs: this.asCollection(this.buildSampleTabs(id)),
      ...this.panelVisibilityFor(id),
    });
  };

  onNavigate = (url: string): void => {
    this.navigate(url);
  };

  navigate = (url: string): void => {
    this.router.push(url);
  };

  /**
   * T6 palette swap. Mirrors HelloWorldViewModel.buildPlatformTabs: active
   * row adopts accent bg/fg/border; inactive row sticks with the neutral
   * surface palette. Each row's onSelect invokes this.onSelectSampleTab(id).
   */
  buildSampleTabs = (activeId: string): TabHeaderCell[] => {
    const make = (id: string, labelKey: string): TabHeaderCell => {
      const isActive = id === activeId;
      return {
        id,
        labelKey,
        bgColor: isActive ? "var(--color-accent)" : "var(--color-surface)",
        fgColor: isActive ? "var(--color-accent_ink)" : "var(--color-ink)",
        borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
        onSelect: () => this.onSelectSampleTab(id),
      };
    };
    return [
      make("html", this.s("sample_tab_html")),
      make("json", this.s("sample_tab_json")),
    ];
  };

  // -- helpers --

  private buildCommandRow = (id: string, keyPrefix: string): CommandRowCell => ({
    id,
    commandKey: this.s(`${keyPrefix}_name`),
    descriptionKey: this.s(`${keyPrefix}_description`),
    flagsKey: this.s(`${keyPrefix}_flags`),
  });

  private panelVisibilityFor = (
    id: string,
  ): Pick<DocData, "jsonSamplePanelVisibility" | "htmlSamplePanelVisibility"> => ({
    jsonSamplePanelVisibility: id === "json" ? "visible" : "gone",
    htmlSamplePanelVisibility: id === "html" ? "visible" : "gone",
  });

  /** Resolve a bare key against this screen's tools_doc_ prefix. */
  private s = (key: string): string =>
    StringManager.getString(`tools_doc_${key}`);

  private asCollection = <T,>(items: T[]): CollectionDataSource<T> =>
    new CollectionDataSource<T>([{ cells: { data: items } }]);
}
