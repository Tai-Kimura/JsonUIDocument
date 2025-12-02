"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefCheck from "@/generated/components/RefCheck";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefCheckViewModel } from "@/viewmodels/RefCheckViewModel";

export default function RefCheckPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefCheckViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefCheck viewModel={viewModel} />
    </>
  );
}
