"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefCollection from "@/generated/components/RefCollection";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefCollectionViewModel } from "@/viewmodels/RefCollectionViewModel";

export default function RefCollectionPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefCollectionViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefCollection viewModel={viewModel} />
    </>
  );
}
