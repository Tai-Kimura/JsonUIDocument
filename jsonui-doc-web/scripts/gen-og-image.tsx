// Pre-build script — renders the site-wide Open Graph PNG once and writes
// it to public/og-image.png. Replaces the app-router file-convention route
// (src/app/opengraph-image.tsx) because `output: "export"` in next.config.ts
// is incompatible with the Edge-runtime ImageResponse that next's file
// convention emits.
//
// The output is a plain static asset the static export copies as-is.
// layout.tsx references it explicitly via metadata.openGraph.images.

import { ImageResponse } from "next/og";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import React from "react";

const WIDTH = 1200;
const HEIGHT = 630;

async function main(): Promise<void> {
  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 96px",
          background:
            "radial-gradient(1200px 600px at 20% 0%, #1E3A8A 0%, transparent 60%), linear-gradient(180deg, #0B1220 0%, #0B1220 100%)",
          color: "#F9FAFB",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)",
            }}
          />
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "#F9FAFB",
            }}
          >
            JsonUI
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "#F9FAFB",
            }}
          >
            <div style={{ display: "flex" }}>Declarative UI,</div>
            <div style={{ display: "flex" }}>one JSON at a time.</div>
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              color: "#CBD5F5",
              maxWidth: 960,
            }}
          >
            Author screens once in JSON. JsonUI generates SwiftUI, Compose,
            and React — with ViewModels, bindings, and localization built in.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 32,
            borderTop: "1px solid #1F2937",
            color: "#94A3B8",
            fontSize: 22,
          }}
        >
          <div style={{ display: "flex", gap: 24 }}>
            <span>iOS</span>
            <span>·</span>
            <span>Android</span>
            <span>·</span>
            <span>Web</span>
          </div>
          <div style={{ color: "#CBD5F5", fontWeight: 500 }}>jsonui.dev</div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  const outPath = resolve(process.cwd(), "public", "og-image.png");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buffer);
  console.log(
    `[gen-og-image] wrote ${buffer.byteLength.toLocaleString()} bytes → ${outPath}`,
  );
}

main().catch((err) => {
  console.error("[gen-og-image] failed:", err);
  process.exit(1);
});
