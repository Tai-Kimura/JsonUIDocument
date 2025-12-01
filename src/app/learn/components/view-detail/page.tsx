"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import ViewDetail from "@/generated/components/ViewDetail";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { ViewDetailViewModel } from "@/viewmodels/ViewDetailViewModel";

export default function ViewDetailPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new ViewDetailViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <ViewDetail viewModel={viewModel} />
    </>
  );
}
