"use client";

import { useRouter } from "next/navigation";
import CellClasses from "@/generated/components/spec/CellClasses";
import { useSpecCellClassesViewModel } from "@/hooks/spec/useSpecCellClassesViewModel";

export default function SpecCellClassesPage() {
  const router = useRouter();
  const { data } = useSpecCellClassesViewModel(router);
  return <CellClasses data={data} />;
}
