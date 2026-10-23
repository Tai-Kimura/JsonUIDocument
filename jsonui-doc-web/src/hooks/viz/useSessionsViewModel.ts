"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SessionsData, createSessionsData } from "@/generated/data/SessionsData";
import { SessionsViewModel } from "@/viewmodels/viz/SessionsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSessionsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<SessionsData>(createSessionsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<SessionsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new SessionsViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<SessionsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
