import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

export class RefSafeAreaViewViewModel {
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
      safeAreaViewAttributes: this.safeAreaViewAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get safeAreaViewAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "safeAreaInsetPositions", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "array", description: StringManager.getString("ref_safe_area_view_inset_positions_desc") },
      { name: "edges", uikitStatus: N, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "array", description: StringManager.getString("ref_safe_area_view_edges_desc") },
      { name: "All View attributes", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "-", description: StringManager.getString("ref_safe_area_view_inherits_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
