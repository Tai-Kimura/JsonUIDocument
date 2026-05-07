"use client";

import { useRouter } from "next/navigation";
import LayoutFile from "@/generated/components/spec/LayoutFile";
import { useSpecLayoutFileViewModel } from "@/hooks/spec/useSpecLayoutFileViewModel";

export default function SpecLayoutFilePage() {
  const router = useRouter();
  const { data } = useSpecLayoutFileViewModel(router);
  return <LayoutFile data={data} />;
}
