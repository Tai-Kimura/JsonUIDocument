"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  WritingYourFirstSpecData,
  createWritingYourFirstSpecData,
} from "@/generated/data/WritingYourFirstSpecData";
import { WritingYourFirstSpecViewModel } from "@/viewmodels/guides/WritingYourFirstSpecViewModel";

export function useWritingYourFirstSpecViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<WritingYourFirstSpecData>(
    createWritingYourFirstSpecData(),
  );
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<WritingYourFirstSpecViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new WritingYourFirstSpecViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<WritingYourFirstSpecData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
