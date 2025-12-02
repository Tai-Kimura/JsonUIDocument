"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefImage from "@/generated/components/RefImage";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefImageViewModel } from "@/viewmodels/RefImageViewModel";

export default function RefImagePage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefImageViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefImage viewModel={viewModel} />
    </>
  );
}
