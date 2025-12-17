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


  get gradientViewAttributes(): RefAttributeData[] {
    return [
      { name: "gradient", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "array", description: StringManager.getString("ref_gradient_view_gradient_desc") },
      { name: "gradientDirection", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_gradient_view_direction_desc") },
      { name: "locations", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "array", description: StringManager.getString("ref_gradient_view_locations_desc") },
      { name: "startPoint", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "array", description: StringManager.getString("ref_gradient_view_start_point_desc") },
      { name: "endPoint", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "array", description: StringManager.getString("ref_gradient_view_end_point_desc"), isLast: true },
    ];
  }
}
