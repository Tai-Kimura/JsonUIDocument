"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefAttributes from "@/generated/components/RefAttributes";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefAttributesViewModel } from "@/viewmodels/RefAttributesViewModel";

export default function RefAttributesPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefAttributesViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefAttributes viewModel={viewModel} />
    </>
  );
}
