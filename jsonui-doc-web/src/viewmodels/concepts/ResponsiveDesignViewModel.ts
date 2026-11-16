// ViewModel for Concepts > Responsive design.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ResponsiveDesignData } from "@/generated/data/ResponsiveDesignData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ResponsiveDesignViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ResponsiveDesignData;
  protected _setData: (
    data: ResponsiveDesignData | ((prev: ResponsiveDesignData) => ResponsiveDesignData),
  ) => void;

  get data(): ResponsiveDesignData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => ResponsiveDesignData,
    setData: (
      data: ResponsiveDesignData | ((prev: ResponsiveDesignData) => ResponsiveDesignData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ResponsiveDesignData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ResponsiveDesignData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateConcepts: () => this.navigate("/"),
    });
  };

  // Initial seed runs during VM construction (= during render). Use the
  // SSR-safe getDefaultString so SSR + first client render produce
  // identical text. mountLanguage() re-seeds with the persisted locale
  // post-hydration. See jsonui-cli/docs/bugs/reports/2026-05-08-rjui-vm-
  // pre-resolve-string-hydration-mismatch.md for the upstream rationale.
  onAppear = () => {
    this.updateData({
      nextReadLinks: this.asCollection(this.buildNextReads(this.sDefault)),
    });
  };

  // Re-seed with persisted-locale strings. Called from a post-mount
  // useEffect in the hook + on every `jsonui:languagechange` event.
  mountLanguage = (): void => {
    this.updateData({
      nextReadLinks: this.asCollection(this.buildNextReads(this.s)),
    });
  };

  private buildNextReads = (lookup: (key: string) => string): NextReadCell[] => [
    {
      id: "next_one_layout_json",
      titleKey: lookup("next_one_layout_json_title"),
      descriptionKey: lookup("next_one_layout_json_description"),
      url: "/concepts/one-layout-json",
      onNavigate: () => this.navigate("/concepts/one-layout-json"),
    },
    {
      id: "next_hot_reload",
      titleKey: lookup("next_hot_reload_title"),
      descriptionKey: lookup("next_hot_reload_description"),
      url: "/concepts/hot-reload",
      onNavigate: () => this.navigate("/concepts/hot-reload"),
    },
  ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  // Persisted-locale lookup. Safe in event handlers and post-mount hooks,
  // unsafe in onAppear / constructor (use sDefault there).
  private s = (key: string): string =>
    StringManager.getString(`concepts_responsive_design_${key}`);

  // SSR-safe lookup (always returns the default-language value).
  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`concepts_responsive_design_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
