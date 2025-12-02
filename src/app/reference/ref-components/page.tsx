"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefComponents from "@/generated/components/RefComponents";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefComponentsViewModel } from "@/viewmodels/RefComponentsViewModel";

export default function RefComponentsPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefComponentsViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefComponents viewModel={viewModel} />
    </>
  );
}
