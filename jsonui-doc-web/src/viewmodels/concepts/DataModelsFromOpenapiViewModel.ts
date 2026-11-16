// ViewModel for Concepts > Data models from OpenAPI.
//
// Spec: docs/screens/json/concepts/data-models-from-openapi.spec.json
// Layout: docs/screens/layouts/concepts/data-models-from-openapi.json
//
// Eighth concept essay. Concept side of the swagger-driven Data Model
// landing: explains DTO+Domain split, the drift problem it solves, the
// per-consumer path filter, MCP Group E discovery surface, lifecycle,
// and the v1 ERROR-halt set. Companion cookbook at /guides/api-data-models.
//
// Uses the SSR-safe `_useDefault` flag pattern (matches HomeViewModel).
// On construction we resolve every string through StringManager.getDefaultString
// so the server render and the first client render produce identical text.
// mountLanguage() flips the flag and re-seeds with persisted locale.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DataModelsFromOpenapiData } from "@/generated/data/DataModelsFromOpenapiData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface ComparisonRow {
  id: string;
  labelKey: string;
  dtoKey: string;
  domainKey: string;
  leftKey: string;
  rightKey: string;
  thirdKey: string;
}

interface LifecycleStepRow {
  id: string;
  stepKey: string;
  bodyKey: string;
}

interface HaltRow {
  id: string;
  triggerKey: string;
  behaviorKey: string;
  workaroundKey: string;
}

interface McpToolCell {
  id: string;
  nameKey: string;
  roleKey: string;
  useCaseKey: string;
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

export class DataModelsFromOpenapiViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => DataModelsFromOpenapiData;
  protected _setData: (
    data: DataModelsFromOpenapiData | ((prev: DataModelsFromOpenapiData) => DataModelsFromOpenapiData),
  ) => void;

  private _activeDtoTab: string = "swift";
  private _activeDomainTab: string = "swift";

