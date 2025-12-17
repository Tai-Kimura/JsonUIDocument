"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefIconLabel from "@/generated/components/RefIconLabel";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefIconLabelViewModel } from "@/viewmodels/RefIconLabelViewModel";

export default function RefIconLabelPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefIconLabelViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefIconLabel data={viewModel.data} />
    </>
  );
}
