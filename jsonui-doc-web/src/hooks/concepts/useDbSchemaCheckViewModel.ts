"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  DbSchemaCheckData,
  createDbSchemaCheckData,
} from "@/generated/data/DbSchemaCheckData";
import { DbSchemaCheckViewModel } from "@/viewmodels/concepts/DbSchemaCheckViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useDbSchemaCheckViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<DbSchemaCheckData>(createDbSchemaCheckData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<DbSchemaCheckViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new DbSchemaCheckViewModel(
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

  const setVars = (vars: Partial<DbSchemaCheckData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
