"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefSafeAreaView from "@/generated/components/RefSafeAreaView";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefSafeAreaViewViewModel } from "@/viewmodels/RefSafeAreaViewViewModel";

export default function RefSafeAreaViewPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefSafeAreaViewViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefSafeAreaView viewModel={viewModel} />
    </>
  );
}
