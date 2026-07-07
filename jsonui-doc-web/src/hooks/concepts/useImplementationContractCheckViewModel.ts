"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  ImplementationContractCheckData,
  createImplementationContractCheckData,
} from "@/generated/data/ImplementationContractCheckData";
import { ImplementationContractCheckViewModel } from "@/viewmodels/concepts/ImplementationContractCheckViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useImplementationContractCheckViewModel(
  router: AppRouterInstance,
) {
  const [data, setData] = useState<ImplementationContractCheckData>(
    createImplementationContractCheckData(),
  );
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ImplementationContractCheckViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ImplementationContractCheckViewModel(
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

  const setVars = (vars: Partial<ImplementationContractCheckData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
