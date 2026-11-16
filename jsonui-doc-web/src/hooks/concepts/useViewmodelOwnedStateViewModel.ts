"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ViewmodelOwnedStateData, createViewmodelOwnedStateData } from "@/generated/data/ViewmodelOwnedStateData";
import { ViewmodelOwnedStateViewModel } from "@/viewmodels/concepts/ViewmodelOwnedStateViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useViewmodelOwnedStateViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ViewmodelOwnedStateData>(createViewmodelOwnedStateData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ViewmodelOwnedStateViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ViewmodelOwnedStateViewModel(
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

  const setVars = (vars: Partial<ViewmodelOwnedStateData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
