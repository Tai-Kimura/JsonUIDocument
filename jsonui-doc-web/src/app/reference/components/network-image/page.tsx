"use client";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  @generated AUTO-GENERATED FILE — DO NOT EDIT
// ║  Source:    scripts/build-attribute-reference.ts
// ║  Update docs/data/attribute-overrides/ and re-run `npm run build:attrs`.
// ╚══════════════════════════════════════════════════════════════════╝
import { useRouter } from "next/navigation";
import { useComponentReference } from "@/hooks/reference/useComponentReference";
import NetworkImage from "@/generated/components/reference/components/NetworkImage";

export default function Page() {
  const router = useRouter();
  const { data } = useComponentReference(router, "NetworkImage");
  return <NetworkImage data={data} />;
}
