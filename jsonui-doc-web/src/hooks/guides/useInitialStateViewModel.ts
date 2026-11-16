"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  InitialStateData,
  createInitialStateData,
} from "@/generated/data/InitialStateData";
import { InitialStateViewModel } from "@/viewmodels/guides/InitialStateViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useInitialStateViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<InitialStateData>(createInitialStateData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<InitialStateViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new InitialStateViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<InitialStateData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
