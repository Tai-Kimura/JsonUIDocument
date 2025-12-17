"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefNetworkImage from "@/generated/components/RefNetworkImage";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefNetworkImageViewModel } from "@/viewmodels/RefNetworkImageViewModel";

export default function RefNetworkImagePage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefNetworkImageViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefNetworkImage data={viewModel.data} />
    </>
  );
}
