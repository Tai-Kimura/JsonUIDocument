"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  SplitOverviewData,
  createSplitOverviewData,
} from "@/generated/data/SplitOverviewData";
import { SplitOverviewViewModel } from "@/viewmodels/spec/SplitOverviewViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSpecSplitOverviewViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<SplitOverviewData>(
    createSplitOverviewData(),
  );
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<SplitOverviewViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new SplitOverviewViewModel(
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

  const setVars = (vars: Partial<SplitOverviewData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
