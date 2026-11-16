"use client";

import { useEffect, useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { MessagesData, createMessagesData } from "@/generated/data/MessagesData";
import { MessagesViewModel } from "@/viewmodels/viz/MessagesViewModel";

const LANGUAGE_EVENT = "jsonui:languagechange";

export function useMessagesViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<MessagesData>(createMessagesData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<MessagesViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new MessagesViewModel(router, () => dataRef.current, setData);
  }

  useEffect(() => {
    viewModelRef.current?.mountLanguage();
    if (typeof window === "undefined") return;
    const onLang = () => viewModelRef.current?.mountLanguage();
    window.addEventListener(LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLang);
  }, []);

  const setVars = (vars: Partial<MessagesData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
