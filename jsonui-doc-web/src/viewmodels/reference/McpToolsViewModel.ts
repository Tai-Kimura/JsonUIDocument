// ViewModel for Reference > MCP tool API.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { McpToolsData } from "@/generated/data/McpToolsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

interface McpToolDetailCell {
  id: string;
  nameKey: string;
  groupKey: string;
  roleKey: string;
  paramsHeadingKey: string;
  paramsCode: string;
}

// Catalog order matches /tools/mcp McpViewModel.TOOL_IDS — A (Lookup) →
// B (Validation) → C (Generation) → D (Build + Runtime). Keep them in sync.
const TOOL_IDS = [
  "get_project_config", "list_screen_specs", "list_layouts", "list_component_specs",
  "lookup_component", "lookup_attribute", "search_components", "get_data_source",

  "doc_validate_spec", "doc_validate_component", "doc_rules_init", "doc_rules_show",
  "jui_verify", "get_binding_rules",

  "doc_init_spec", "doc_init_component", "doc_generate_spec", "doc_generate_component",
  "doc_generate_html", "jui_generate_project", "jui_generate_screen",

  "jui_init", "jui_build", "jui_sync_tool", "jui_generate_converter", "jui_migrate_layouts",
  "read_spec_file", "read_layout_file", "get_platform_mapping", "get_modifier_order",
] as const;

export class McpToolsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => McpToolsData;
  protected _setData: (
    data: McpToolsData | ((prev: McpToolsData) => McpToolsData),
  ) => void;

  get data(): McpToolsData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => McpToolsData,
    setData: (data: McpToolsData | ((prev: McpToolsData) => McpToolsData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<McpToolsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<McpToolsData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateReference: () => this.navigate("/"),
    });
  };

  // SSR-safe initial seed: uses getDefaultString so server + first client
  // render produce identical text. mountLanguage re-seeds with the
  // persisted locale post-hydration.
  onAppear = () => {
    this.updateData({
      tools: this.asCollection(this.buildTools((k) => StringManager.getDefaultString(k))),
      nextReadLinks: this.asCollection(this.buildNextReads((k) => StringManager.getDefaultString(k))),
    });
  };

  mountLanguage = (): void => {
    this.updateData({
      tools: this.asCollection(this.buildTools((k) => StringManager.getString(k))),
      nextReadLinks: this.asCollection(this.buildNextReads((k) => StringManager.getString(k))),
    });
  };

  private buildTools = (lookup: (key: string) => string): McpToolDetailCell[] =>
    TOOL_IDS.map((id) => {
      const paramsKey = `reference_mcp_tools_tool_${id}_params`;
      const params = lookup(paramsKey);
      const hasParams = params && params !== paramsKey;
      return {
        id,
        nameKey: lookup(`tools_mcp_tool_${id}_name`),
        groupKey: lookup(`tools_mcp_tool_${id}_group`),
        roleKey: lookup(`tools_mcp_tool_${id}_role`),
        paramsHeadingKey: lookup(`reference_mcp_tools_params_heading`),
        paramsCode: hasParams ? params : lookup(`reference_mcp_tools_no_params`),
      };
    });

  private buildNextReads = (lookup: (key: string) => string): NextReadCell[] => [
    {
      id: "next_mcp_overview",
      titleKey: lookup("reference_mcp_tools_next_mcp_overview_title"),
      descriptionKey: lookup("reference_mcp_tools_next_mcp_overview_description"),
      url: "/tools/mcp",
      onNavigate: () => this.navigate("/tools/mcp"),
    },
    {
      id: "next_agents",
      titleKey: lookup("reference_mcp_tools_next_agents_title"),
      descriptionKey: lookup("reference_mcp_tools_next_agents_description"),
      url: "/tools/agents",
      onNavigate: () => this.navigate("/tools/agents"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
