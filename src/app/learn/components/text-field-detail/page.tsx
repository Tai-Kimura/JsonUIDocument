"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "@/generated/components/Header";
import TextFieldDetail from "@/generated/components/TextFieldDetail";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { TextFieldDetailViewModel } from "@/viewmodels/TextFieldDetailViewModel";

export default function TextFieldDetailPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const viewModel = useMemo(
    () => new TextFieldDetailViewModel(router, currentTab, setCurrentTab),
    [router, currentTab]
  );

  return (
    <>
      <Header viewModel={headerViewModel} />
      <TextFieldDetail viewModel={viewModel} />
    </>
  );
}
