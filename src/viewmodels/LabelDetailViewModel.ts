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

export class LabelDetailViewModel {
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

  get labelAttributes(): AttributeData[] {
    return [
      { name: "text", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string" },
      { name: "font", uikit: true, swiftui: true, compose: false, xml: true, react: true, type: "string" },
      { name: "fontSize", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float" },
      { name: "fontColor", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string" },
      { name: "textAlign", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string" },
      { name: "lines", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "integer" },
      { name: "lineBreakMode", uikit: true, swiftui: true, compose: false, xml: true, react: true, type: "string" },
      { name: "underline", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "JSON" },
      { name: "strikethrough", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "JSON" },
      { name: "lineHeightMultiple", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "float" },
      { name: "partialAttributes", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "array" },
      { name: "linkable", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean" },
      { name: "hint", uikit: true, swiftui: true, compose: false, xml: true, react: true, type: "string" }
    ];
  }
}
