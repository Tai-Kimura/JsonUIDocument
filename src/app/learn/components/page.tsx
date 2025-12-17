"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Header from "@/generated/components/Header";
import Components from "@/generated/components/Components";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { ComponentsViewModel } from "@/viewmodels/ComponentsViewModel";

export default function ComponentsPage() {
  const router = useRouter();
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(() => new ComponentsViewModel(router), [router]);

  return (
    <>
      <Header data={headerViewModel.data} />
      <Components data={viewModel.data} />
    </>
  );
}
