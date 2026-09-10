"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { DiagramIndexData, createDiagramIndexData } from "@/generated/data/DiagramIndexData";
import { DiagramIndexViewModel } from "@/viewmodels/DiagramIndexViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useDiagramIndexViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<DiagramIndexData>(createDiagramIndexData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const vmRef = useRef<DiagramIndexViewModel | null>(null);
  if (!vmRef.current) {
    vmRef.current = new DiagramIndexViewModel(
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
