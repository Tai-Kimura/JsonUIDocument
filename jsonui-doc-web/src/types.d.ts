/**
 * Global custom type declarations for jsonui-doc-web.
 *
 * These types are referenced by generated Data models (e.g. HomeData uses
 * FeaturedLink[] and PlatformCard[]). They're declared globally so the
 * generator can emit the bare identifier without needing to author a
 * per-file import path.
 *
 * If you add a new custom type here, also register it in
 * `.jsonui-type-map.json` at the project root.
 */

declare global {
  /** Featured hero/card link rendered on the home screen. */
  interface FeaturedLink {
    id: string;
    titleKey: string;
    descriptionKey: string;
    url: string;
    iconName: string;
    /** Per-item navigate closure seeded by the ViewModel. */
    onNavigate?: () => void;
  }

  /** Platform showcase card (Swift / Kotlin / React) rendered on the home screen. */
  interface PlatformCard {
    id: string;
    platform: string;
    titleKey: string;
    descriptionKey: string;
    url: string;
    accentColor: string;
    /** Per-item navigate closure seeded by the ViewModel. */
    onNavigate?: () => void;
  }

  /**
   * Learn-track article catalog entry rendered by LearnIndex (embedded in
   * home's TabView and, later, at the standalone /learn route).
   * `onNavigate` is always present so the cell's binding resolves; upcoming
   * entries set it to a no-op closure.
   */
  interface LearnArticleCell {
    id: string;
    titleKey: string;
    descriptionKey: string;
    readTimeKey: string;
    statusKey: string;
    statusBackground: string;
    statusColor: string;
    cardOpacity: number;
    url: string;
    onNavigate: () => void;
  }
}

export {};
