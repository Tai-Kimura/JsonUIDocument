"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SwiftData, createSwiftData } from "@/generated/data/SwiftData";
import { SwiftViewModel } from "@/viewmodels/platforms/SwiftViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSwiftViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<SwiftData>(createSwiftData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<SwiftViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new SwiftViewModel(
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

  const setVars = (vars: Partial<SwiftData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
