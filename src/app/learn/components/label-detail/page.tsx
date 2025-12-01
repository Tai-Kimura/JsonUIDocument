"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import LabelDetail from "@/generated/components/LabelDetail";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { LabelDetailViewModel } from "@/viewmodels/LabelDetailViewModel";

export default function LabelDetailPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new LabelDetailViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <LabelDetail viewModel={viewModel} />
    </>
  );
}
