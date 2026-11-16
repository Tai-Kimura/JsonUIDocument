"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  CustomTypesData,
  createCustomTypesData,
} from "@/generated/data/CustomTypesData";
import { CustomTypesViewModel } from "@/viewmodels/spec/CustomTypesViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSpecCustomTypesViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<CustomTypesData>(createCustomTypesData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<CustomTypesViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new CustomTypesViewModel(
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

  const setVars = (vars: Partial<CustomTypesData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
