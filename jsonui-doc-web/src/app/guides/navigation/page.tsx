"use client";

import { useRouter } from "next/navigation";
import Navigation from "@/generated/components/guides/Navigation";
import { useNavigationViewModel } from "@/hooks/guides/useNavigationViewModel";

export default function GuidesNavigationPage() {
  const router = useRouter();
  const { data } = useNavigationViewModel(router);
  return <Navigation data={data} />;
}
