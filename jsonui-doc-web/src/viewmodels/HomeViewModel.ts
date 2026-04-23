// ViewModel for Home.
//
// Spec: docs/screens/json/home.spec.json
// Layout: docs/screens/layouts/home.json
//
// Site-wide chrome (TopBar + Sidebar) now owns navigation + language
// toggle + Search, so the home VM has been pared back: just seeds three
// card collections (featured / platforms / what's new) and funnels every
// CTA through a single navigate(url).
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { HomeData } from "@/generated/data/HomeData";
import { HomeViewModelBase } from "@/generated/viewmodels/HomeViewModelBase";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

/**
 * Hero → section transitions. 3 featured cards rendered below the hero
 * with a pre-wired navigation target each.
 */
interface FeaturedLink {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  iconName: string;
  onNavigate?: () => void;
}

interface PlatformCard {
  id: string;
  platform: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  accentColor: string;
  onNavigate?: () => void;
}

/**
 * "What's new" ribbon cells. Each row is an already-localized payload —
 * the cell layout simply binds title / blurb / ctaLabel to the strings
 * we hand it. The date is English-only (short form) by design.
 */
interface ChangelogCardCell {
  id: string;
  date: string;
  title: string;
  blurb: string;
  ctaLabel: string;
  ctaUrl: string;
  onTap: () => void;
}

/**
 * Hand-curated RECENT_CHANGES seed. Adding / removing entries is a
 * pure edit to this array; the cell layout stays unchanged.
 */
const RECENT_CHANGES_RAW: ReadonlyArray<{
  id: string;
  date: string;
  titleKey: string;
  blurbKey: string;
  ctaLabelKey: string;
  ctaUrl: string;
}> = [
  {
    id: "installation-oneliner",
    date: "Apr 2026",
    titleKey: "home_whats_new_installation_oneliner_title",
    blurbKey: "home_whats_new_installation_oneliner_blurb",
    ctaLabelKey: "home_whats_new_installation_oneliner_cta",
    ctaUrl: "/learn/installation",
  },
  {
    id: "pc-first-chrome",
    date: "Apr 2026",
    titleKey: "home_whats_new_pc_chrome_title",
    blurbKey: "home_whats_new_pc_chrome_blurb",
    ctaLabelKey: "home_whats_new_pc_chrome_cta",
    ctaUrl: "/concepts/one-layout-json",
  },
  {
    id: "agents-pack",
    date: "Apr 2026",
    titleKey: "home_whats_new_agents_title",
    blurbKey: "home_whats_new_agents_blurb",
    ctaLabelKey: "home_whats_new_agents_cta",
    ctaUrl: "/tools/agents",
  },
];

/**
 * HomeViewModel — seeds the three card collections on mount.
 *
 * Every hero CTA + card click funnels into a single `navigate(url)` so
 * future analytics / middleware has one spot to hook. Language toggle
 * lives on the site-wide TopBar now; this VM no longer re-seeds on
 * language change because generated string accessors pull from
 * StringManager at render time.
 */
export class HomeViewModel extends HomeViewModelBase {
  constructor(
    router: AppRouterInstance,
    getData: () => HomeData,
    setData: (data: HomeData | ((prev: HomeData) => HomeData)) => void
  ) {
    super(router, getData, setData);
    this.initializeEventHandlers();
    this.onAppear();
  }

  protected initializeEventHandlers = () => {
    this.updateData({
      onHeroInstallTap: () => this.navigate("/learn/installation"),
      onHeroAiAgentsTap: () => this.navigate("/tools/agents"),
      onHeroShowcaseTap: () => this.navigate("/platforms"),
    });
  };

  onAppear = () => {
    const featuredLinks: FeaturedLink[] = [
      {
        id: "get-started",
        titleKey: "home.featured.getStarted.title",
        descriptionKey: "home.featured.getStarted.description",
        url: "/learn/hello-world",
        iconName: "rocket",
      },
      {
        id: "ai-agents",
        titleKey: "home.featured.aiAgents.title",
        descriptionKey: "home.featured.aiAgents.description",
        url: "/tools/agents",
        iconName: "sparkles",
      },
      {
        id: "cross-platform-showcase",
        titleKey: "home.featured.showcase.title",
        descriptionKey: "home.featured.showcase.description",
        url: "/platforms",
        iconName: "grid",
      },
    ].map((link) => this.hydrateFeaturedLink(link));

    const platformCards: PlatformCard[] = [
      {
        id: "swift",
        platform: "Swift",
        titleKey: "home.platform.swift.title",
        descriptionKey: "home.platform.swift.description",
        url: "/platforms/swift",
        accentColor: "#F05138",
      },
      {
        id: "kotlin",
        platform: "Kotlin",
        titleKey: "home.platform.kotlin.title",
        descriptionKey: "home.platform.kotlin.description",
        url: "/platforms/kotlin",
        accentColor: "#7F52FF",
      },
      {
        id: "react",
        platform: "React",
        titleKey: "home.platform.react.title",
        descriptionKey: "home.platform.react.description",
        url: "/platforms/react",
        accentColor: "#2563EB",
      },
    ].map((card) => this.hydratePlatformCard(card));

    const recentChanges: ChangelogCardCell[] = RECENT_CHANGES_RAW.map((r) => ({
      id: r.id,
      date: r.date,
      title: StringManager.getString(r.titleKey),
      blurb: StringManager.getString(r.blurbKey),
      ctaLabel: StringManager.getString(r.ctaLabelKey),
      ctaUrl: r.ctaUrl,
      onTap: () => this.navigate(r.ctaUrl),
    }));

    this.updateData({
      featuredLinks: this.asCollection(featuredLinks),
      platformCards: this.asCollection(platformCards),
      recentChanges: this.asCollection(recentChanges),
    });
  };

  /**
   * Single navigation funnel. Hero CTAs and every cell's onNavigate /
   * onTap closure route through here so future analytics / middleware
   * has one spot to hook.
   */
  navigate = (url: string): void => {
    this.router.push(url);
  };

  /**
   * Wrap an array of cells in the single-section CollectionDataSource
   * shape rjui's generated Collection JSX expects:
   *   data.xxx?.sections?.[0]?.cells?.data
   */
  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };

  /**
   * Resolve the spec-style dot keys to displayed strings and seed the
   * per-row `onNavigate` closure.
   */
  private hydrateFeaturedLink = (link: FeaturedLink): FeaturedLink => ({
    ...link,
    titleKey: StringManager.getString(this.toSnake(link.titleKey)),
    descriptionKey: StringManager.getString(this.toSnake(link.descriptionKey)),
    onNavigate: () => this.navigate(link.url),
  });

  private hydratePlatformCard = (card: PlatformCard): PlatformCard => ({
    ...card,
    titleKey: StringManager.getString(this.toSnake(card.titleKey)),
    descriptionKey: StringManager.getString(this.toSnake(card.descriptionKey)),
    onNavigate: () => this.navigate(card.url),
  });

  /**
   * Convert dot-style string keys (spec style: "home.featured.getStarted.title")
   * to the snake_case keys StringManager was seeded with
   * (e.g. "home_featured_get_started_title").
   */
  private toSnake = (dotKey: string): string => {
    return dotKey
      .replace(/\./g, "_")
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .toLowerCase();
  };
}
