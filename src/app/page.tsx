"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Header from "@/generated/components/Header";
import Home from "@/generated/components/Home";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { HomeViewModel } from "@/viewmodels/HomeViewModel";

export default function HomePage() {
  const router = useRouter();
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const homeViewModel = useMemo(() => new HomeViewModel(router), [router]);

  return (
    <>
      <Header data={headerViewModel.data} />
      <Home data={homeViewModel.data} />
    </>
  );
}
