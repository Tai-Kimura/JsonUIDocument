"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { McpToolsData, createMcpToolsData } from "@/generated/data/McpToolsData";
import { McpToolsViewModel } from "@/viewmodels/reference/McpToolsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useMcpToolsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<McpToolsData>(createMcpToolsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<McpToolsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new McpToolsViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<McpToolsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
