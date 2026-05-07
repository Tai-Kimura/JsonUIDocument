"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AgentsData, createAgentsData } from "@/generated/data/AgentsData";
import { ToolsAgentsViewModel } from "@/viewmodels/tools/ToolsAgentsViewModel";

export function useToolsAgentsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<AgentsData>(createAgentsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ToolsAgentsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ToolsAgentsViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<AgentsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
