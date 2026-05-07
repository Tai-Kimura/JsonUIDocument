"use client";

import { useRouter } from "next/navigation";
import DeveloperMenu from "@/generated/components/guides/DeveloperMenu";
import { useDeveloperMenuViewModel } from "@/hooks/guides/useDeveloperMenuViewModel";

export default function GuidesDeveloperMenuPage() {
  const router = useRouter();
  const { data } = useDeveloperMenuViewModel(router);
  return <DeveloperMenu data={data} />;
}
