// Pre-build script — renders the site's Apple Touch Icon (180x180 PNG)
// once and writes it to public/apple-icon.png. Same file-convention-
// avoidance story as gen-og-image.tsx: `output: "export"` in
// next.config.ts is incompatible with the Edge-runtime ImageResponse that
// Next's app-router icon file convention would emit on the fly, so we
// generate the asset ahead of the Next build and let the static export
// copy it as-is.
//
// Kept in visual sync with public/favicon.svg — same blue rounded
// background, same stacked-lines glyph with the kindei gold accent bar.
// Apple home screens render on top of an iOS wallpaper so a solid
// brand-blue plate reads more reliably than a transparent glyph.

import { ImageResponse } from "next/og";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import React from "react";

const SIZE = 180;
const CORNER = Math.round(SIZE * 0.22); // iOS masks this anyway — value is for PNG viewers that don't.

async function main(): Promise<void> {
  const response = new ImageResponse(
    (
      <div
        style={{
          width: SIZE,
          height: SIZE,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 14,
          background: "#2563EB",
          borderRadius: CORNER,
        }}
      >
        <div
          style={{
            width: 96,
            height: 14,
            borderRadius: 7,
            background: "#FFFFFF",
          }}
        />
        <div
          style={{
            width: 64,
            height: 14,
            borderRadius: 7,
            background: "rgba(255,255,255,0.85)",
          }}
        />
        <div
          style={{
            width: 82,
            height: 14,
            borderRadius: 7,
            background: "#D4A574",
          }}
        />
      </div>
    ),
    {
      width: SIZE,
      height: SIZE,
    },
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  const outPath = resolve(process.cwd(), "public/apple-icon.png");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buffer);
  console.log(`gen-apple-icon: wrote ${outPath} (${buffer.length} bytes)`);
}

main().catch((error) => {
  console.error("gen-apple-icon failed:", error);
  process.exit(1);
});
