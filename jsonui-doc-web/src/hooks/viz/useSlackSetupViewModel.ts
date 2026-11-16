"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SlackSetupData, createSlackSetupData } from "@/generated/data/SlackSetupData";
import { SlackSetupViewModel } from "@/viewmodels/viz/SlackSetupViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSlackSetupViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<SlackSetupData>(createSlackSetupData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<SlackSetupViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new SlackSetupViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<SlackSetupData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
