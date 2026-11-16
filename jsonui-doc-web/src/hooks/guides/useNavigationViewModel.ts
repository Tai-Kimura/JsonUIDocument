"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NavigationData, createNavigationData } from "@/generated/data/NavigationData";
import { NavigationViewModel } from "@/viewmodels/guides/NavigationViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useNavigationViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<NavigationData>(createNavigationData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<NavigationViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new NavigationViewModel(
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

  const setVars = (vars: Partial<NavigationData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