  get data(): DataModelsFromOpenapiData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => DataModelsFromOpenapiData,
    setData: (
      data: DataModelsFromOpenapiData | ((prev: DataModelsFromOpenapiData) => DataModelsFromOpenapiData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<DataModelsFromOpenapiData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<DataModelsFromOpenapiData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateApiDataModels: () => this.navigate("/guides/api-data-models"),
      onNavigateMcpTools: () => this.navigate("/reference/mcp-tools"),
      onNavigateConcepts: () => this.navigate("/concepts"),
    });
  };

  onAppear = () => {
    this.updateData({
      dtoVsDomainRows: this.asCollection(this.buildDtoVsDomainRows()),
      platformDtoTabs: this.asCollection(this.buildDtoTabs(this._activeDtoTab)),
      platformDomainTabs: this.asCollection(this.buildDomainTabs(this._activeDomainTab)),
      lifecycleRows: this.asCollection(this.buildLifecycleRows()),
      halts: this.asCollection(this.buildHaltRows()),
      mcpGroupETools: this.asCollection(this.buildMcpGroupETools()),
      nextReadLinks: this.asCollection(this.buildNextReads()),
      ...this.dtoVisibilityFor(this._activeDtoTab),
      ...this.domainVisibilityFor(this._activeDomainTab),
    });
  };

  mountLanguage = (): void => {
    this._useDefault = false;
    this.onAppear();
  };

  onSelectDtoTab = (id: string): void => {
    this._activeDtoTab = id;
    this.updateData({
      platformDtoTabs: this.asCollection(this.buildDtoTabs(id)),
      ...this.dtoVisibilityFor(id),
    });
  };

  onSelectCodeTab = (id: string): void => {
    // T6 tab toggle for the Domain switcher. Reuses the project-wide
    // `onSelectCodeTab` event-handler name from the spec whitelist.
    this._activeDomainTab = id;
    this.updateData({
      platformDomainTabs: this.asCollection(this.buildDomainTabs(id)),
      ...this.domainVisibilityFor(id),
    });
  };

  onNavigate = (url: string): void => {
    this.navigate(url);
  };

  navigate = (url: string): void => {
    this.router.push(url);
  };

  // ── builders ──

  private buildDtoVsDomainRows = (): ComparisonRow[] => {
    const rows: Array<{ id: string; labelKey: string; dtoKey: string; domainKey: string }> = [
      { id: "row_owner",   labelKey: "row_owner_label",   dtoKey: "row_owner_dto",   domainKey: "row_owner_domain" },
      { id: "row_cadence", labelKey: "row_cadence_label", dtoKey: "row_cadence_dto", domainKey: "row_cadence_domain" },
      { id: "row_holds",   labelKey: "row_holds_label",   dtoKey: "row_holds_dto",   domainKey: "row_holds_domain" },
    ];
    return rows.map((r) => ({
      id: r.id,
      labelKey: this.s(r.labelKey),
      dtoKey: this.s(r.dtoKey),
      domainKey: this.s(r.domainKey),
      leftKey: this.s(r.dtoKey),
      rightKey: this.s(r.domainKey),
      thirdKey: "",
    }));
  };

  buildDtoTabs = (activeId: string): TabHeaderCell[] => {
    const make = (id: string, labelKey: string): TabHeaderCell => {
      const isActive = id === activeId;
      return {
        id,
        labelKey,
        bgColor: isActive ? "var(--color-accent)" : "var(--color-surface)",
        fgColor: isActive ? "var(--color-accent_ink)" : "var(--color-ink)",
        borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
        onSelect: () => this.onSelectDtoTab(id),
      };
    };
    return [
      make("swift",  this.s("tab_swift")),
      make("kotlin", this.s("tab_kotlin")),
      make("ts",     this.s("tab_ts")),
    ];
  };

  buildDomainTabs = (activeId: string): TabHeaderCell[] => {
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
      make("swift",  this.s("tab_swift")),
      make("kotlin", this.s("tab_kotlin")),
      make("ts",     this.s("tab_ts")),
    ];
  };

  private buildLifecycleRows = (): LifecycleStepRow[] => {
    const ids = ["dto_regen", "domain_skip", "filter_apply", "orphan_handling", "drift_check"];
    return ids.map((id) => ({
      id: `lifecycle_${id}`,
      stepKey: this.s(`lifecycle_${id}_step`),
      bodyKey: this.s(`lifecycle_${id}_body`),
    }));
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

  private buildMcpGroupETools = (): McpToolCell[] => {
    const ids = ["list_api_specs", "list_api_models", "preview_api_model_sync"];
    return ids.map((id) => ({
      id: `mcp_${id}`,
      nameKey: this.s(`mcp_${id}_name`),
      roleKey: this.s(`mcp_${id}_role`),
      useCaseKey: this.s(`mcp_${id}_use_case`),
    }));
  };

  private buildNextReads = (): NextReadLink[] => [
    {
      id: "next_guide_api_data_models",
      titleKey: this.s("next_guide_api_data_models_title"),
      descriptionKey: this.s("next_guide_api_data_models_description"),
      url: "/guides/api-data-models",
      onNavigate: () => this.navigate("/guides/api-data-models"),
    },
    {
      id: "next_why_spec_first",
      titleKey: this.s("next_why_spec_first_title"),
      descriptionKey: this.s("next_why_spec_first_description"),
      url: "/concepts/why-spec-first",
      onNavigate: () => this.navigate("/concepts/why-spec-first"),
    },
    {
      id: "next_one_layout_json",
      titleKey: this.s("next_one_layout_json_title"),
      descriptionKey: this.s("next_one_layout_json_description"),
      url: "/concepts/one-layout-json",
      onNavigate: () => this.navigate("/concepts/one-layout-json"),
    },
  ];

  private dtoVisibilityFor = (
    id: string,
  ): Pick<
    DataModelsFromOpenapiData,
    "swiftDtoPanelVisibility" | "kotlinDtoPanelVisibility" | "tsDtoPanelVisibility"
  > => ({
    swiftDtoPanelVisibility: id === "swift" ? "visible" : "gone",
    kotlinDtoPanelVisibility: id === "kotlin" ? "visible" : "gone",
    tsDtoPanelVisibility: id === "ts" ? "visible" : "gone",
  });

  private domainVisibilityFor = (
    id: string,
  ): Pick<
    DataModelsFromOpenapiData,
    "swiftDomainPanelVisibility" | "kotlinDomainPanelVisibility" | "tsDomainPanelVisibility"
  > => ({
    swiftDomainPanelVisibility: id === "swift" ? "visible" : "gone",
    kotlinDomainPanelVisibility: id === "kotlin" ? "visible" : "gone",
    tsDomainPanelVisibility: id === "ts" ? "visible" : "gone",
  });

  // SSR-safe lookup. Mirrors HomeViewModel._useDefault.
  private _useDefault = true;
  private s = (key: string): string => {
    const full = `concepts_data_models_from_openapi_${key}`;
    return this._useDefault
      ? StringManager.getDefaultString(full)
      : StringManager.getString(full);
  };

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
