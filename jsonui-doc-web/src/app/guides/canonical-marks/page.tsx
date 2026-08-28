"use client";

import { useRouter } from "next/navigation";
import CanonicalMarks from "@/generated/components/guides/CanonicalMarks";
import { useCanonicalMarksViewModel } from "@/hooks/guides/useCanonicalMarksViewModel";

export default function GuidesCanonicalMarksPage() {
  const router = useRouter();
  const { data } = useCanonicalMarksViewModel(router);
  return <CanonicalMarks data={data} />;
}
