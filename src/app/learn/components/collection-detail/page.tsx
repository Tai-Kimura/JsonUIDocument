"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import CollectionDetail from "@/generated/components/CollectionDetail";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { CollectionDetailViewModel } from "@/viewmodels/CollectionDetailViewModel";

export default function CollectionDetailPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new CollectionDetailViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <CollectionDetail viewModel={viewModel} />
    </>
  );
}
