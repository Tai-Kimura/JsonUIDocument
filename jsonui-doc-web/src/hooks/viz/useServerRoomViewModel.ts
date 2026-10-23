"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ServerRoomData, createServerRoomData } from "@/generated/data/ServerRoomData";
import { ServerRoomViewModel } from "@/viewmodels/viz/ServerRoomViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useServerRoomViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ServerRoomData>(createServerRoomData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ServerRoomViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ServerRoomViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<ServerRoomData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
