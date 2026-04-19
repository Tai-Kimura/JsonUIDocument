"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import QuickStart from "@/generated/components/QuickStart";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { QuickStartViewModel } from "@/viewmodels/QuickStartViewModel";

export default function QuickStartPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new QuickStartViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <QuickStart data={viewModel.data} />
    </>
  );
}
