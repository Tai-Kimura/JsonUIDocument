"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Header from "@/generated/components/Header";
import Learn from "@/generated/components/Learn";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";

export default function LearnPage() {
  const router = useRouter();
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);

  return (
    <>
      <Header viewModel={headerViewModel} />
      <Learn />
    </>
  );
}
