"use client";

import { useRouter } from "next/navigation";
import Messages from "@/generated/components/viz/Messages";
import { useMessagesViewModel } from "@/hooks/viz/useMessagesViewModel";

export default function VizMessagesPage() {
  const router = useRouter();
  const { data } = useMessagesViewModel(router);
  return <Messages data={data} />;
}
