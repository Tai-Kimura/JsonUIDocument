"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefRadio from "@/generated/components/RefRadio";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefRadioViewModel } from "@/viewmodels/RefRadioViewModel";

export default function RefRadioPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefRadioViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefRadio data={viewModel.data} />
    </>
  );
}
