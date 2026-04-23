"use client";

import { useRouter } from "next/navigation";
import WritingYourFirstSpec from "@/generated/components/guides/WritingYourFirstSpec";
import { useWritingYourFirstSpecViewModel } from "@/hooks/guides/useWritingYourFirstSpecViewModel";

export default function GuidesWritingYourFirstSpecPage() {
  const router = useRouter();
  const { data } = useWritingYourFirstSpecViewModel(router);
  return <WritingYourFirstSpec data={data} />;
}
