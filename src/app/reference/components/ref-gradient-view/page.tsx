"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import RefGradientView from "@/generated/components/RefGradientView";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { RefGradientViewViewModel } from "@/viewmodels/RefGradientViewViewModel";

export default function RefGradientViewPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new RefGradientViewViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <RefGradientView viewModel={viewModel} />
    </>
  );
}
