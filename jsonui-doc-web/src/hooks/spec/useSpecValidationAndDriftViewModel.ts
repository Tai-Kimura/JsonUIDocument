"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  ValidationAndDriftData,
  createValidationAndDriftData,
} from "@/generated/data/ValidationAndDriftData";
import { ValidationAndDriftViewModel } from "@/viewmodels/spec/ValidationAndDriftViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSpecValidationAndDriftViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ValidationAndDriftData>(createValidationAndDriftData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ValidationAndDriftViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ValidationAndDriftViewModel(
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

  const setVars = (vars: Partial<ValidationAndDriftData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
