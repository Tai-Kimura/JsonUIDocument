"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SpecIndexData, createSpecIndexData } from "@/generated/data/SpecIndexData";
import { SpecIndexViewModel } from "@/viewmodels/SpecIndexViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useSpecIndexViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<SpecIndexData>(createSpecIndexData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const vmRef = useRef<SpecIndexViewModel | null>(null);
  if (!vmRef.current) {
    vmRef.current = new SpecIndexViewModel(
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
