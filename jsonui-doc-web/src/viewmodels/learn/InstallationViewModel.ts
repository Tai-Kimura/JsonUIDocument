// ViewModel for Learn > Installation.
//
// This screen's VM is not auto-generated via `jui build`'s ViewModelBase
// pathway because the layout file (`learn/installation.json`) does not
// map onto a `jui g project`-scaffolded base for this repo. The public
// contract — currentLanguage / installTargets / prerequisites / verifyRows
// / troubleshootRows / relatedLinks / the four *BodyVisibility strings /
// onToggleLanguage / onToggleExpand / onCopyCode / onNavigate — mirrors the
// spec at docs/screens/json/learn/installation.spec.json so a future
// regeneration slotting this file under a generated base is purely
// mechanical.
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { InstallationData } from "@/generated/data/InstallationData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

/**
 * Local view of an InstallTargetCard cell as hydrated by this ViewModel.
 * Mirrors the spec's InstallTargetCard custom type (id / titleKey /
 * locationKey / bodyKey / iconName).
 */
interface InstallTargetCardCell {
  id: string;
  titleKey: string;
  locationKey: string;
  bodyKey: string;
  iconName: string;
}

interface PrereqRowCell {
  id: string;
  labelKey: string;
  toolKey: string;
  requiredTier: "required" | "optional";
  noteKey: string;
  tierBadgeKey: string;
  tierBadgeBackground: string;
  tierBadgeColor: string;
}

interface VerifyRowCell {
  id: string;
  commandKey: string;
  expectKey: string;
  command: string;
  language: string;
}

interface TroubleshootRowCell {
  id: string;
  symptomKey: string;
  causeKey: string;
  fixKey: string;
  rowVisibility: string;
  indicatorKey: string;
  onToggle: () => void;
}

interface RelatedLinkCell {
  id: string;
  labelKey: string;
  url: string;
  onNavigate: () => void;
}

/**
 * v1 static catalog of troubleshoot rows, expressed as the (id, key-suffix)
 * pairs fed through `this.s(...)` in onAppear. Kept at module scope so the
 * per-toggle re-hydration path (onToggleExpand) can reuse the same canonical
 * list without retyping it.
 */
const TROUBLESHOOT_ROW_DEFS: ReadonlyArray<{
  id: string;
  symptomKey: string;
  causeKey: string;
  fixKey: string;
}> = [
  {
    id: "trouble_path",
    symptomKey: "trouble_path_symptom",
    causeKey: "trouble_path_cause",
    fixKey: "trouble_path_fix",
  },
  {
    id: "trouble_mcp_missing",
    symptomKey: "trouble_mcp_missing_symptom",
    causeKey: "trouble_mcp_missing_cause",
    fixKey: "trouble_mcp_missing_fix",
  },
  {
    id: "trouble_attrs",
    symptomKey: "trouble_attrs_symptom",
    causeKey: "trouble_attrs_cause",
    fixKey: "trouble_attrs_fix",
  },
  {
    id: "trouble_curl",
    symptomKey: "trouble_curl_symptom",
    causeKey: "trouble_curl_cause",
    fixKey: "trouble_curl_fix",
  },
  {
    id: "trouble_node",
    symptomKey: "trouble_node_symptom",
    causeKey: "trouble_node_cause",
    fixKey: "trouble_node_fix",
  },
  {
    id: "trouble_versions",
    symptomKey: "trouble_versions_symptom",
    causeKey: "trouble_versions_cause",
    fixKey: "trouble_versions_fix",
  },
];

/**
 * The four expandable detail-section ids. Keeping them in one place means
 * onToggleExpand can derive all four *BodyVisibility strings without
 * repeating the id literals.
 */
const SECTION_IDS = [
  "partial_update",
  "custom_path",
  "individual_install",
  "uninstall",
] as const;

type SectionId = (typeof SECTION_IDS)[number];

