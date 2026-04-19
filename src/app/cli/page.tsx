"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import { Cli } from "@/generated/components/Cli";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { CLIViewModel } from "@/viewmodels/CLIViewModel";

export default function CLIPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new CLIViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header data={headerViewModel.data} />
      <Cli data={viewModel.data} />
    </>
  );
}
