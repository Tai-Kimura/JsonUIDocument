"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  LayoutFileData,
  createLayoutFileData,
} from "@/generated/data/LayoutFileData";
import { LayoutFileViewModel } from "@/viewmodels/spec/LayoutFileViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSpecLayoutFileViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<LayoutFileData>(createLayoutFileData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<LayoutFileViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new LayoutFileViewModel(
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

  const setVars = (vars: Partial<LayoutFileData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
