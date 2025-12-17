"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefView from "@/generated/components/RefView";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefViewViewModel } from "@/viewmodels/RefViewViewModel";

export default function RefViewPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefViewViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefView data={viewModel.data} />
    </>
  );
}
