"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefStyles from "@/generated/components/RefStyles";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefStylesViewModel } from "@/viewmodels/RefStylesViewModel";

export default function RefStylesPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefStylesViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefStyles data={viewModel.data} />
    </>
  );
}
