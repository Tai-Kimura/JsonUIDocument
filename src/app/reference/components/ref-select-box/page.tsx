"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefSelectBox from "@/generated/components/RefSelectBox";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefSelectBoxViewModel } from "@/viewmodels/RefSelectBoxViewModel";

export default function RefSelectBoxPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefSelectBoxViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefSelectBox data={viewModel.data} />
    </>
  );
}
