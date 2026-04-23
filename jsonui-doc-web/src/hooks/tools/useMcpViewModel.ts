"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { McpData, createMcpData } from "@/generated/data/McpData";
import { McpViewModel } from "@/viewmodels/tools/McpViewModel";

export function useMcpViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<McpData>(createMcpData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<McpViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new McpViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<McpData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
