"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import SliderDetail from "@/generated/components/SliderDetail";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { SliderDetailViewModel } from "@/viewmodels/SliderDetailViewModel";

export default function SliderDetailPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new SliderDetailViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <SliderDetail viewModel={viewModel} />
    </>
  );
}
