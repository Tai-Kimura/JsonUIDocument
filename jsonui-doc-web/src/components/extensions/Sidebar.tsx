// Sidebar.tsx
// Web implementation of the Sidebar component spec.
// Spec: docs/components/json/sidebar.component.json
//
// Presentational left-rail navigation. All state (items, active route,
// collapsed sections, mobile-drawer state) arrives via props from the
// Chrome ViewModel — the component never reads localStorage or search-index
// directly. Section icons render via CSS mask-image against the SVGs under
// /images/icon_<iconName>.svg so the colour follows `currentColor`.

"use client";

import React from "react";
import Link from "next/link";

import { useLocalizedString } from "@/hooks/useLocalizedString";

interface SidebarSection {
  id: string;
  label: string;        // English label — used for SSR + first client render.
  labelKey: string;     // strings.json key — Sidebar swaps in the persisted locale post-mount.
  iconName: string;
  entries: SidebarEntry[];
}

type PlatformCode = "ios" | "android" | "web";

interface SidebarEntry {
  id: string;
  label: string;
  labelKey: string;
  url: string;
  platforms?: PlatformCode[];
}

const PLATFORM_LABEL_KEY: Record<PlatformCode, string> = {
  ios: "chrome_sidebar_platform_ios",
  android: "chrome_sidebar_platform_android",
  web: "chrome_sidebar_platform_web",
};

export interface SidebarProps {
  items: SidebarSection[];
  activeUrl: string;
  collapsedIds: string[];
  mobileOpen?: boolean;
  onToggleSection?: (id: string) => void;
  onLinkTap?: (url: string) => void;
  className?: string;
  id?: string;
}

// Both labels use the same hook pattern: render the English fallback during
// SSR and the first client render, then post-mount swap in the value
// resolved via StringManager (which depends on localStorage and would
// otherwise blow up hydration).
const LocalizedLabel: React.FC<{ labelKey: string; fallback: string }> = ({ labelKey, fallback }) => {
  const value = useLocalizedString(labelKey, fallback);
  return <>{value}</>;
};

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeUrl,
  collapsedIds,
  mobileOpen = false,
  onToggleSection,
  onLinkTap,
  className,
  id,
}) => {
  const ariaLabel = useLocalizedString("chrome_sidebar_aria_label", "Documentation navigation");
  const platformLabelIos = useLocalizedString(PLATFORM_LABEL_KEY.ios, "iOS");
  const platformLabelAndroid = useLocalizedString(PLATFORM_LABEL_KEY.android, "Android");
  const platformLabelWeb = useLocalizedString(PLATFORM_LABEL_KEY.web, "Web");
  const platformLabels: Record<PlatformCode, string> = {
    ios: platformLabelIos,
    android: platformLabelAndroid,
    web: platformLabelWeb,
  };
  const collapsedSet = new Set(collapsedIds ?? []);

  return (
    <aside
      id={id}
      className={`chrome-sidebar${className ? " " + className : ""}`}
      data-mobile-open={mobileOpen ? "true" : "false"}
      aria-label={ariaLabel}
    >
      <div className="chrome-sidebar__inner">
        {(items ?? []).map((section) => {
          const isOpen = !collapsedSet.has(section.id);
          const listId = `chrome-sidebar-list-${section.id}`;
          return (
            <div key={section.id} className="chrome-sidebar__section">
              <button
                type="button"
                className="chrome-sidebar__section-header"
                aria-expanded={isOpen}
                aria-controls={listId}
                onClick={() => onToggleSection?.(section.id)}
              >
                <span
                  className="chrome-sidebar__section-icon"
                  style={{
                    maskImage: `url(/images/icon_${section.iconName}.svg)`,
                    WebkitMaskImage: `url(/images/icon_${section.iconName}.svg)`,
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    maskSize: "contain",
                    WebkitMaskSize: "contain",
                    maskPosition: "center",
                    WebkitMaskPosition: "center",
                    backgroundColor: "currentColor",
                  }}
                  aria-hidden="true"
                />
                <span className="chrome-sidebar__section-label">
                  <LocalizedLabel labelKey={section.labelKey} fallback={section.label} />
                </span>
                <span
                  className="chrome-sidebar__section-chevron"
                  data-open={isOpen ? "true" : "false"}
                  style={{
                    maskImage: "url(/images/icon_chevron.svg)",
                    WebkitMaskImage: "url(/images/icon_chevron.svg)",
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    maskSize: "contain",
                    WebkitMaskSize: "contain",
                    backgroundColor: "currentColor",
                  }}
                  aria-hidden="true"
                />
              </button>
              <ul
                id={listId}
                className="chrome-sidebar__list"
                data-open={isOpen ? "true" : "false"}
                role="list"
              >
                {section.entries.map((entry) => {
                  const active = activeUrl === entry.url;
                  const platforms = entry.platforms;
                  return (
                    <li key={entry.id}>
                      <Link
                        href={entry.url}
                        className="chrome-sidebar__link"
                        aria-current={active ? "page" : undefined}
                        onClick={() => onLinkTap?.(entry.url)}
                      >
                        <span className="chrome-sidebar__link-label">
                          <LocalizedLabel labelKey={entry.labelKey} fallback={entry.label} />
                        </span>
                        {platforms && platforms.length > 0 ? (
                          <span
                            className="chrome-sidebar__platforms"
                            aria-hidden="false"
                          >
                            {platforms.map((p) => (
                              <span
                                key={p}
                                className="chrome-sidebar__platform-pill"
                                data-platform={p}
                              >
                                {platformLabels[p]}
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
