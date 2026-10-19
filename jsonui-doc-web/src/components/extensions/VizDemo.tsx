"use client";
// VizDemo.tsx
// Spec: docs/components/json/viz-demo.component.json
//
// The jui viz demo in an iframe. The page is the folder that
// `jui viz export-demo` writes, served from public/tools/viz-demo/<jsonui-cli version>/. Its data
// is built in; it talks to no server and loads nothing from another origin.
//
// To refresh it (on every pin bump that changes the export):
//   jui viz export-demo --out <an empty folder>
// into public/tools/viz-demo/<version>/, point DEMO_SRC at it, and delete the
// old folder.
//
// Colour mode: the demo reads `data-theme` on its own <html> and watches it,
// so the site's mode is mirrored there. Only an attribute is set; nothing is
// added to the demo's document.

import React, { useCallback, useEffect, useRef } from "react";

import { ColorManager } from "@/generated/ColorManager";
import { useLocalizedString } from "@/hooks/useLocalizedString";

// Versioned path: deploy uploads every non-HTML file as immutable for a year,
// and the export keeps its file names, so a new export goes in a new folder.
const DEMO_SRC = "/tools/viz-demo/2.3.5/index.html";

interface VizDemoProps {
  id?: string;
  className?: string;
}

export const VizDemo: React.FC<VizDemoProps> = ({ id, className }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const title = useLocalizedString("tools_viz_demo_frame_title", "jui viz demo");

  const applyTheme = useCallback(() => {
    try {
      const root = frameRef.current?.contentDocument?.documentElement;
      if (root) root.dataset.theme = ColorManager.currentMode;
    } catch {
      // Not reachable before the frame loads; the load handler retries.
    }
  }, []);

  useEffect(() => {
    applyTheme();
    return ColorManager.subscribe(applyTheme);
  }, [applyTheme]);

  return (
    <div id={id} className={`viz-demo${className ? " " + className : ""}`}>
      <iframe
        ref={frameRef}
        className="viz-demo__frame"
        src={DEMO_SRC}
        title={title}
        loading="lazy"
        onLoad={applyTheme}
      />
    </div>
  );
};

export default VizDemo;
