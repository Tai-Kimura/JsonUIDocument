"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  BranchTestsData,
  createBranchTestsData,
} from "@/generated/data/BranchTestsData";
import { BranchTestsViewModel } from "@/viewmodels/guides/BranchTestsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useBranchTestsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<BranchTestsData>(createBranchTestsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<BranchTestsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new BranchTestsViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<BranchTestsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
