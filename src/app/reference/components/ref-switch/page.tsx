"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefSwitch from "@/generated/components/RefSwitch";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefSwitchViewModel } from "@/viewmodels/RefSwitchViewModel";

export default function RefSwitchPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefSwitchViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefSwitch viewModel={viewModel} />
    </>
  );
}
