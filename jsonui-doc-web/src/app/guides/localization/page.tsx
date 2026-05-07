"use client";

import { useRouter } from "next/navigation";
import Localization from "@/generated/components/guides/Localization";
import { useLocalizationViewModel } from "@/hooks/guides/useLocalizationViewModel";

export default function GuidesLocalizationPage() {
  const router = useRouter();
  const { data } = useLocalizationViewModel(router);
  return <Localization data={data} />;
}
