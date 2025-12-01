"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import ButtonDetail from "@/generated/components/ButtonDetail";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { ButtonDetailViewModel } from "@/viewmodels/ButtonDetailViewModel";

export default function ButtonDetailPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new ButtonDetailViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <ButtonDetail viewModel={viewModel} />
    </>
  );
}
