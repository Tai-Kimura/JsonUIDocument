"use client";

import { useRouter } from "next/navigation";
import CliCommands from "@/generated/components/reference/CliCommands";
import { useCliCommandsViewModel } from "@/hooks/reference/useCliCommandsViewModel";

export default function ReferenceCliCommandsPage() {
  const router = useRouter();
  const { data } = useCliCommandsViewModel(router);
  return <CliCommands data={data} />;
}
