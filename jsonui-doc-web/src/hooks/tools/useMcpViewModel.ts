"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { McpData, createMcpData } from "@/generated/data/McpData";
import { McpViewModel } from "@/viewmodels/tools/McpViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

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

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<McpData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
