"use client";

import { useRouter } from "next/navigation";
import FirstScreen from "@/generated/components/learn/FirstScreen";
import { useFirstScreenViewModel } from "@/hooks/learn/useFirstScreenViewModel";

export default function LearnFirstScreenPage() {
  const router = useRouter();
  const { data } = useFirstScreenViewModel(router);
  return <FirstScreen data={data} />;
}
