"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PlatformsIndexData, createPlatformsIndexData } from "@/generated/data/PlatformsIndexData";
import { PlatformsIndexViewModel } from "@/viewmodels/PlatformsIndexViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function usePlatformsIndexViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<PlatformsIndexData>(createPlatformsIndexData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const vmRef = useRef<PlatformsIndexViewModel | null>(null);
  if (!vmRef.current) {
    vmRef.current = new PlatformsIndexViewModel(
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
