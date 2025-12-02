"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefInclude from "@/generated/components/RefInclude";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefIncludeViewModel } from "@/viewmodels/RefIncludeViewModel";

export default function RefIncludePage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefIncludeViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefInclude viewModel={viewModel} />
    </>
  );
}
