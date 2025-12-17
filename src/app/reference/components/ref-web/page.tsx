"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefWeb from "@/generated/components/RefWeb";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefWebViewModel } from "@/viewmodels/RefWebViewModel";

export default function RefWebPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefWebViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefWeb data={viewModel.data} />
    </>
  );
}
