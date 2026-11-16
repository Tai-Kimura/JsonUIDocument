"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  ComponentSpecData,
  createComponentSpecData,
} from "@/generated/data/ComponentSpecData";
import { ComponentSpecViewModel } from "@/viewmodels/spec/ComponentSpecViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSpecComponentSpecViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ComponentSpecData>(createComponentSpecData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ComponentSpecViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ComponentSpecViewModel(
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

  const setVars = (vars: Partial<ComponentSpecData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
