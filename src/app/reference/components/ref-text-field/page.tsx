"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefTextField from "@/generated/components/RefTextField";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefTextFieldViewModel } from "@/viewmodels/RefTextFieldViewModel";

export default function RefTextFieldPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefTextFieldViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <RefTextField data={viewModel.data} />
    </>
  );
}
