"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ResponsiveDesignData, createResponsiveDesignData } from "@/generated/data/ResponsiveDesignData";
import { ResponsiveDesignViewModel } from "@/viewmodels/concepts/ResponsiveDesignViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useResponsiveDesignViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ResponsiveDesignData>(createResponsiveDesignData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ResponsiveDesignViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ResponsiveDesignViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  // Re-seed nextReadLinks with the persisted locale post-mount, and again
  // whenever StringManager fires a language-change event. The VM's initial
  // seed in onAppear uses StringManager.getDefaultString for SSR safety.
  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<ResponsiveDesignData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
