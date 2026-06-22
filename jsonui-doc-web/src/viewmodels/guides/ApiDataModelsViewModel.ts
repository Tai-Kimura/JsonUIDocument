// ViewModel for Guides > API data models.
//
// Spec: docs/screens/json/guides/api-data-models.spec.json
// Layout: docs/screens/layouts/guides/api-data-models.json
//
// Cookbook companion to /concepts/data-models-from-openapi. Owns the 8
// catalog Collections, the 4-tab Domain-pattern switcher (§8), and one
// closing NextRead trio.
//
// Uses the SSR-safe `_useDefault` flag pattern (matches HomeViewModel).

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ApiDataModelsData } from "@/generated/data/ApiDataModelsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface FilterConfigRow {
  id: string;
  keyKey: string;
  typeKey: string;
  defaultKey: string;
  globKey: string;
  descriptionKey: string;
}

interface FilterEvalRow {
  id: string;
  orderKey: string;
  ruleKey: string;
  bodyKey: string;
}

interface ComparisonRow {
  id: string;
  labelKey: string;
  leftKey: string;
  rightKey: string;
  thirdKey: string;
  // Spec exposes these too — populated for compatibility with the
  // comparison_row cell's data block (it tolerates empty values).
  schemaSideKey: string;
  appSideKey: string;
  moshiKey: string;
  kotlinxKey: string;
  noneKey: string;
}

interface McpFieldRow {
  id: string;
  toolKey: string;
  fieldKey: string;
  typeKey: string;
  bodyKey: string;
}

interface HaltRow {
  id: string;
  triggerKey: string;
  behaviorKey: string;
  workaroundKey: string;
}

interface TabHeaderCell {
  id: string;
  labelKey: string;
  bgColor: string;
  fgColor: string;
  borderColor: string;
  onSelect: () => void;
}

interface NextReadLink {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ApiDataModelsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ApiDataModelsData;
  protected _setData: (
    data: ApiDataModelsData | ((prev: ApiDataModelsData) => ApiDataModelsData),
  ) => void;

  private _activeDomainPattern: string = "proxy";

