"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefProgress from "@/generated/components/RefProgress";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefProgressViewModel } from "@/viewmodels/RefProgressViewModel";

export default function RefProgressPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefProgressViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefProgress data={viewModel.data} />
    </>
  );
}
