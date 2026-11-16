"use client";

// Hook wiring for Learn > Installation.
//
// Hand-authored because this screen's VM is not auto-generated via
// `jui build`'s hook pathway yet. Mirrors the structure of
// useHelloWorldViewModel so a future regeneration slotting this file under
// a generated hook is mechanical.

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  InstallationData,
  createInstallationData,
} from "@/generated/data/InstallationData";
import { InstallationViewModel } from "@/viewmodels/learn/InstallationViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useInstallationViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<InstallationData>(createInstallationData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<InstallationViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new InstallationViewModel(
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

  const setVars = (vars: Partial<InstallationData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
