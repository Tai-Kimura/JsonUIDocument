"use client";

import { useRouter } from "next/navigation";
import ServerRoom from "@/generated/components/viz/ServerRoom";
import { useServerRoomViewModel } from "@/hooks/viz/useServerRoomViewModel";

export default function VizServerRoomPage() {
  const router = useRouter();
  const { data } = useServerRoomViewModel(router);
  return <ServerRoom data={data} />;
}
