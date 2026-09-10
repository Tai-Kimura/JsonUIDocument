"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  FromSpecsData,
  createFromSpecsData,
} from "@/generated/data/FromSpecsData";
import { FromSpecsViewModel } from "@/viewmodels/diagram/FromSpecsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useFromSpecsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<FromSpecsData>(createFromSpecsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<FromSpecsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new FromSpecsViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<FromSpecsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
