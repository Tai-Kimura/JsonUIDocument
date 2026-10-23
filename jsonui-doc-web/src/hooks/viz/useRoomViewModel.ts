"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { RoomData, createRoomData } from "@/generated/data/RoomData";
import { RoomViewModel } from "@/viewmodels/viz/RoomViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useRoomViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<RoomData>(createRoomData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<RoomViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new RoomViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<RoomData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
