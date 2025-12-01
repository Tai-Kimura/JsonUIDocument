import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface AttributeData {
  name: string;
  uikit: boolean;
  swiftui: boolean;
  compose: boolean;
  xml: boolean;
  react: boolean;
  type: string;
  isLast?: boolean;
}

export class ViewDetailViewModel {
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

  get viewAttributes(): AttributeData[] {
    return [
      { name: "orientation", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string" },
      { name: "direction", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string" },
      { name: "gravity", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string" },
      { name: "highlightBackground", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string" },
      { name: "highlighted", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "boolean" },
      { name: "canTap", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean" },
      { name: "tapBackground", uikit: true, swiftui: true, compose: false, xml: true, react: false, type: "string" },
      { name: "onclick", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string" },
      { name: "onClick", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string" },
      { name: "onLongPress", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string" },
      { name: "onPan", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string" },
      { name: "onPinch", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string" },
      { name: "shadow", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "JSON" },
      { name: "clipToBounds", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean" },
      { name: "userInteractionEnabled", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean", isLast: true }
    ];
  }
}
