"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import SwitchDetail from "@/generated/components/SwitchDetail";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { SwitchDetailViewModel } from "@/viewmodels/SwitchDetailViewModel";

export default function SwitchDetailPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new SwitchDetailViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <SwitchDetail viewModel={viewModel} />
    </>
  );
}
