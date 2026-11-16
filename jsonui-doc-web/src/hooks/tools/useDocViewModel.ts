"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DocData, createDocData } from "@/generated/data/DocData";
import { DocViewModel } from "@/viewmodels/tools/DocViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useDocViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<DocData>(createDocData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<DocViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new DocViewModel(
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

  const setVars = (vars: Partial<DocData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
