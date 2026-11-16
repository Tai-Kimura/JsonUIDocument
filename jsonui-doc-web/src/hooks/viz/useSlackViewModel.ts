"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SlackData, createSlackData } from "@/generated/data/SlackData";
import { SlackViewModel } from "@/viewmodels/viz/SlackViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSlackViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<SlackData>(createSlackData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<SlackViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new SlackViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<SlackData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
