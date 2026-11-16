"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CodexData, createCodexData } from "@/generated/data/CodexData";
import { CodexViewModel } from "@/viewmodels/viz/CodexViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useCodexViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<CodexData>(createCodexData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<CodexViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new CodexViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<CodexData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
