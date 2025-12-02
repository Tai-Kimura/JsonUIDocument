"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefDataBinding from "@/generated/components/RefDataBinding";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefDataBindingViewModel } from "@/viewmodels/RefDataBindingViewModel";

export default function RefDataBindingPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefDataBindingViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefDataBinding viewModel={viewModel} />
    </>
  );
}
