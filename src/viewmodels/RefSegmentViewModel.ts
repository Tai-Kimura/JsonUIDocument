import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

export class RefSegmentViewModel {
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
      segmentAttributes: this.segmentAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get segmentAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "items", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "array | binding", description: StringManager.getString("ref_segment_items_desc") },
      { name: "selectedIndex", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "integer | binding", description: StringManager.getString("ref_segment_selected_index_desc") },
      { name: "enabled", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "boolean | binding", description: StringManager.getString("ref_segment_enabled_desc") },
      { name: "tintColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "string | binding", description: StringManager.getString("ref_segment_tint_color_desc") },
      { name: "normalColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "string | binding", description: StringManager.getString("ref_segment_normal_color_desc") },
      { name: "selectedColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "string | binding", description: StringManager.getString("ref_segment_selected_color_desc") },
      { name: "valueChange", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_segment_value_change_desc") },
      { name: "momentary", uikitStatus: Y, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: N, type: "boolean", description: StringManager.getString("ref_segment_momentary_desc") },
      { name: "apportionsSegmentWidthsByContent", uikitStatus: Y, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: N, type: "boolean", description: StringManager.getString("ref_segment_apportions_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
