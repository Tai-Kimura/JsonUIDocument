"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefTextView from "@/generated/components/RefTextView";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefTextViewViewModel } from "@/viewmodels/RefTextViewViewModel";

export default function RefTextViewPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefTextViewViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefTextView viewModel={viewModel} />
    </>
  );
}
