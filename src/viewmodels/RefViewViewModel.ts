import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

export class RefViewViewModel {
  private router: AppRouterInstance;
  private _currentTab: number;
  private _setCurrentTab: (tab: number) => void;

  constructor(
    router: AppRouterInstance,
    currentTab: number,
    setCurrentTab: (tab: number) => void) {
    this.router = router;
    this._currentTab = currentTab;
    this._setCurrentTab = setCurrentTab;
  }

  get currentTab(): number {
    return this._currentTab;
  }


  get data() {
    return {
      currentTab: this._currentTab,
      setCurrentTab: this._setCurrentTab,
      onTabChange: this.onTabChange,
      viewAttributes: this.viewAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get viewAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "orientation", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_view_attr_orientation_desc") },
      { name: "direction", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_view_attr_direction_desc") },
      { name: "gravity", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_view_attr_gravity_desc") },
      { name: "highlightBackground", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_view_attr_highlight_bg_desc") },
      { name: "highlighted", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "boolean", description: StringManager.getString("ref_view_attr_highlighted_desc") },
      { name: "canTap", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean", description: StringManager.getString("ref_view_attr_cantap_desc") },
      { name: "tapBackground", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_view_attr_tap_bg_desc") },
      { name: "onclick", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_view_attr_onclick_desc") },
      { name: "onClick", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_view_attr_onClick_desc") },
      { name: "onLongPress", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_view_attr_onlongpress_desc") },
      { name: "onPan", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_view_attr_onpan_desc") },
      { name: "onPinch", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_view_attr_onpinch_desc") },
      { name: "shadow", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "object", description: StringManager.getString("ref_view_attr_shadow_desc") },
      { name: "clipToBounds", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean", description: StringManager.getString("ref_view_attr_cliptobounds_desc") },
      { name: "userInteractionEnabled", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean", description: StringManager.getString("ref_view_attr_userinteraction_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
