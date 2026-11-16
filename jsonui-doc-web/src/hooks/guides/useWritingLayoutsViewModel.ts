"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WritingLayoutsData, createWritingLayoutsData } from "@/generated/data/WritingLayoutsData";
import { WritingLayoutsViewModel } from "@/viewmodels/guides/WritingLayoutsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useWritingLayoutsViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<WritingLayoutsData>(createWritingLayoutsData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<WritingLayoutsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new WritingLayoutsViewModel(
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

  const setVars = (vars: Partial<WritingLayoutsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
