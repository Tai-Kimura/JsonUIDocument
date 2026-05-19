"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  ParentSubSpecData,
  createParentSubSpecData,
} from "@/generated/data/ParentSubSpecData";
import { ParentSubSpecViewModel } from "@/viewmodels/spec/ParentSubSpecViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSpecParentSubSpecViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ParentSubSpecData>(createParentSubSpecData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ParentSubSpecViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ParentSubSpecViewModel(
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

  const setVars = (vars: Partial<ParentSubSpecData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
