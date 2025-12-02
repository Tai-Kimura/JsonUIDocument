import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";

interface RefAttributeData {
  name: string;
  uikit: boolean;
  swiftui: boolean;
  compose: boolean;
  xml: boolean;
  react: boolean;
  type: string;
  description: string;
  isLast?: boolean;
}

export class RefViewViewModel {
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

  get viewAttributes(): RefAttributeData[] {
    return [
      { name: "orientation", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_view_attr_orientation_desc") },
      { name: "direction", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "string", description: StringManager.getString("ref_view_attr_direction_desc") },
      { name: "gravity", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_view_attr_gravity_desc") },
      { name: "highlightBackground", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_view_attr_highlight_bg_desc") },
      { name: "highlighted", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "boolean", description: StringManager.getString("ref_view_attr_highlighted_desc") },
      { name: "canTap", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean", description: StringManager.getString("ref_view_attr_cantap_desc") },
      { name: "tapBackground", uikit: true, swiftui: true, compose: false, xml: true, react: true, type: "string", description: StringManager.getString("ref_view_attr_tap_bg_desc") },
      { name: "onclick", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_view_attr_onclick_desc") },
      { name: "onClick", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_view_attr_onClick_desc") },
      { name: "onLongPress", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "string", description: StringManager.getString("ref_view_attr_onlongpress_desc") },
      { name: "onPan", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_view_attr_onpan_desc") },
      { name: "onPinch", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_view_attr_onpinch_desc") },
      { name: "shadow", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "JSON", description: StringManager.getString("ref_view_attr_shadow_desc") },
      { name: "clipToBounds", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean", description: StringManager.getString("ref_view_attr_cliptobounds_desc") },
      { name: "userInteractionEnabled", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean", description: StringManager.getString("ref_view_attr_userinteraction_desc"), isLast: true }
    ];
  }
}
