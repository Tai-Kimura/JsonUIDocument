"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefButton from "@/generated/components/RefButton";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefButtonViewModel } from "@/viewmodels/RefButtonViewModel";

export default function RefButtonPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefButtonViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefButton viewModel={viewModel} />
    </>
  );
}
