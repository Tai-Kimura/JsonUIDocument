"use client";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  @generated AUTO-GENERATED FILE — DO NOT EDIT
// ║  Source:    scripts/build-attribute-reference.ts
// ║  Update docs/data/attribute-overrides/ and re-run `npm run build:attrs`.
// ╚══════════════════════════════════════════════════════════════════╝
import { useRouter } from "next/navigation";
import { useComponentReference } from "@/hooks/reference/useComponentReference";
import SafeAreaView from "@/generated/components/reference/components/SafeAreaView";

export default function Page() {
  const router = useRouter();
  const { data } = useComponentReference(router, "SafeAreaView");
  return <SafeAreaView data={data} />;
}
