"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  ValidationAndDriftData,
  createValidationAndDriftData,
} from "@/generated/data/ValidationAndDriftData";
import { ValidationAndDriftViewModel } from "@/viewmodels/spec/ValidationAndDriftViewModel";

export function useSpecValidationAndDriftViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<ValidationAndDriftData>(createValidationAndDriftData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<ValidationAndDriftViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new ValidationAndDriftViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<ValidationAndDriftData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
