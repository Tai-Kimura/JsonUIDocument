"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  WebFrameworkAdaptersData,
  createWebFrameworkAdaptersData,
} from "@/generated/data/WebFrameworkAdaptersData";
import { WebFrameworkAdaptersViewModel } from "@/viewmodels/guides/WebFrameworkAdaptersViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useWebFrameworkAdaptersViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<WebFrameworkAdaptersData>(createWebFrameworkAdaptersData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<WebFrameworkAdaptersViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new WebFrameworkAdaptersViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<WebFrameworkAdaptersData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
