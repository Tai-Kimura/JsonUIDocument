"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  UnitContractsData,
  createUnitContractsData,
} from "@/generated/data/UnitContractsData";
import { UnitContractsViewModel } from "@/viewmodels/guides/UnitContractsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useUnitContractsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<UnitContractsData>(createUnitContractsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<UnitContractsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new UnitContractsViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<UnitContractsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
