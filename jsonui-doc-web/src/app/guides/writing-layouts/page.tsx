"use client";

import { useRouter } from "next/navigation";
import WritingLayouts from "@/generated/components/guides/WritingLayouts";
import { useWritingLayoutsViewModel } from "@/hooks/guides/useWritingLayoutsViewModel";

export default function GuidesWritingLayoutsPage() {
  const router = useRouter();
  const { data } = useWritingLayoutsViewModel(router);
  return <WritingLayouts data={data} />;
}
