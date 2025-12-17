"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefIndicator from "@/generated/components/RefIndicator";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefIndicatorViewModel } from "@/viewmodels/RefIndicatorViewModel";

export default function RefIndicatorPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefIndicatorViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefIndicator data={viewModel.data} />
    </>
  );
}
