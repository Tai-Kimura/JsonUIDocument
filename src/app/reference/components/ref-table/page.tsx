"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefTable from "@/generated/components/RefTable";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefTableViewModel } from "@/viewmodels/RefTableViewModel";

export default function RefTablePage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefTableViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefTable data={viewModel.data} />
    </>
  );
}
