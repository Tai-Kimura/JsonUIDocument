// ChromeMount.tsx
// Hand-written client wrapper that instantiates the ChromeViewModel and
// renders the generated Chrome component alongside a pathname → VM bridge.
//
// Why this isn't auto-generated:
//   - jui's hook generator currently emits a hook per screen that has a
//     matching src/app/<path>/page.tsx (e.g. useHomeViewModel.ts). Chrome
//     is a site-wide chrome screen — no page route — so we hand-author
//     the equivalent plumbing here.
//   - The RootLayout mounts this as a sibling of {children}; see
//     src/app/layout.tsx. It must be a Client Component because it owns
//     the VM state and the usePathname() subscription.

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { Chrome as GeneratedChrome } from "@/generated/components/Chrome";
import { ChromeData, createChromeData } from "@/generated/data/ChromeData";
import { ChromeViewModel } from "@/viewmodels/ChromeViewModel";

export function ChromeMount() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  // Seed initial data with the current pathname so SSR produces HTML that
  // already highlights the active sidebar row (avoids a hydration flash
  // where the first render has no aria-current="page" and then flips).
  const [data, setData] = useState<ChromeData>(() => ({
    ...createChromeData(),
    activeUrl: pathname,
  }));
  const dataRef = useRef(data);
  dataRef.current = data;

  const vmRef = useRef<ChromeViewModel | null>(null);
  if (!vmRef.current) {
    vmRef.current = new ChromeViewModel(
      router,
      () => dataRef.current,
      setData,
    );
    // ViewModel's own onAppear seeds navItems + currentLanguage but not
    // activeUrl (it's external). Fire onRouteChange synchronously so the
    // VM state agrees with the initial React state from the start.
    vmRef.current.onRouteChange(pathname);
  }

  // Keep the VM in sync on subsequent pathname changes (client-side nav).
  useEffect(() => {
    vmRef.current?.onRouteChange(pathname);
  }, [pathname]);

  // Defer the first ColorManager read until after hydration so SSR and
  // client first-render agree on `currentColorMode: "light"`. The VM then
  // flips to the real current mode + subscribes for future changes.
  useEffect(() => {
    return vmRef.current?.mountColorMode();
  }, []);

  // Mirror the VM's current color mode onto <html data-color-mode>. The
  // [data-color-mode="dark"] rule in globals.css swaps every --color-*
  // token, which in turn flips every Tailwind class generated from the
  // layout JSONs (bg-surface, text-ink, etc.) without regenerating any
  // markup.
  useEffect(() => {
    document.documentElement.dataset.colorMode = data.currentColorMode;
  }, [data.currentColorMode]);

  return <GeneratedChrome data={data} />;
}

export default ChromeMount;
