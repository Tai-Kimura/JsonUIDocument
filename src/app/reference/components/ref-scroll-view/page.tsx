"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefScrollView from "@/generated/components/RefScrollView";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefScrollViewViewModel } from "@/viewmodels/RefScrollViewViewModel";

export default function RefScrollViewPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefScrollViewViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefScrollView viewModel={viewModel} />
    </>
  );
}
