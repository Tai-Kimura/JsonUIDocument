"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { InfraModelData, createInfraModelData } from "@/generated/data/InfraModelData";
import { InfraModelViewModel } from "@/viewmodels/viz/InfraModelViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useInfraModelViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<InfraModelData>(createInfraModelData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<InfraModelViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new InfraModelViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<InfraModelData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
