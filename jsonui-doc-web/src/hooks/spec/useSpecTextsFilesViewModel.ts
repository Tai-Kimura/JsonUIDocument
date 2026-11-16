"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  TextsFilesData,
  createTextsFilesData,
} from "@/generated/data/TextsFilesData";
import { TextsFilesViewModel } from "@/viewmodels/spec/TextsFilesViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSpecTextsFilesViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<TextsFilesData>(createTextsFilesData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<TextsFilesViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new TextsFilesViewModel(
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

  const setVars = (vars: Partial<TextsFilesData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