  get data(): ApiDataModelsData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => ApiDataModelsData,
    setData: (
      data: ApiDataModelsData | ((prev: ApiDataModelsData) => ApiDataModelsData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ApiDataModelsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ApiDataModelsData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateGuides: () => this.navigate("/guides"),
    });
  };

  onAppear = () => {
    this.updateData({
      filterConfigRows: this.asCollection(this.buildFilterConfigRows()),
      filterEvalRows: this.asCollection(this.buildFilterEvalRows()),
      skipDomainCompareRows: this.asCollection(this.buildSkipDomainCompareRows()),
      mcpPreviewFields: this.asCollection(this.buildMcpPreviewFields()),
      mcpDiscoveryFields: this.asCollection(this.buildMcpDiscoveryFields()),
      androidSerializerRows: this.asCollection(this.buildAndroidSerializerRows()),
      webCaseRows: this.asCollection(this.buildWebCaseRows()),
      haltRows: this.asCollection(this.buildHaltRows()),
      domainPatternTabs: this.asCollection(this.buildDomainPatternTabs(this._activeDomainPattern)),
      nextReadLinks: this.asCollection(this.buildNextReads()),
      ...this.domainPatternVisibilityFor(this._activeDomainPattern),
    });
  };

  mountLanguage = (): void => {
    this._useDefault = false;
    this.onAppear();
  };

  onSelectCodeTab = (id: string): void => {
    this._activeDomainPattern = id;
    this.updateData({
      domainPatternTabs: this.asCollection(this.buildDomainPatternTabs(id)),
      ...this.domainPatternVisibilityFor(id),
    });
  };

  onNavigate = (url: string): void => {
    this.navigate(url);
  };

  navigate = (url: string): void => {
    this.router.push(url);
  };

  // ── builders ──

  private buildFilterConfigRows = (): FilterConfigRow[] => {
    const ids = ["include_paths", "exclude_paths", "include_schemas", "exclude_schemas", "skip_domain"];
    return ids.map((id) => ({
      id: `filter_config_${id}`,
      keyKey: this.sf(`row_${id}_key`),
      typeKey: this.sf(`row_${id}_type`),
      defaultKey: this.sf(`row_${id}_default`),
      globKey: this.sf(`row_${id}_glob`),
      descriptionKey: this.sf(`row_${id}_description`),
    }));
  };

  private buildFilterEvalRows = (): FilterEvalRow[] => {
    const items: Array<{ id: string; order: string; rule: string; body: string }> = [
      { id: "eval_1", order: "1", rule: "eval_path_includes_rule",   body: "eval_path_includes_body" },
      { id: "eval_2", order: "2", rule: "eval_path_excludes_rule",   body: "eval_path_excludes_body" },
      { id: "eval_3", order: "3", rule: "eval_schema_includes_rule", body: "eval_schema_includes_body" },
      { id: "eval_4", order: "4", rule: "eval_schema_excludes_rule", body: "eval_schema_excludes_body" },
    ];
    return items.map((it) => ({
      id: it.id,
      orderKey: it.order,
      ruleKey: this.sf(it.rule),
      bodyKey: this.sf(it.body),
    }));
  };

  private buildSkipDomainCompareRows = (): ComparisonRow[] => {
    const ids = ["where", "scope", "when_to_pick"];
    return ids.map((id) => {
      const left = this.ssd(`row_${id}_schema_side`);
      const right = this.ssd(`row_${id}_app_side`);
      return {
        id: `skip_domain_${id}`,
        labelKey: this.ssd(`row_${id}_label`),
        leftKey: left,
        rightKey: right,
        thirdKey: "",
        schemaSideKey: left,
        appSideKey: right,
        moshiKey: "",
        kotlinxKey: "",
        noneKey: "",
      };
    });
  };

  private buildMcpPreviewFields = (): McpFieldRow[] => {
    const ids = ["kept_schemas", "filtered_out", "skip_domain_matches", "halts"];
    return ids.map((id) => ({
      id: `preview_${id}`,
      toolKey: this.smp("tool_label"),
      fieldKey: this.smp(`field_${id}_name`),
      typeKey: this.smp(`field_${id}_type`),
      bodyKey: this.smp(`field_${id}_body`),
    }));
  };

  private buildMcpDiscoveryFields = (): McpFieldRow[] => {
    type Entry = { id: string; tool: string; field: string; type: string; body: string };
    const entries: Entry[] = [
      { id: "list_specs_api_directory", tool: "list_api_specs_label",  field: "list_specs_field_api_directory_name", type: "list_specs_field_api_directory_type", body: "list_specs_field_api_directory_body" },
      { id: "list_specs_files",         tool: "list_api_specs_label",  field: "list_specs_field_files_name",         type: "list_specs_field_files_type",         body: "list_specs_field_files_body" },
      { id: "list_specs_halts",         tool: "list_api_specs_label",  field: "list_specs_field_halts_name",         type: "list_specs_field_halts_type",         body: "list_specs_field_halts_body" },
      { id: "list_models_dto",          tool: "list_api_models_label", field: "list_models_field_dto_files_name",   type: "list_models_field_dto_files_type",   body: "list_models_field_dto_files_body" },
      { id: "list_models_domain",       tool: "list_api_models_label", field: "list_models_field_domain_scaffolds_name", type: "list_models_field_domain_scaffolds_type", body: "list_models_field_domain_scaffolds_body" },
      { id: "list_models_orphans",      tool: "list_api_models_label", field: "list_models_field_orphans_name",     type: "list_models_field_orphans_type",     body: "list_models_field_orphans_body" },
    ];
    return entries.map((e) => ({
      id: `discovery_${e.id}`,
      toolKey: this.smd(e.tool),
      fieldKey: this.smd(e.field),
      typeKey: this.smd(e.type),
      bodyKey: this.smd(e.body),
    }));
  };

  private buildAndroidSerializerRows = (): ComparisonRow[] => {
    const ids = ["annotation", "build_setup", "when_to_use"];
    return ids.map((id) => {
      const moshi = this.s(`android_row_${id}_moshi`);
      const kotlinx = this.s(`android_row_${id}_kotlinx`);
      const none = this.s(`android_row_${id}_none`);
      return {
        id: `android_${id}`,
        labelKey: this.s(`android_row_${id}_label`),
        leftKey: moshi,
        rightKey: kotlinx,
        thirdKey: none,
        schemaSideKey: "",
        appSideKey: "",
        moshiKey: moshi,
        kotlinxKey: kotlinx,
        noneKey: none,
      };
    });
  };

  private buildWebCaseRows = (): ComparisonRow[] => {
    const ids = ["wire_shape", "runtime_cost", "when_to_use"];
    return ids.map((id) => {
      const snake = this.s(`web_case_row_${id}_snake`);
      const camel = this.s(`web_case_row_${id}_camel`);
      return {
        id: `web_case_${id}`,
        labelKey: this.s(`web_case_row_${id}_label`),
        leftKey: snake,
        rightKey: camel,
        thirdKey: "",
        schemaSideKey: "",
        appSideKey: "",
        moshiKey: "",
        kotlinxKey: "",
        noneKey: "",
      };
    });
  };

  private buildHaltRows = (): HaltRow[] => {
    const ids = ["format_aware", "one_of", "discriminator", "multi_file_ref", "yaml", "self_ref"];
    return ids.map((id) => ({
      id: `halt_${id}`,
      triggerKey: this.s(`halt_${id}_trigger`),
      behaviorKey: this.s(`halt_${id}_behavior`),
      workaroundKey: this.s(`halt_${id}_workaround`),
    }));
  };

  buildDomainPatternTabs = (activeId: string): TabHeaderCell[] => {
    const make = (id: string, labelKey: string): TabHeaderCell => {
      const isActive = id === activeId;
      return {
        id,
        labelKey,
        bgColor: isActive ? "var(--color-accent)" : "var(--color-surface)",
        fgColor: isActive ? "var(--color-accent_ink)" : "var(--color-ink)",
        borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
        onSelect: () => this.onSelectCodeTab(id),
      };
    };
    return [
      make("proxy",     this.s("tab_proxy")),
      make("type_conv", this.s("tab_type_conv")),
      make("computed",  this.s("tab_computed")),
      make("stored",    this.s("tab_stored")),
    ];
  };

  private buildNextReads = (): NextReadLink[] => [
    {
      id: "next_concept_data_models_from_openapi",
      titleKey: this.s("next_concept_title"),
      descriptionKey: this.s("next_concept_description"),
      url: "/concepts/data-models-from-openapi",
      onNavigate: () => this.navigate("/concepts/data-models-from-openapi"),
    },
    {
      id: "next_cli_commands",
      titleKey: this.s("next_cli_commands_title"),
      descriptionKey: this.s("next_cli_commands_description"),
      url: "/reference/cli-commands",
      onNavigate: () => this.navigate("/reference/cli-commands"),
    },
    {
      id: "next_mcp",
      titleKey: this.s("next_mcp_title"),
      descriptionKey: this.s("next_mcp_description"),
      url: "/tools/mcp",
      onNavigate: () => this.navigate("/tools/mcp"),
    },
  ];

  private domainPatternVisibilityFor = (
    id: string,
  ): Pick<
    ApiDataModelsData,
    | "proxyPatternPanelVisibility"
    | "typeConvPatternPanelVisibility"
    | "computedPatternPanelVisibility"
    | "storedPatternPanelVisibility"
  > => ({
    proxyPatternPanelVisibility: id === "proxy" ? "visible" : "gone",
    typeConvPatternPanelVisibility: id === "type_conv" ? "visible" : "gone",
    computedPatternPanelVisibility: id === "computed" ? "visible" : "gone",
    storedPatternPanelVisibility: id === "stored" ? "visible" : "gone",
  });

  // SSR-safe lookups, one per sub-namespace.
  private _useDefault = true;
  private resolve = (full: string): string =>
    this._useDefault
      ? StringManager.getDefaultString(full)
      : StringManager.getString(full);

  private s = (key: string): string => this.resolve(`guides_api_data_models_${key}`);
  private sf = (key: string): string => this.resolve(`guides_api_data_models_filter_${key}`);
  private ssd = (key: string): string => this.resolve(`guides_api_data_models_skip_domain_${key}`);
  private smp = (key: string): string => this.resolve(`guides_api_data_models_mcp_preview_${key}`);
  private smd = (key: string): string => this.resolve(`guides_api_data_models_mcp_discovery_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