export class InstallationViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => InstallationData;
  protected _setData: (
    data: InstallationData | ((prev: InstallationData) => InstallationData),
  ) => void;
  // State not surfaced through the Layout's `data` block.
  //  - _currentLanguage triggers a re-seed on language toggle so snake_case
  //    string keys flip from en to ja.
  //  - _expandedIds is the canonical set the spec describes. Sections
  //    ('partial_update' etc.) and TroubleshootRow ids live in the same set.
  private _expandedIds: Set<string> = new Set();

  get data(): InstallationData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => InstallationData,
    setData: (
      data: InstallationData | ((prev: InstallationData) => InstallationData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    // Auto-populate on first construction. The hook layer re-uses the
    // same ViewModel across renders, so this runs once per mount.
    this.onAppear();
  }

  updateData = (updates: Partial<InstallationData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<InstallationData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onTogglePartialUpdate: () => this.onToggleExpand("partial_update"),
      onToggleCustomPath: () => this.onToggleExpand("custom_path"),
      onToggleIndividualInstall: () => this.onToggleExpand("individual_install"),
      onToggleUninstall: () => this.onToggleExpand("uninstall"),
      onNavigateHelloWorld: () => this.onNavigate("/learn/hello-world"),
    });
  };

  /**
   * Seed every Collection plus the four derived section-visibility strings
   * from the current _expandedIds. Every user-visible string flows through
   * StringManager so the language toggle is a simple re-seed.
   */
  onAppear = () => {

    const installTargets: InstallTargetCardCell[] = [
      {
        id: "card_cli",
        titleKey: this.s("card_cli_title"),
        locationKey: this.s("card_cli_location"),
        bodyKey: this.s("card_cli_body"),
        iconName: "CLI",
      },
      {
        id: "card_mcp",
        titleKey: this.s("card_mcp_title"),
        locationKey: this.s("card_mcp_location"),
        bodyKey: this.s("card_mcp_body"),
        iconName: "MCP",
      },
      {
        id: "card_agents",
        titleKey: this.s("card_agents_title"),
        locationKey: this.s("card_agents_location"),
        bodyKey: this.s("card_agents_body"),
        iconName: "Agents",
      },
    ];

    const prerequisites: PrereqRowCell[] = [
      this.prereqRow(
        "prereq_git",
        "prereq_git_label",
        "prereq_git_tool",
        "required",
        "prereq_git_note",
      ),
      this.prereqRow(
        "prereq_node",
        "prereq_node_label",
        "prereq_node_tool",
        "required",
        "prereq_node_note",
      ),
      this.prereqRow(
        "prereq_npm",
        "prereq_npm_label",
        "prereq_npm_tool",
        "required",
        "prereq_npm_note",
      ),
      this.prereqRow(
        "prereq_ruby",
        "prereq_ruby_label",
        "prereq_ruby_tool",
        "optional",
        "prereq_ruby_note",
      ),
      this.prereqRow(
        "prereq_python",
        "prereq_python_label",
        "prereq_python_tool",
        "optional",
        "prereq_python_note",
      ),
    ];

    const verifyRows: VerifyRowCell[] = [
      {
        id: "verify_cli",
        commandKey: this.s("verify_cli_command_caption"),
        expectKey: this.s("verify_cli_expect"),
        command: "jui --help",
        language: "bash",
      },
      {
        id: "verify_mcp",
        commandKey: this.s("verify_mcp_command_caption"),
        expectKey: this.s("verify_mcp_expect"),
        command: "Use the jui-tools MCP to list components",
        language: "text",
      },
      {
        id: "verify_conductor",
        commandKey: this.s("verify_conductor_command_caption"),
        expectKey: this.s("verify_conductor_expect"),
        command: "/jsonui",
        language: "text",
      },
    ];

    const relatedLinks: RelatedLinkCell[] = [
      this.relatedLink("related_cli", "related_cli_label", "/tools/cli"),
      this.relatedLink("related_mcp", "related_mcp_label", "/tools/mcp"),
      this.relatedLink("related_agents", "related_agents_label", "/tools/agents"),
      this.relatedLink(
        "related_hello_world",
        "related_hello_world_label",
        "/learn/hello-world",
      ),
      this.relatedLink(
        "related_get_data_source",
        "related_get_data_source_label",
        "/reference/mcp-tools",
      ),
    ];

    this.updateData({
      installTargets: this.asCollection(installTargets),
      prerequisites: this.asCollection(prerequisites),
      verifyRows: this.asCollection(verifyRows),
      troubleshootRows: this.asCollection(this.buildTroubleshootRows()),
      relatedLinks: this.asCollection(relatedLinks),
      ...this.sectionVisibilityFromExpandedIds(),
    });
  };

  /**
   * Toggle membership of `id` in `expandedIds`. Sections and TroubleshootRow
   * cells both funnel through this single handler. After flipping membership
   * we re-hydrate the troubleshootRows collection (so each row's rowVisibility
   * reflects the new state) and re-derive the four section-visibility
   * strings, then push both in a single updateData call.
   */
  onToggleExpand = (id: string): void => {
    if (this._expandedIds.has(id)) {
      this._expandedIds.delete(id);
    } else {
      this._expandedIds.add(id);
    }
    this.updateData({
      troubleshootRows: this.asCollection(this.buildTroubleshootRows()),
      ...this.sectionVisibilityFromExpandedIds(),
    });
  };

  /**
   * Optional analytics hook — declared here so the CodeBlock converter's
   * future onCopy binding has a stable handler name to attach to. Not wired
   * in v1 (the CodeBlock converter handles the clipboard action on its own).
   */
  onCopyCode = (_code: string): void => {
    // TODO(analytics): forward to the project's analytics pipeline once one exists.
  };

  /**
   * Client-side navigation — every spec-declared destination funnels through
   * this single method so analytics / middleware can hook in later.
   */
  onNavigate = (url: string): void => {
    this.navigate(url);
  };

  navigate = (url: string): void => {
    this.router.push(url);
  };

  /**
   * Toggle the StringManager between the two configured languages and
   * re-seed the static catalog so cell keys resolve in the new language.
   */

  // -- helpers --

  /**
   * Resolve a bare string suffix (e.g. "headline") against the current
   * language's snake_case flat map, scoped to this screen's prefix.
   */
  private s = (key: string): string => {
    return StringManager.getString(`learn_installation_${key}`);
  };

  /**
   * Derive the four *BodyVisibility strings from membership in expandedIds.
   * Returning an object keyed by the Data field names lets callers spread it
   * straight into updateData alongside other Collection seeds.
   */
  private sectionVisibilityFromExpandedIds = (): Pick<
    InstallationData,
    | "partialUpdateBodyVisibility"
    | "customPathBodyVisibility"
    | "individualInstallBodyVisibility"
    | "uninstallBodyVisibility"
  > => {
    const vis = (sectionId: SectionId): string =>
      this._expandedIds.has(sectionId) ? "visible" : "gone";
    return {
      partialUpdateBodyVisibility: vis("partial_update"),
      customPathBodyVisibility: vis("custom_path"),
      individualInstallBodyVisibility: vis("individual_install"),
      uninstallBodyVisibility: vis("uninstall"),
    };
  };

  /**
   * Build the troubleshoot-row cells from the static definition list, baking
   * in each row's current rowVisibility (derived from expandedIds) plus the
   * onToggle closure. Keeping this in one place means the cell layout never
   * needs to know about expandedIds directly — the VM computes the flag.
   */
  private buildTroubleshootRows = (): TroubleshootRowCell[] => {
    return TROUBLESHOOT_ROW_DEFS.map((def) => ({
      id: def.id,
      symptomKey: this.s(def.symptomKey),
      causeKey: this.s(def.causeKey),
      fixKey: this.s(def.fixKey),
      rowVisibility: this._expandedIds.has(def.id) ? "visible" : "gone",
      indicatorKey: this._expandedIds.has(def.id) ? "▾" : "▸",
      onToggle: () => this.onToggleExpand(def.id),
    }));
  };

  private prereqRow = (
    id: string,
    labelKey: string,
    toolKey: string,
    requiredTier: "required" | "optional",
    noteKey: string,
  ): PrereqRowCell => {
    const isRequired = requiredTier === "required";
    return {
      id,
      labelKey: this.s(labelKey),
      toolKey: this.s(toolKey),
      requiredTier,
      noteKey: this.s(noteKey),
      tierBadgeKey: this.s(
        isRequired ? "prereq_required_badge" : "prereq_optional_badge",
      ),
      tierBadgeBackground: isRequired
        ? "var(--color-danger)"
        : "var(--color-surface_muted)",
      tierBadgeColor: isRequired
        ? "var(--color-danger_ink)"
        : "var(--color-ink_muted)",
    };
  };

  private relatedLink = (
    id: string,
    labelKey: string,
    url: string,
  ): RelatedLinkCell => ({
    id,
    labelKey: this.s(labelKey),
    url,
    onNavigate: () => this.onNavigate(url),
  });

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
