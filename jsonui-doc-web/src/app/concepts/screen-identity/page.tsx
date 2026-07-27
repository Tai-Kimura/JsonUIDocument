"use client";

import { useRouter } from "next/navigation";
import ScreenIdentity from "@/generated/components/concepts/ScreenIdentity";
import { useScreenIdentityViewModel } from "@/hooks/concepts/useScreenIdentityViewModel";

export default function ConceptsScreenIdentityPage() {
  const router = useRouter();
  const { data } = useScreenIdentityViewModel(router);
  return <ScreenIdentity data={data} />;
}
