"use client";

import { useRouter } from "next/navigation";
import Room from "@/generated/components/viz/Room";
import { useRoomViewModel } from "@/hooks/viz/useRoomViewModel";

export default function VizRoomPage() {
  const router = useRouter();
  const { data } = useRoomViewModel(router);
  return <Room data={data} />;
}
