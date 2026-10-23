"use client";

import { useRouter } from "next/navigation";
import Approvals from "@/generated/components/viz/Approvals";
import { useApprovalsViewModel } from "@/hooks/viz/useApprovalsViewModel";

export default function VizApprovalsPage() {
  const router = useRouter();
  const { data } = useApprovalsViewModel(router);
  return <Approvals data={data} />;
}
