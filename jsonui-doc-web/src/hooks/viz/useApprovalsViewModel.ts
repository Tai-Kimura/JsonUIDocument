"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ApprovalsData, createApprovalsData } from "@/generated/data/ApprovalsData";
import { ApprovalsViewModel } from "@/viewmodels/viz/ApprovalsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useApprovalsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ApprovalsData>(createApprovalsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ApprovalsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ApprovalsViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<ApprovalsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
