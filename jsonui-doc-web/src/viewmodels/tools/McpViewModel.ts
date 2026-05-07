// ViewModel for Tools > MCP server.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { McpData } from "@/generated/data/McpData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface McpToolCell {
  id: string;
  nameKey: string;
  groupKey: string;
  roleKey: string;
}

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

const TOOL_IDS = [
  "get_project_config", "list_screen_specs", "list_layouts", "list_component_specs",
  "lookup_component", "lookup_attribute", "search_components",

  "doc_validate_spec", "doc_validate_component", "doc_rules_init", "doc_rules_show",
  "jui_verify", "get_binding_rules",

  "doc_init_spec", "doc_init_component", "doc_generate_spec", "doc_generate_component",
  "doc_generate_html", "jui_generate_project", "jui_generate_screen",

  "jui_init", "jui_build", "jui_sync_tool", "jui_generate_converter", "jui_migrate_layouts",
  "read_spec_file", "read_layout_file", "get_platform_mapping", "get_modifier_order",
] as const;

export class McpViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => McpData;
  protected _setData: (
    data: McpData | ((prev: McpData) => McpData),
  ) => void;

  get data(): McpData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => McpData,
    setData: (data: McpData | ((prev: McpData) => McpData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<McpData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<McpData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateTools: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const tools: McpToolCell[] = TOOL_IDS.map((id) => ({
      id,
      nameKey: this.s(`tool_${id}_name`),
      groupKey: this.s(`tool_${id}_group`),
      roleKey: this.s(`tool_${id}_role`),
    }));

    const nextReads: NextReadCell[] = [
      {
        id: "next_agents",
        titleKey: this.s("next_agents_title"),
        descriptionKey: this.s("next_agents_description"),
        url: "/tools/agents",
        onNavigate: () => this.navigate("/tools/agents"),
      },
      {
        id: "next_cli",
        titleKey: this.s("next_cli_title"),
        descriptionKey: this.s("next_cli_description"),
        url: "/tools/cli",
        onNavigate: () => this.navigate("/tools/cli"),
      },
    ];

    this.updateData({
      tools: this.asCollection(tools),
      nextReadLinks: this.asCollection(nextReads),
    });
  };

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`tools_mcp_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
