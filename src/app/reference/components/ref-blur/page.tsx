"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefBlur from "@/generated/components/RefBlur";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefBlurViewModel } from "@/viewmodels/RefBlurViewModel";

export default function RefBlurPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefBlurViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefBlur viewModel={viewModel} />
    </>
  );
}
