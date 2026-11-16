// Next.js 14+ convention — this file is served at /robots.txt.

import type { MetadataRoute } from "next";

// Static-export mode (output: "export") requires this opt-in.
export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jsonui.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/debug-codeblock"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
