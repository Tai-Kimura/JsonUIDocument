"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefSlider from "@/generated/components/RefSlider";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefSliderViewModel } from "@/viewmodels/RefSliderViewModel";

export default function RefSliderPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefSliderViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefSlider data={viewModel.data} />
    </>
  );
}
