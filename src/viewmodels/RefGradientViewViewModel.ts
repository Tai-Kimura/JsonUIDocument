import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

export class RefGradientViewViewModel {
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
      gradientViewAttributes: this.gradientViewAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get gradientViewAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "gradient", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "array", description: StringManager.getString("ref_gradient_view_gradient_desc") },
      { name: "gradientDirection", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_gradient_view_direction_desc") },
      { name: "locations", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "array", description: StringManager.getString("ref_gradient_view_locations_desc") },
      { name: "startPoint", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "array", description: StringManager.getString("ref_gradient_view_start_point_desc") },
      { name: "endPoint", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "array", description: StringManager.getString("ref_gradient_view_end_point_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
