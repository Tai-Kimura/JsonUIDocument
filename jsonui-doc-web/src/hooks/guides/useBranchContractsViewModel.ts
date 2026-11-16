"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  BranchContractsData,
  createBranchContractsData,
} from "@/generated/data/BranchContractsData";
import { BranchContractsViewModel } from "@/viewmodels/guides/BranchContractsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useBranchContractsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<BranchContractsData>(createBranchContractsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<BranchContractsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new BranchContractsViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<BranchContractsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
