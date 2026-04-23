// ViewModel for Tools > Agents.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AgentsData } from "@/generated/data/AgentsData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface AgentCell {
  id: string;
  nameKey: string;
  roleKey: string;
  whenToUseKey: string;
}

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ToolsAgentsViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => AgentsData;
  protected _setData: (
    data: AgentsData | ((prev: AgentsData) => AgentsData),
  ) => void;

  get data(): AgentsData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => AgentsData,
    setData: (
      data: AgentsData | ((prev: AgentsData) => AgentsData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<AgentsData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<AgentsData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateTools: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const agents: AgentCell[] = [
      "conductor", "define", "ground", "implement",
      "test", "debug", "nav_ios", "nav_android", "nav_web",
    ].map((id) => ({
      id,
      nameKey: this.s(`agent_${id}_name`),
      roleKey: this.s(`agent_${id}_role`),
      whenToUseKey: this.s(`agent_${id}_when`),
    }));

    const nextReads: NextReadCell[] = [
      {
        id: "next_cli",
        titleKey: this.s("next_cli_title"),
        descriptionKey: this.s("next_cli_description"),
        url: "/tools/cli",
        onNavigate: () => this.navigate("/tools/cli"),
      },
      {
        id: "next_mcp",
        titleKey: this.s("next_mcp_title"),
        descriptionKey: this.s("next_mcp_description"),
        url: "/tools/mcp",
        onNavigate: () => this.navigate("/tools/mcp"),
      },
    ];

    this.updateData({
      agents: this.asCollection(agents),
      nextReadLinks: this.asCollection(nextReads),
    });
  };

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`tools_agents_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
