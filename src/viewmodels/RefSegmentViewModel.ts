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

export class RefSegmentViewModel {
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

  get segmentAttributes(): RefAttributeData[] {
    return [
      { name: "items", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "array/string", description: StringManager.getString("ref_segment_items_desc") },
      { name: "selectedIndex", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "integer/string", description: StringManager.getString("ref_segment_selected_index_desc") },
      { name: "enabled", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "boolean/string", description: StringManager.getString("ref_segment_enabled_desc") },
      { name: "tintColor", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_segment_tint_color_desc") },
      { name: "normalColor", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_segment_normal_color_desc") },
      { name: "selectedColor", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_segment_selected_color_desc") },
      { name: "valueChange", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_segment_value_change_desc") },
      { name: "momentary", uikit: true, swiftui: false, compose: false, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_segment_momentary_desc") },
      { name: "apportionsSegmentWidthsByContent", uikit: true, swiftui: false, compose: false, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_segment_apportions_desc"), isLast: true },
    ];
  }
}
