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

import { useLocalizedString } from "@/hooks/useLocalizedString";
import { Search } from "./Search";

export interface TopBarProps {
  brandLabel?: string;
  brandHref?: string;
  currentLanguage: string;
  currentColorMode?: string;
  onToggleLanguage?: () => void;
  onToggleColorMode?: () => void;
  onToggleMobileMenu?: () => void;
  className?: string;
  id?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  brandLabel,
  brandHref = "/",
  currentLanguage,
  currentColorMode = "light",
  onToggleLanguage,
  onToggleColorMode,
  onToggleMobileMenu,
  className,
  id,
}) => {
  // Brand label: if a snake_case key came in, the converter already
  // resolved it via StringManager; otherwise fall back to the chrome
  // brand name inline so the component never renders blank.
  const localizedBrand = useLocalizedString("chrome_brand_name", "JsonUI");
  const brandText =
    (brandLabel && brandLabel.length > 0 ? brandLabel : null) ?? localizedBrand;

  // The language toggle invites the user to switch INTO the opposite
  // language. If currentLanguage='en', label shows '日本語'.
  const toggleLabelJa = useLocalizedString("chrome_lang_toggle_label_ja", "English");
  const toggleLabelEn = useLocalizedString("chrome_lang_toggle_label_en", "日本語");
  const toggleLabel = currentLanguage === "ja" ? toggleLabelJa : toggleLabelEn;

  // Theme toggle: show the icon of the mode the user will switch INTO.
  // When currentColorMode is 'dark', render sun (clicking goes to light).
  const themeIconHref =
    currentColorMode === "dark"
      ? "/images/icon_theme_light.svg"
      : "/images/icon_theme_dark.svg";
  const themeAriaLabelLight = useLocalizedString(
    "chrome_theme_toggle_to_light_aria_label",
    "Switch to light mode",
  );
  const themeAriaLabelDark = useLocalizedString(
    "chrome_theme_toggle_to_dark_aria_label",
    "Switch to dark mode",
  );
  const themeAriaLabel = currentColorMode === "dark" ? themeAriaLabelLight : themeAriaLabelDark;

  const topbarAriaLabel = useLocalizedString("chrome_topbar_aria_label", "Site header");
  const mobileMenuLabel = useLocalizedString("chrome_mobile_menu_open", "Open navigation");
  const langToggleAriaLabel = useLocalizedString("chrome_lang_toggle_aria_label", "Switch language");

  return (
    <header
      id={id}
      className={`chrome-topbar${className ? " " + className : ""}`}
      aria-label={topbarAriaLabel}
    >
      <button
        type="button"
        className="chrome-topbar__menu-btn"
        onClick={() => onToggleMobileMenu?.()}
        aria-label={mobileMenuLabel}
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
        <img
          src="/favicon.svg"
          width={22}
          height={22}
          alt=""
          aria-hidden="true"
          className="chrome-topbar__brand-icon"
        />
        <span className="chrome-topbar__brand-mark">{brandText}</span>
      </Link>

      <div className="chrome-topbar__spacer" />

      <div className="chrome-topbar__actions">
        <Search shortcut="cmd+k" maxResults={10} />
        <button
          type="button"
          className="chrome-lang-btn"
          onClick={() => onToggleLanguage?.()}
          aria-label={langToggleAriaLabel}
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
        <button
          type="button"
          className="chrome-theme-btn"
          onClick={() => onToggleColorMode?.()}
          aria-label={themeAriaLabel}
          data-color-mode={currentColorMode}
        >
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              maskImage: `url(${themeIconHref})`,
              WebkitMaskImage: `url(${themeIconHref})`,
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
      </div>
    </header>
  );
};

export default TopBar;
