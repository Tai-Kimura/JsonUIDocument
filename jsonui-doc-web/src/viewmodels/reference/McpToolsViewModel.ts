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

  onAppear = () => {

    const nextReads: NextReadCell[] = [
      {
        id: "next_mcp_overview",
        titleKey: this.s("next_mcp_overview_title"),
        descriptionKey: this.s("next_mcp_overview_description"),
        url: "/tools/mcp",
        onNavigate: () => this.navigate("/tools/mcp"),
      },
      {
        id: "next_agents",
        titleKey: this.s("next_agents_title"),
        descriptionKey: this.s("next_agents_description"),
        url: "/tools/agents",
        onNavigate: () => this.navigate("/tools/agents"),
      },
    ];

    this.updateData({ nextReadLinks: this.asCollection(nextReads) });
  };

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`reference_mcp_tools_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
