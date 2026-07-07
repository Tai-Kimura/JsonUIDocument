"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  VerifyingImplementationAgainstDocsData,
  createVerifyingImplementationAgainstDocsData,
} from "@/generated/data/VerifyingImplementationAgainstDocsData";
import { VerifyingImplementationAgainstDocsViewModel } from "@/viewmodels/guides/VerifyingImplementationAgainstDocsViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useVerifyingImplementationAgainstDocsViewModel(
  router: AppRouterInstance,
) {
  const [data, setData] = useState<VerifyingImplementationAgainstDocsData>(
    createVerifyingImplementationAgainstDocsData(),
  );
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef =
    useRef<VerifyingImplementationAgainstDocsViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new VerifyingImplementationAgainstDocsViewModel(
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

  const setVars = (vars: Partial<VerifyingImplementationAgainstDocsData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
