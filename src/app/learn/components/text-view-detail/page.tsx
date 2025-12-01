"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import TextViewDetail from "@/generated/components/TextViewDetail";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { TextViewDetailViewModel } from "@/viewmodels/TextViewDetailViewModel";

export default function TextViewDetailPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new TextViewDetailViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <TextViewDetail viewModel={viewModel} />
    </>
  );
}
