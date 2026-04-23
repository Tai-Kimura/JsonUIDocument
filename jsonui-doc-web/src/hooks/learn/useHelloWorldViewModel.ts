"use client";

// Hook wiring for Learn > Hello World.
//
// Hand-authored because this screen's VM is not auto-generated via
// `jui build`'s hook pathway yet. Mirrors the structure of the generated
// useHomeViewModel (src/generated/hooks/useHomeViewModel.ts) so a future
// regeneration slotting this file under a generated hook is mechanical.

import { useRef, useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { HelloWorldData, createHelloWorldData } from "@/generated/data/HelloWorldData";
import { HelloWorldViewModel } from "@/viewmodels/learn/HelloWorldViewModel";

export function useHelloWorldViewModel(router: AppRouterInstance) {
  const [data, setData] = useState<HelloWorldData>(createHelloWorldData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const viewModelRef = useRef<HelloWorldViewModel | null>(null);
  if (!viewModelRef.current) {
    viewModelRef.current = new HelloWorldViewModel(
      router,
      () => dataRef.current,
      setData,
    );
  }

  const setVars = (vars: Partial<HelloWorldData>) => {
    viewModelRef.current?.setVars(vars);
  };

  return { data, viewModel: viewModelRef.current, setVars };
}
