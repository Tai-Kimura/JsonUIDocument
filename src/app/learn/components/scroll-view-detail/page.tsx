"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import ScrollViewDetail from "@/generated/components/ScrollViewDetail";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { ScrollViewDetailViewModel } from "@/viewmodels/ScrollViewDetailViewModel";

export default function ScrollViewDetailPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new ScrollViewDetailViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <ScrollViewDetail viewModel={viewModel} />
    </>
  );
}
