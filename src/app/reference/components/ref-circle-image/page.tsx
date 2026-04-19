"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefCircleImage from "@/generated/components/RefCircleImage";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefCircleImageViewModel } from "@/viewmodels/RefCircleImageViewModel";

export default function RefCircleImagePage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefCircleImageViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefCircleImage data={viewModel.data} />
    </>
  );
}
