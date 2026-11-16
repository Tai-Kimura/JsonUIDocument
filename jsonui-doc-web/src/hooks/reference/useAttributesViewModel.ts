"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AttributesData, createAttributesData } from "@/generated/data/AttributesData";
import { AttributesViewModel } from "@/viewmodels/reference/AttributesViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useAttributesViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<AttributesData>(createAttributesData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<AttributesViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new AttributesViewModel(
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

  const setVars = (vars: Partial<AttributesData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
