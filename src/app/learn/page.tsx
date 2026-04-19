"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Header from "@/generated/components/Header";
import Learn from "@/generated/components/Learn";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { LearnSubPageViewModel } from "@/viewmodels/LearnSubPageViewModel";

export default function LearnPage() {
  const router = useRouter();
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(() => new LearnSubPageViewModel(router), [router]);

  return (
    <>
      <Header data={headerViewModel.data} />
      <Learn data={viewModel.data} />
    </>
  );
}
