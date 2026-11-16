"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SetupData, createSetupData } from "@/generated/data/SetupData";
import { SetupViewModel } from "@/viewmodels/viz/SetupViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSetupViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<SetupData>(createSetupData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<SetupViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new SetupViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<SetupData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
