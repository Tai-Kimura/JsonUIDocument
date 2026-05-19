"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WhatIsJsonuiData, createWhatIsJsonuiData } from "@/generated/data/WhatIsJsonuiData";
import { WhatIsJsonuiViewModel } from "@/viewmodels/learn/WhatIsJsonuiViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useWhatIsJsonuiViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<WhatIsJsonuiData>(createWhatIsJsonuiData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<WhatIsJsonuiViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new WhatIsJsonuiViewModel(
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

  const setVars = (vars: Partial<WhatIsJsonuiData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
