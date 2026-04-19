"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefCircleView from "@/generated/components/RefCircleView";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefCircleViewViewModel } from "@/viewmodels/RefCircleViewViewModel";

export default function RefCircleViewPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefCircleViewViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefCircleView data={viewModel.data} />
    </>
  );
}
