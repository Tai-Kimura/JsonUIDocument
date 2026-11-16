"use client";

import { useRouter } from "next/navigation";
import WebFrameworkAdapters from "@/generated/components/guides/WebFrameworkAdapters";
import { useWebFrameworkAdaptersViewModel } from "@/hooks/guides/useWebFrameworkAdaptersViewModel";

export default function GuidesWebFrameworkAdaptersPage() {
  const router = useRouter();
  const { data } = useWebFrameworkAdaptersViewModel(router);
  return <WebFrameworkAdapters data={data} />;
}
