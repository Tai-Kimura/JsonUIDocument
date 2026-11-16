"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { JsonSchemaData, createJsonSchemaData } from "@/generated/data/JsonSchemaData";
import { JsonSchemaViewModel } from "@/viewmodels/reference/JsonSchemaViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useJsonSchemaViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<JsonSchemaData>(createJsonSchemaData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<JsonSchemaViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new JsonSchemaViewModel(
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

  const setVars = (vars: Partial<JsonSchemaData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
