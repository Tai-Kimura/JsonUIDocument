"use client";

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { JsonSchemaData, createJsonSchemaData } from "@/generated/data/JsonSchemaData";
import { JsonSchemaViewModel } from "@/viewmodels/reference/JsonSchemaViewModel";

export function useJsonSchemaViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<JsonSchemaData>(createJsonSchemaData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<JsonSchemaViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new JsonSchemaViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<JsonSchemaData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
