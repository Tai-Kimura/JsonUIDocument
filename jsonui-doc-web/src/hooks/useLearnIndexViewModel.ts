"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LearnIndexData, createLearnIndexData } from "@/generated/data/LearnIndexData";
import { LearnIndexViewModel } from "@/viewmodels/LearnIndexViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useLearnIndexViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<LearnIndexData>(createLearnIndexData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const vmRef = useRef<LearnIndexViewModel | null>(null);
  if (!vmRef.current) {
    vmRef.current = new LearnIndexViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  useEffect(() => {
    vmRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => vmRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  return { data, viewModel: vmRef.current };
}
