"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import Installation from "@/generated/components/Installation";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { InstallationViewModel } from "@/viewmodels/InstallationViewModel";

export default function InstallationPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new InstallationViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <Installation viewModel={viewModel} />
    </>
  );
}
