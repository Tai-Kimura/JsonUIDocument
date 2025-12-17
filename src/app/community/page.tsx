"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Header from "@/generated/components/Header";
import Community from "@/generated/components/Community";
import { HeaderViewModel } from "@/viewmodels/HeaderViewModel";
import { CommunityViewModel } from "@/viewmodels/CommunityViewModel";

export default function CommunityPage() {
  const router = useRouter();
  const headerViewModel = useMemo(() => new HeaderViewModel(router), [router]);
  const communityViewModel = useMemo(() => new CommunityViewModel(), []);

  return (
    <>
      <Header data={headerViewModel.data} />
      <Community data={communityViewModel.data} />
    </>
  );
}
