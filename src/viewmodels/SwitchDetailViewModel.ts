import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface AttributeData {
  name: string;
  uikit: boolean;
  swiftui: boolean;
  compose: boolean;
  xml: boolean;
  react: boolean;
  type: string;
}

export class SwitchDetailViewModel {
  private router: AppRouterInstance;
  private _currentTab: number;
  private _setCurrentTab: (tab: number) => void;

  constructor(
    router: AppRouterInstance,
    currentTab: number,
    setCurrentTab: (tab: number) => void
  ) {
    this.router = router;
    this._currentTab = currentTab;
    this._setCurrentTab = setCurrentTab;
  }

  get currentTab(): number {
    return this._currentTab;
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };

  get switchAttributes(): AttributeData[] {
    return [
      { name: "value", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean" },
      { name: "tint", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string" },
      { name: "thumbTintColor", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string" },
      { name: "offTintColor", uikit: true, swiftui: false, compose: true, xml: false, react: false, type: "string" },
      { name: "onValueChange", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string" },
      { name: "enabled", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean" }
    ];
  }
}
