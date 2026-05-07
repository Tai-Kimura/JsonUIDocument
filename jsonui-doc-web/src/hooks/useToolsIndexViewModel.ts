"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ToolsIndexData, createToolsIndexData } from "@/generated/data/ToolsIndexData";
import { ToolsIndexViewModel } from "@/viewmodels/ToolsIndexViewModel";

export function useToolsIndexViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ToolsIndexData>(createToolsIndexData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const vmRef = useRef<ToolsIndexViewModel | null>(null);
  if (!vmRef.current) {
    vmRef.current = new ToolsIndexViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  return { data, viewModel: vmRef.current };
}
