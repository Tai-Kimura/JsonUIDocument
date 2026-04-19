"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Header from "@/generated/components/Header";
import Platforms from "@/generated/components/Platforms";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { PlatformsViewModel } from "@/viewmodels/PlatformsViewModel";

export default function PlatformsPage() {
  const router = useRouter();
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const platformsViewModel = useMemo(() => new PlatformsViewModel(), []);

  return (
    <>
      <Header data={headerViewModel.data} />
      <Platforms data={platformsViewModel.data} />
    </>
  );
}
