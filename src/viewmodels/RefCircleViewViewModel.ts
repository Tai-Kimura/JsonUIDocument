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

export class RefCircleViewViewModel {
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

  get circleViewAttributes(): RefAttributeData[] {
    return [
      { name: "background", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_circle_view_background_desc") },
      { name: "borderWidth", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "float", description: StringManager.getString("ref_circle_view_border_width_desc") },
      { name: "borderColor", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_circle_view_border_color_desc") },
      { name: "fillColor", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_circle_view_fill_color_desc") },
      { name: "strokeColor", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_circle_view_stroke_color_desc") },
      { name: "strokeWidth", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "float", description: StringManager.getString("ref_circle_view_stroke_width_desc"), isLast: true },
    ];
  }
}
