"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Header from "@/generated/components/Header";
import Styling from "@/generated/components/Styling";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { LearnSubPageViewModel } from "@/viewmodels/LearnSubPageViewModel";

export default function StylingPage() {
  const router = useRouter();
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(() => new LearnSubPageViewModel(router), [router]);

  return (
    <>
      <Header viewModel={headerViewModel} />
      <Styling viewModel={viewModel} />
    </>
  );
}
