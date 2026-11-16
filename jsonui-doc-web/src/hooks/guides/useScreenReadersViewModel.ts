"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  ScreenReadersData,
  createScreenReadersData,
} from "@/generated/data/ScreenReadersData";
import { ScreenReadersViewModel } from "@/viewmodels/guides/ScreenReadersViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useScreenReadersViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ScreenReadersData>(createScreenReadersData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ScreenReadersViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ScreenReadersViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<ScreenReadersData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
