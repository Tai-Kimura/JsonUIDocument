"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefSegment from "@/generated/components/RefSegment";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefSegmentViewModel } from "@/viewmodels/RefSegmentViewModel";

export default function RefSegmentPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefSegmentViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefSegment viewModel={viewModel} />
    </>
  );
}
