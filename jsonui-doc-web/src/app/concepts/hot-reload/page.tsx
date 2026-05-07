"use client";

import { useRouter } from "next/navigation";
import HotReload from "@/generated/components/concepts/HotReload";
import { useHotReloadViewModel } from "@/hooks/concepts/useHotReloadViewModel";

export default function ConceptsHotReloadPage() {
  const router = useRouter();
  const { data } = useHotReloadViewModel(router);
  return <HotReload data={data} />;
}
