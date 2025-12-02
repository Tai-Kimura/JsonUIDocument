"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefLabel from "@/generated/components/RefLabel";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefLabelViewModel } from "@/viewmodels/RefLabelViewModel";

export default function RefLabelPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefLabelViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefLabel viewModel={viewModel} />
    </>
  );
}
