"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CliData, createCliData } from "@/generated/data/CliData";
import { CliViewModel } from "@/viewmodels/tools/CliViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useCliViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<CliData>(createCliData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<CliViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new CliViewModel(
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

  const setVars = (vars: Partial<CliData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
