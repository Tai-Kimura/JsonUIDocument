"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefEvents from "@/generated/components/RefEvents";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefEventsViewModel } from "@/viewmodels/RefEventsViewModel";

export default function RefEventsPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefEventsViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefEvents viewModel={viewModel} />
    </>
  );
}
