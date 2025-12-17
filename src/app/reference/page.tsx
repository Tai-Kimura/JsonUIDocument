"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Header from "@/generated/components/Header";
import Reference from "@/generated/components/Reference";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";

export default function ReferencePage() {
  const router = useRouter();
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);

  return (
    <>
      <Header data={headerViewModel.data} />
      <Reference />
    </>
  );
}
