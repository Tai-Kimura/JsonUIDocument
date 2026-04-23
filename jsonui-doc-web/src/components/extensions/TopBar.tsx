// TopBar.tsx
// Web implementation of the TopBar component spec.
// Spec: docs/components/json/topbar.component.json
//
// Sticky site-wide header. Fixed at the viewport top; hosts the brand
// mark, the Search trigger (reuses the existing Search component), and a
// language toggle that flips StringManager. Hamburger button appears
// only under 1024px to reveal the Sidebar drawer — handled by CSS.

"use client";

import React from "react";
import Link from "next/link";

import { StringManager } from "@/generated/StringManager";
import { Search } from "./Search";

export interface TopBarProps {
  brandLabel?: string;
  brandHref?: string;
  currentLanguage: string;
  onToggleLanguage?: () => void;
  onToggleMobileMenu?: () => void;
  className?: string;
  id?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  brandLabel,
  brandHref = "/",
  currentLanguage,
  onToggleLanguage,
  onToggleMobileMenu,
  className,
  id,
}) => {
  // Brand label: if a snake_case key came in, the converter already
  // resolved it via StringManager; otherwise fall back to the chrome
  // brand name inline so the component never renders blank.
  const brandText =
    (brandLabel && brandLabel.length > 0 ? brandLabel : null) ??
    StringManager.getString("chrome_brand_name") ??
    "JsonUI";

  // The language toggle invites the user to switch INTO the opposite
  // language. If currentLanguage='en', label shows '日本語'.
  const toggleLabel =
    currentLanguage === "ja"
      ? StringManager.getString("chrome_lang_toggle_label_ja") || "English"
      : StringManager.getString("chrome_lang_toggle_label_en") || "日本語";

  return (
    <header
      id={id}
      className={`chrome-topbar${className ? " " + className : ""}`}
      aria-label={StringManager.getString("chrome_topbar_aria_label") || "Site header"}
    >
      <button
        type="button"
        className="chrome-topbar__menu-btn"
        onClick={() => onToggleMobileMenu?.()}
        aria-label={StringManager.getString("chrome_mobile_menu_open") || "Open navigation"}
      >
        <span
          style={{
            display: "inline-block",
            width: 18,
            height: 18,
            maskImage: "url(/images/icon_menu.svg)",
            WebkitMaskImage: "url(/images/icon_menu.svg)",
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
      </button>

      <Link href={brandHref} className="chrome-topbar__brand">
        <span className="chrome-topbar__brand-dot" aria-hidden="true" />
        <span className="chrome-topbar__brand-mark">{brandText}</span>
      </Link>

      <div className="chrome-topbar__spacer" />

      <div className="chrome-topbar__actions">
        <Search shortcut="cmd+k" maxResults={10} />
        <button
          type="button"
          className="chrome-lang-btn"
          onClick={() => onToggleLanguage?.()}
          aria-label={StringManager.getString("chrome_lang_toggle_aria_label") || "Switch language"}
        >
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              maskImage: "url(/images/icon_language.svg)",
              WebkitMaskImage: "url(/images/icon_language.svg)",
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
          {toggleLabel}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
