"use client";

import { useRouter } from "next/navigation";
import ScreenReaders from "@/generated/components/guides/ScreenReaders";
import { useScreenReadersViewModel } from "@/hooks/guides/useScreenReadersViewModel";

export default function GuidesScreenReadersPage() {
  const router = useRouter();
  const { data } = useScreenReadersViewModel(router);
  return <ScreenReaders data={data} />;
}
