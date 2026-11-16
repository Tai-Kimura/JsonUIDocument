"use client";

import { useRouter } from "next/navigation";
import Sessions from "@/generated/components/viz/Sessions";
import { useSessionsViewModel } from "@/hooks/viz/useSessionsViewModel";

export default function VizSessionsPage() {
  const router = useRouter();
  const { data } = useSessionsViewModel(router);
  return <Sessions data={data} />;
}
