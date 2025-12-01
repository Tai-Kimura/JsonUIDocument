"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Header from "@/generated/components/Header";
import DataBinding from "@/generated/components/DataBinding";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { LearnSubPageViewModel } from "@/viewmodels/LearnSubPageViewModel";

export default function DataBindingPage() {
  const router = useRouter();
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(() => new LearnSubPageViewModel(router), [router]);

  return (
    <>
      <Header viewModel={headerViewModel} />
      <DataBinding viewModel={viewModel} />
    </>
  );
}
